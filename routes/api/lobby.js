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
player 1 == {id, name}
player 2 == {id, name}
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
    roomId: ++nextId,
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
router.put("/join/:lobbyId", auth, async function (req, res) {
  if (!rooms.has(parseInt(req.params.lobbyId))) {
    console.log("room doesnt exist");
    return res.status(404).send("Room not found");
  }
  var room = rooms.get(parseInt(req.params.lobbyId));
  if (room.player1 != null && room.player2 != null) {
    return res.status(400).send("Room full");
  }
  // Check if there's free space for player 1
  if (room.player1 == null) {
    try {
      room.player1 = await User.findById(req.user.id).select("name");
    } catch (error) {
      console.log(error);
      return res.status(400).send("Bad request");
    }
  } else {
    if (req.user.id == room.player1._id) {
      return res.status(403).send("This player is already on the match");
    }

    try {
      room.player2 = await User.findById(req.user.id).select("name");
    } catch (error) {
      console.log(error);
      return res.status(400).send("Bad request");
    }
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

// @route  PUT api/lobby/ready/:id
// @desct  Changes the state of the ready flag for the corresponding player
// @access Private
router.put("/ready/:id", auth, function (req, res) {
  const userId = req.user.id;
  const room = rooms.get(parseInt(req.params.id));
  if (userId == room.player1._id) {
    room.ready1 = !room.ready1;
  } else if (userId == room.player2._id) {
    room.ready2 = !room.ready2;
  } else {
    return res.status(403).send("Access deniend");
  }
  res.json(room);
});

module.exports = router;
