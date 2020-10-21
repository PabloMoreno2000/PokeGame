const express = require("express");
const router = express.Router();
const config = require("config");
const { check, validationResult } = require("express-validator");
const Card = require("../../models/Card");
const CardType = require("../../models/CardType");
let nextGameId = 0;
let games = [];

// @route  GET api/game
// @desct
// @access Public/non-authentication/no-token
// Long polling for two players
router.get("/", async (req, res) => {});

router.get("/gameState/:id", async (req, res) => {
  // reutrn game state
  let x = 1;
});

router.post("/move/:id/:player", async (req, res) => {
  // reutrn game state
  let x = 1;
});

// TODO: Check that the IDs are valid in the DB
router.post(
  "/newGame",
  [
    check("player1", "Please specify a valid first player").exists(),
    check("player2", "Please specify a valid second player").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const deckN = 100;
    const playerHand = 8;
    const { player1, player2 } = req.body;

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
        cards: cards1,
        bench: [],
        activePokemon: {},
      },
      player2: {
        id: player2,
        cards: cards2,
        bench: [],
        activePokemon: {},
      },
      deck,
      turn: false,
      gameId: nextGameId,
    };
    games[nextGameId] = game;
    nextGameId++;
    res.send(game);
  }
);

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

    let newArr = array;
    while (newArr.length < n) {
      newArr = newArr.concat(array);
    }
    return newArr;
  };

  // Get card quantity
  const pokemonN = Math.floor(cardsNo * pokemons);
  const itemN = Math.floor(cardsNo * items);
  const energyN = Math.floor(cardsNo * energies);

  // Get all cards from each category
  let abc = types.pokemon.id;
  let pokemonCards = await Card.find({ type: types.pokemon.id });
  let itemCards = await Card.find({ type: types.item.id });
  let energyCards = await Card.find({ type: types.energy.id });

  // If there's a lack of cards, clone them
  pokemonCards = expandUntil(pokemonCards, pokemonN * repeatProb);
  itemCards = expandUntil(itemCards, itemN * repeatProb);
  energyCards = expandUntil(energyCards, energyN * repeatProb);

  // Select n cards from each category
  pokemonCards = getRandom(pokemonCards, pokemonN);
  itemCards = getRandom(itemCards, itemN);
  energyCards = getRandom(energyCards, energyN);

  // Add everything to an array
  // TODO: Shuffle result
  return pokemonCards.concat(itemCards).concat(energyCards);
}

async function getTypes() {
  let types = {
    pokemon: await CardType.findOne({ name: "pokemon" }),
    item: await CardType.findOne({ name: "item" }),
    energy: await CardType.findOne({ name: "energy" }),
  };
  return types;
}

module.exports = router;
