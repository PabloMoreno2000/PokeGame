const express = require("express");
const router = express.Router();
const config = require("config");
const { check, validationResult } = require("express-validator");

// @route  GET api/game
// @desct
// @access Public/non-authentication/no-token
// Long polling for two players
router.get("/", async (req, res) => {});

router.get("/gameState/:id", async (req, res) => {
  // reutrn game state
});

router.post("/move/:id/:player", async (req, res) => {
  // reutrn game state
});
