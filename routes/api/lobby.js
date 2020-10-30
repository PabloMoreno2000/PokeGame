const express = require("express");
const router = express.Router();
const config = require("config");
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const User = require("../../models/User");

//TODO: 

// @route  GET api/lobby/getState
// @desct
// @access Private
// long polling for lobby


// @route  POST api/lobby/create
// @desct
// @access Private
// Create a lobby id for joining the game


// @route  PUT api/lobby/join/:id
// @desct
// @access Private
// Join existing lobby

// @route  GET api/lobby/:id
// @desct  Get lobby state by id
// @access Public

// @route  GET api/lobby/getAll
// @desct  Get all lobbies
// @access Public

