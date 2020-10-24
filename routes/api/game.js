const express = require("express");
const router = express.Router();
const config = require("config");
const { check, validationResult } = require("express-validator");
const Card = require("../../models/Card");
const CardType = require("../../models/CardType");
const User = require("../../models/User");
const auth = require("../../middleware/auth");
let nextGameId = 0;
let games = [];
let types = undefined;

// @route  GET api/game
// @desct
// @access Private
// Long polling for two players
router.get("/gameState/:gameId", [auth], async (req, res) => {
  try {
    const game = games[req.params.gameId];
    if (!game) {
      return res.status(400).send("Invalid game id");
    }

    const userId = req.user.id;
    if (userId != game["player1"].id && req.user.id != game["player2"].id) {
      return res.status(403).send("Authorization denied");
    }

    res.send(game);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server error");
  }
});

// @route  PUT api/game/attack
// @desct  Authenticated player's active pokemon attacks enemy player's active pokemon
// @access Private
router.post(
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

    // Subtract health from enemy active pokemon
    const enemyPlayer = player == "player1" ? "player2" : "player1";
    const damage = currPokemon.pokemonInfo.attacks[attackPos].damage;
    game[enemyPlayer].activePokemon.currHp = Math.max(
      0,
      game[enemyPlayer].activePokemon.currHp - damage
    );

    // If enemy pokemon was defeated
    if (game[enemyPlayer].activePokemon.currHp == 0) {
      // Remove enemy pokemon
      game[enemyPlayer].activePokemon = {};

      // If there are no pokemons in bench
      if (game[enemyPlayer].bench.length == 0) {
        game.hasWon = player;
      }
    }
    // Change turn after attack
    game.turn = !game.turn;
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
    // Splices removes/modifies the array and return the removed elements
    const types = await getTypes();
    if (game[player].hand[handPosition].type == types.pokemon.id) {
      const card = game[player].hand.splice(handPosition, 1);
      game[player].bench.push(card);
    } else {
      return res.status(400).json({ msg: "Card is not a pokemon" });
    }

    res.send(game);
  }
);

// @route  PUT api/game/pokemonBenchToActive
// @desct Puts a pokemon on the bench as active, if the active slot is empty
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

    if (game[player].bench.length == 0) {
      return res.status(400).json({ msg: "There are no pokemons in bench" });
    }

    // bench position starts from 0
    if (benchPosition >= game[player].bench.length) {
      return res.status(404).json({ msg: "Card not found" });
    }
    if (isObjectEmpty(game[player].activePokemon)) {
      // Splice wraps the result in an array, get the first position
      const card = game[player].bench.splice(benchPosition, 1)[0][0];
      game[player].activePokemon = card;
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
    res.send(game);
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
      },
      player2: {
        id: player2,
        hand: cards2,
        bench: [],
        activePokemon: {},
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
  const shuffled = deck.sort(() => 0.5 - Math.random());
  return { hand: shuffled.slice(0, handSize), deck: shuffled.slice(handSize) };
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

  // TODO: Shuffle result
  return pokemonCards
    .concat(itemCards, energyCards)
    .sort(() => 0.5 - Math.random());
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

function deepCopy(object) {
  return JSON.parse(JSON.stringify(object));
}

module.exports = router;
