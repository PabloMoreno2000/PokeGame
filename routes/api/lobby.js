const express = require("express");
const router = express.Router();
const config = require("config");
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const User = require("../../models/User");
// counter for lobby ids
let nextId = 0;

// id and room
var rooms = new Map();

// Room Arch
/*
roomId == id
player 1 == id
player 2 == id
ready1 == true
ready2 == true
*/

// @route  GET api/lobby/getState
// @desct  long polling for lobby
// @access Public
router.get("/getState/:id", function (req, res) {
  res.json(rooms.get(parseInt(req.params.id)));
});

// @route  POST api/lobby/create
// @desct  Create a lobby id for joining the game
// @access Public
router.post("/create", function (req, res) {
  const roomInfo = {
    roomId: nextId++,
    player1: null,
    player2: null,
    ready1: false,
    ready2: false,
  };
  rooms.set(nextId, roomInfo);
  res.json(roomInfo);
});

// @route  PUT api/lobby/join/:id
// @desct  Join existing lobby
// @access Private
router.put("/join/:lobbyId", auth, function (req, res) {
  if (!rooms.has(rooms.get(parseInt(req.params.lobbyId)))) {
    console.log("room doesnt exist");
    return res.status(404).send("Room not found");
  }
  var room = rooms.get(parseInt(req.params.lobbyId));
  if (room.player1 != null && room.player2 != null) {
    return res.status(400).send("Room full");
  }
  // Check if there's free space for player 1
  if (room.player1 == null) {
    room.player1 = req.user.id;
  } else {
    room.player2 = req.user.id;
  }
  rooms.set((parseInt(req.params.lobbyId), room));
  res.json(room);
});

// @route  GET api/lobby/getAll
// @desct  Get all lobbies
// @access Public
router.get("/getAll", function (req, res) {
  res.json(rooms);
});

module.exports = router;
