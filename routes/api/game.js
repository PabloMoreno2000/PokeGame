const express = require("express");
const router = express.Router();
const config = require("config");
const { check, validationResult } = require("express-validator");
const Card = require("../../models/Card");
const CardType = require("../../models/CardType");
const User = require("../../models/User");
const auth = require("../../middleware/auth");
const winAfterDefeating = 5;
let nextGameId = 0;
let games = [];
let types = undefined;

// @route  GET api/game
// @desct
// @access Private
// Long polling for two players
// game is the state of the game
router.get("/gameState/:gameId", [auth], async (req, res) => {
  try {
    const game = games[parseInt(req.params.gameId)];
    if (!game) {
      return res.status(400).send("Invalid game id");
    }
    let gameCopy = deepCopy(game);
    const userId = req.user.id;
    if (userId != game["player1"].id && req.user.id != game["player2"].id) {
      return res.status(403).send("Authorization denied");
    }

    const player = userId == game["player1"].id ? "player1" : "player2";
    const rival = player == "player1" ? "player2" : "player1";
    const types = await getTypes();
    const setTypeCardInfo = (card) => {
      let cardCopy = deepCopy(card);
      if (cardCopy.type == types.pokemon.id) {
        cardCopy.type = types.pokemon;
      } else if (cardCopy.type == types.item.id) {
        cardCopy.type = types.item;
      } else if (cardCopy.type == types.energy.id) {
        cardCopy.type = types.energy;
      }
      return cardCopy;
    };

    // Put the type info of each game
    gameCopy[player].hand = gameCopy[player].hand.map((card) => {
      return setTypeCardInfo(card);
    });
    gameCopy[player].bench = gameCopy[player].bench.map((card) => {
      return setTypeCardInfo(card);
    });
    gameCopy[rival].bench = gameCopy[rival].bench.map((card) => {
      return setTypeCardInfo(card);
    });

    // Rival's hand musn't be visible, just send the count
    gameCopy[rival].handCount = game[rival].hand.length;
    delete gameCopy[rival].hand;
    // Deck shouldn't be visible either
    delete gameCopy.deck;

    res.send(gameCopy);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server error");
  }
});

// @route  PUT api/game/endTurn
// @desct  Authenticated player can his/her turn
// @access Private
router.put(
  "/endTurn",
  [auth, check("gameId", "Please specify a game id").notEmpty()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let game = {};
    let player = "";
    const status = canPerformMove(req.body.gameId, req.user.id);
    if (!status.canMove) {
      return res.status(400).json({ msg: status.message });
    } else {
      game = status.game;
      player = status.player;
    }

    if (isObjectEmpty(game[player].activePokemon)) {
      return res.status(400).json("Can't pass turn withouth an active pkm");
    }

    switchTurn(game, player);
    res.json(game);
  }
);

// @route  PUT api/game/attack
// @desct  Authenticated player's active pokemon attacks enemy player's active pokemon
// @access Private
router.put(
  "/attack",
  [
    auth,
    [
      check("attackPos", "Invalid attack").not().isEmpty(),
      check("gameId", "Insert a game id").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { attackPos, gameId } = req.body;
    const playerId = req.user.id;
    let game = {};
    let player = "";

    const status = canPerformMove(gameId, playerId);
    if (!status.canMove) {
      return res.status(400).json({ msg: status.message });
    } else {
      game = status.game;
      player = status.player;
    }

    // Validate current player's attack
    const currPokemon = game[player].activePokemon;
    if (attackPos < 0 || attackPos >= currPokemon.pokemonInfo.attacks.length) {
      return res.status(400).json({ msg: "Invalid attack position" });
    }

    // Validate there's enough ENERGY with the pokemon
    if (
      currPokemon.pokemonInfo.currEnergy <
      currPokemon.pokemonInfo.attacks[attackPos].energy
    ) {
      return res.status(400).send("Not enought energy for this attack");
    }

    // Subtract health from enemy active pokemon
    const enemyPlayer = player == "player1" ? "player2" : "player1";
    const damage = currPokemon.pokemonInfo.attacks[attackPos].damage;
    game[enemyPlayer].activePokemon.pokemonInfo.currHp = Math.max(
      0,
      game[enemyPlayer].activePokemon.pokemonInfo.currHp - damage
    );

    // If enemy pokemon was defeated
    if (game[enemyPlayer].activePokemon.pokemonInfo.currHp == 0) {
      // Remove enemy pokemon
      game[enemyPlayer].activePokemon = {};
      // Increase counter of defeated pokemons
      game[player].defeatedPkms++;

      // If there are no pokemons in bench or the player has reached the required number to mean
      if (
        game[enemyPlayer].bench.length == 0 ||
        game[player].defeatedPkms >= winAfterDefeating
      ) {
        game.hasWon = player;
        return res.send(game);
      }
    }
    // Change turn after attack
    switchTurn(game, player);
    res.send(game);
  }
);

// @route  PUT api/game/pokemonHandToBench
// @desct Put energy to certain pokemon
// @access Private

// @route  PUT api/game/pokemonHandToBench
// @desct Puts a certain pokemon from the hand to the next available bench position
// @access Private
router.put(
  "/pokemonHandToBench",
  [
    auth,
    [
      check("gameId", "Please specify a game id").exists(),
      check("handPosition", "Please specify a valid hand position").exists(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gameId, handPosition } = req.body;
    const playerId = req.user.id;
    const benchQtyLimit = 5;
    let game = {};
    let player = "";

    const status = canPerformMove(gameId, playerId);
    if (!status.canMove) {
      return res.status(400).json({ msg: status.message });
    } else {
      game = status.game;
      player = status.player;
    }

    if (game[player].bench.length >= benchQtyLimit) {
      return res
        .status(400)
        .json({ msg: "Limit of pokemons in bench reached" });
    }

    // handPosition does start counting at 0
    if (handPosition >= game[player].hand.length) {
      return res.status(404).json({ msg: "Card not found in hand" });
    }
    // Add it to the bench, remove it from the hand if it is a pokemon
    // Splices removes/modifies the array and return the removed elements in an array
    const types = await getTypes();
    if (game[player].hand[handPosition].type == types.pokemon.id) {
      const card = game[player].hand.splice(handPosition, 1)[0];
      game[player].bench.push(card);
    } else {
      return res.status(400).json({ msg: "Card is not a pokemon" });
    }

    res.send(game);
  }
);

// @route  PUT api/game/pokemonBenchToActive
// @desct Puts a pokemon on the bench as active, if the active slot is empty, turn ends after this.
// @access Private
router.put(
  "/pokemonBenchToActive",
  [
    auth,
    [
      check("gameId", "Please specify a game id").exists(),
      check("benchPosition", "Please specify a valid hand position").exists(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gameId, benchPosition } = req.body;
    const playerId = req.user.id;
    let game = {};
    let player = "";

    const status = canPerformMove(gameId, playerId);
    if (!status.canMove) {
      return res.status(400).json({ msg: status.message });
    } else {
      game = status.game;
      player = status.player;
    }
    const rival = player == "player1" ? "player2" : "player1";

    if (game[player].bench.length == 0) {
      return res.status(400).json({ msg: "There are no pokemons in bench" });
    }

    // bench position starts from 0
    if (benchPosition >= game[player].bench.length) {
      return res.status(404).json({ msg: "Card not found" });
    }
    if (isObjectEmpty(game[player].activePokemon)) {
      // Splice wraps the result in an array, get the first position
      const card = game[player].bench.splice(benchPosition, 1)[0];
      game[player].activePokemon = card;

      // Change turn if this player was putting an active pkm and the other doesn't has
      // That means neither had active, so the match was starting
      if (isObjectEmpty(game[rival].activePokemon)) {
        game.turn = !game.turn;
        // Allow the player to use energy in the next turn
        game[player].turnEnergyUsed = false;
      }
    } else {
      return res.status(400).json({ msg: "There's already an active pokemon" });
    }

    return res.json(game);
  }
);

// @route  PUT api/game/useItemInActivePkm
// @desct uses an item in the active pokemon of the authenticated player
// @access Private
router.put(
  "/useItemInActivePkm",
  [
    auth,
    [
      check("gameId", "Please specify a game id").exists(),
      check("handItemPos", "Please specify an item in your hand").exists(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gameId, handItemPos } = req.body;
    const playerId = req.user.id;
    let game = {};
    let player = "";

    const status = canPerformMove(gameId, playerId);
    if (!status.canMove) {
      return res.status(400).json({ msg: status.message });
    } else {
      game = status.game;
      player = status.player;
    }

    if (isObjectEmpty(game[player].activePokemon)) {
      return res.status(400).send("There's no active pokemon");
    }

    if (handItemPos >= game[player].hand.length) {
      return res.status(404).send("Card not found");
    }

    const types = await getTypes();
    const card = game[player].hand[handItemPos];
    if (card.type != types.item.id) {
      return res.status(400).send("Specified card is not an item");
    }

    const applyItemToPokemon = (item, pokemon) => {
      pokemon = deepCopy(pokemon);
      const effects = item.itemInfo.effects;
      const pokeInfo = pokemon.pokemonInfo;
      effects.map((effect) => {
        switch (effect.attribute) {
          case "instant-heal":
            pokeInfo.currHp = Math.min(
              pokeInfo.maxHp,
              pokeInfo.currHp + effect.boost
            );
            break;

          case "turn-healing":
            pokeInfo.itemEffects.push({
              name: "turn-healing",
              boost: effect.boost,
              turnsLeft: 5,
            });
            break;

          default:
            console.log(`Item effect ${effect.attribute} not found`);
        }
      });
      return pokemon;
    };

    // For some reason, active pokemon is received as an array of 1 object
    game[player].activePokemon = applyItemToPokemon(
      card,
      game[player].activePokemon
    );
    // Remove item card
    game[player].hand.splice(handItemPos, 1)[0];

    res.send(game);
  }
);

// @route  PUT api/game/useEnergy
// @desct receives a energy card position and adds an energy point to a certain pkm
// @access Private
router.put(
  "/useEnergy",
  [
    auth,
    [
      check("gameId", "Please specify a game id").notEmpty(),
      check(
        "inGameIdEnergy",
        "Please specify the inGame id for the energy card"
      ).notEmpty(),
      check(
        "inGameIdPkm",
        "Please specify the inGame id for the pkm"
      ).notEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gameId, inGameIdEnergy, inGameIdPkm } = req.body;
    const playerId = req.user.id;
    let game = {};
    let player = "";
    const status = canPerformMove(gameId, playerId);
    if (!status.canMove) {
      return res.status(400).json({ msg: status.message });
    } else {
      game = status.game;
      player = status.player;
    }

    if (game[player].turnEnergyUsed) {
      return res.status(400).send("Already used energy in turn");
    }

    let response = grabCardForPlayer(gameId, inGameIdEnergy, playerId);
    // If card's not found in hand
    if (!response.card || response.foundIn != "hand") {
      return res.status(404).send("Energy card not found");
    }

    // If pkm card's not found in bench or active
    response = grabCardForPlayer(gameId, inGameIdPkm, playerId);
    if (
      !response.card ||
      (response.foundIn != "bench" && response.foundIn != "active")
    ) {
      return res.status(404).send("Pkm not found in bench or active");
    }

    // Increase pkm energy
    response.card.pokemonInfo.currEnergy++;
    game[player].turnEnergyUsed = true;

    // Delete energy card from hand
    deleteCardInContainer(gameId, inGameIdEnergy, "hand", playerId);

    return res.json(game);
  }
);

// TODO: Assure at least one pokemon to be in the hand of each player
router.post(
  "/newGame",
  [
    check("player1", "Please specify a valid first player").isMongoId(),
    check("player2", "Please specify a valid second player").isMongoId(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const deckN = 100;
    const playerHand = 8;
    const { player1, player2 } = req.body;

    try {
      let temp = await User.findById(player1);
      temp = await User.findById(player2);
    } catch (error) {
      return res.status(400).json({ msg: "Invalid users' id" });
    }

    // Create deck
    let deck = await createDeck(deckN + playerHand * 2, 0.25, 0.25, 0.5);

    // Distribute cards
    let result = getNewHandFromDeck(deck, playerHand);
    let cards1 = result.hand;
    deck = result.deck;

    result = getNewHandFromDeck(deck, playerHand);
    let cards2 = result.hand;
    deck = result.deck;

    const game = {
      player1: {
        id: player1,
        hand: cards1,
        bench: [],
        activePokemon: {},
        turnEnergyUsed: false,
        defeatedPkms: 0,
      },
      player2: {
        id: player2,
        hand: cards2,
        bench: [],
        activePokemon: {},
        turnEnergyUsed: false,
        defeatedPkms: 0,
      },
      deck,
      turn: true,
      gameId: nextGameId,
      hasWon: "",
    };
    games[nextGameId] = game;
    nextGameId++;
    res.send(game);
  }
);

function isObjectEmpty(object) {
  return Object.keys(object).length == 0;
}

// Generate a hand from the deck.
// Returns an object of the form { hand, resultingDeck }.
function getNewHandFromDeck(deck, handSize) {
  // Get a part of the deck
  let shuffled = deck.sort(() => 0.5 - Math.random());
  // At least one card must be a pkm
  const pokemonCard = shuffled.filter((card) => {
    return card.type == types.pokemon.id;
  })[0];
  // Delete the drawn pkm card from shuffled deck
  shuffled = shuffled.filter((card) => {
    return card.inGameId != pokemonCard.inGameId;
  });
  const hand = shuffled.slice(0, handSize - 1);
  hand.push(pokemonCard);
  return {
    hand,
    deck: shuffled.slice(handSize - 1),
  };
}

// Get n random elements from an array
function getRandom(array, n) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  let selected = shuffled.slice(0, n);
  return selected;
}

// Create the main deck of cards
async function createDeck(cardsNo, items, pokemons, energies) {
  const types = await getTypes();

  const repeatProb = 3;

  const expandUntil = (array, n) => {
    if (array.length == 0) {
      return array;
    }

    let newArr = [];
    while (newArr.length < n) {
      newArr = newArr.concat(deepCopy(array));
    }
    return newArr;
  };

  // Get card quantity
  const pokemonN = Math.floor(cardsNo * pokemons);
  const itemN = Math.floor(cardsNo * items);
  const energyN = Math.floor(cardsNo * energies);

  // Get all cards from each category
  let pokemonCards = await Card.find({ type: types.pokemon.id });
  let itemCards = await Card.find({ type: types.item.id });
  let energyCards = await Card.find({ type: types.energy.id });

  // Convert them to jsons to modify the "schema" and avoid risks
  pokemonCards = JSON.parse(JSON.stringify(pokemonCards));
  itemCards = JSON.parse(JSON.stringify(itemCards));
  energyCards = JSON.parse(JSON.stringify(energyCards));

  // In the database is okay to have "hp", in the game current hp and max hp are needed.
  pokemonCards = pokemonCards.map((pokemon) => {
    pokemon.pokemonInfo.currHp = pokemon.pokemonInfo.hp;
    pokemon.pokemonInfo.maxHp = pokemon.pokemonInfo.hp;
    pokemon.pokemonInfo.currEnergy = 0;
    // To store item effects applied during battle
    pokemon.pokemonInfo.itemEffects = [];
    delete pokemon.pokemonInfo.hp;
    return pokemon;
  });

  // If there's a lack of cards, clone them
  pokemonCards = expandUntil(pokemonCards, pokemonN * repeatProb);
  itemCards = expandUntil(itemCards, itemN * repeatProb);
  energyCards = expandUntil(energyCards, energyN * repeatProb);

  // Select n cards from each category
  pokemonCards = getRandom(pokemonCards, pokemonN);
  itemCards = getRandom(itemCards, itemN);
  energyCards = getRandom(energyCards, energyN);

  const deck = pokemonCards.concat(itemCards, energyCards);
  // Give an id to each card in game
  let nextId = 0;
  deck.forEach((card) => {
    card.inGameId = nextId;
    nextId++;
  });
  // return shuffled deck
  return deck.sort(() => 0.5 - Math.random());
}

function deleteCardInContainer(gameId, cardInGameId, containerName, playerId) {
  const game = games[gameId];
  if (!game || (playerId != game.player1.id && playerId != game.player2.id)) {
    return;
  }
  const player = playerId == game.player1.id ? "player1" : "player2";

  if (containerName == "hand") {
    game[player].hand = game[player].hand.filter((card) => {
      return String(card.inGameId) != cardInGameId;
    });
  } else if (containerName == "bench") {
    game[player].bench = game[player].bench.filter((card) => {
      return String(card.inGameId) != cardInGameId;
    });
  } else if (containerName == "deck") {
    game.deck = game.deck.filter((card) => {
      return String(card.inGameId) != cardInGameId;
    });
  }
}

// In another version this should replace every "handPos" and "benchPos" parameter in routes
function grabCardForPlayer(gameId, cardInGameId, playerId) {
  let foundIn = null;
  let searchedCard = null;
  const game = games[gameId];
  if (!game || (playerId != game.player1.id && playerId != game.player2.id)) {
    return null;
  }
  const player = playerId == game.player1.id ? "player1" : "player2";
  // Search in hand, bench and active
  game[player].hand.forEach((card) => {
    if (card.inGameId == cardInGameId) {
      searchedCard = card;
      foundIn = "hand";
      return;
    }
  });
  if (!searchedCard) {
    game[player].bench.forEach((card) => {
      if (card.inGameId == cardInGameId) {
        searchedCard = card;
        foundIn = "bench";
        return;
      }
    });
  }
  if (!searchedCard) {
    if (game[player].activePokemon.inGameId == cardInGameId) {
      searchedCard = game[player].activePokemon;
      foundIn = "active";
    }
  }
  if (!searchedCard) {
    game.deck.forEach((card) => {
      if (card.inGameId == cardInGameId) {
        searchedCard = card;
        foundIn = "deck";
        return;
      }
    });
  }
  return { card: searchedCard, foundIn };
}

async function getTypes() {
  if (!types) {
    types = {
      pokemon: await CardType.findOne({ name: "pokemon" }),
      item: await CardType.findOne({ name: "item" }),
      energy: await CardType.findOne({ name: "energy" }),
    };
  }
  return types;
}

function canPerformMove(gameId, playerId) {
  let result = {};
  const game = games[gameId];
  if (!game) {
    result.message = "Invalid game id";
    result.canMove = false;
  } else if (playerId != game.player1.id && playerId != game.player2.id) {
    result.message = "Player isn't part of the match";
    result.canMove = false;
  } else if (
    (game.turn && playerId == game.player2.id) ||
    (!game.turn && playerId == game.player1.id)
  ) {
    result.message = "It's not the turn of this player";
    result.canMove = false;
  } else {
    if (game.turn) {
      result.player = "player1";
    } else {
      result.player = "player2";
    }
    result.message = "";
    result.game = game;
    result.canMove = true;
  }

  return result;
}

const switchTurn = (game, player) => {
  const enemyPlayer = player == "player1" ? "player2" : "player1";
  // Technically this is the start of the next turn (of the enemy player)
  game.turn = !game.turn;
  // Allow attacking player to use energy in the next turn
  game[player].turnEnergyUsed = false;
  // Give the top card from the deck to the enemyPlayer for his/her turn start
  if (game.deck.length > 0) {
    const card = game.deck.splice(0, 1)[0];
    game[enemyPlayer].hand.push(card);
  }

  // Apply item effects to the active pokemon
  const enemyPkm = game[enemyPlayer].activePokemon;
  if (enemyPkm && enemyPkm.pokemonInfo) {
    const effects = enemyPkm.pokemonInfo.itemEffects;
    const applyAction = {
      "turn-healing": (boost, pokemon) =>
        (pokemon.pokemonInfo.currHp = Math.min(
          pokemon.pokemonInfo.maxHp,
          pokemon.pokemonInfo.currHp + boost
        )),
    };

    effects.map((effect) => {
      applyAction[effect.name](effect.boost, enemyPkm);
      if (--effect.turnsLeft == 0) {
        delete effect;
      }
    });
  }
};

function deepCopy(object) {
  return JSON.parse(JSON.stringify(object));
}

module.exports = router;
