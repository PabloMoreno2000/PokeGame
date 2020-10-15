const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const axios = require("axios");
const CardType = require("../../models/CardType");
const Card = require("../../models/Card");

router.post(
  "/addCardType",
  [check("name", "Please insert a name for the new type").exists()],
  async (req, res) => {
    try {
      const name = req.body.name;
      let cardType = await CardType.findOne({ name });
      if (cardType) {
        res.status(400).send("Card type already exists");
      } else {
        cardType = new CardType({ name });
        await cardType.save();
        res.json(cardType);
      }
    } catch (error) {
      console.log(error);
      res.statusMessage(500).send("Server error");
    }
  }
);

module.exports = router;
