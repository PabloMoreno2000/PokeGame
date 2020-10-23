const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const axios = require("axios");
const Card = require("../../models/Card");
const CardType = require("../../models/CardType");

const tcgUrl = "https://api.pokemontcg.io/v1";

router.post(
  "/createPokemonCard",
  [check("cardId", "Please insert a tcg card id").exists()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let response;
      const cardId = req.body.cardId;

      const type = await CardType.findOne({ name: "pokemon" });
      if (!type) {
        return res.status(400).json({ msg: "Card type not found" });
      }

      try {
        const link = `${tcgUrl}/cards/${cardId}`;
        response = await axios.get(link);
        response = response.data.card;
      } catch (error) {
        console.log(error);
        res.status(500).send("Invalid request to tcg");
      }

      let attacks = [];
      const attackCount = Math.min(2, response.attacks.length);
      for (let i = 0; i < attackCount; i++) {
        const attk = response.attacks[i];
        attack = {
          name: attk.name,
          description: attk.text,
          energy: Number(attk.convertedEnergyCost),
          damage: Number(attk.damage),
        };
        attacks.push(attack);
      }

      const pokemonCard = new Card({
        name: response.name,
        type: type._id,
        photo: response.imageUrl,
        description: "",
        pokemonInfo: {
          hp: Number(response.hp),
          idtcgcard: cardId,
          attacks: attacks,
        },
      });

      try {
        await pokemonCard.save();
      } catch (error) {
        return res.status(400).json({ msg: "Card already stored" });
      }

      res.json(pokemonCard);
    } catch (error) {
      console.log(error);
      res.status(500).send("server error");
    }
  }
);

router.post(
  "/createItemCard",
  [
    check("name", "Please insert a name").not().isEmpty(),
    check("photo", "Please insert a photo").exists(),
    check("description", "Please insert a description").exists(),
    check("itemInfo", "Please insert item info").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, photo, description, itemInfo } = req.body;

    if (!("effects" in itemInfo) || !Array.isArray(itemInfo["effects"])) {
      return res.status(400).send("itemInfo must have array effects");
    }

    for (let i = 0; i < itemInfo.effects.length; i++) {
      const effect = itemInfo.effects[i];
      if (!("attribute" in effect) || !("boost" in effect)) {
        return res
          .status(400)
          .send("Each effect must have attribute and boost");
      }
    }

    const itemType = await CardType.findOne({ name: "item" });
    const itemCard = new Card({
      name,
      type: itemType,
      photo: photo,
      description,
      itemInfo,
    });
    await itemCard.save();
    res.json(itemCard);
  }
);

module.exports = router;
