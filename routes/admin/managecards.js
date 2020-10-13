const express = require("express")
const router = express.Router();
const {check, validationResult} = require("express-validator")
const axios = require("axios");
const Card = require("../../models/Card");

const tcgUrl = "https://api.pokemontcg.io/v1";

router.post("/createPokemonCard/:cardId", async(req, res) => {
    try {
        let response;
        try {
            const link = `${tcgUrl}/cards/${req.params.cardId}`
            response = await axios.get(link)
            
        } catch (error) {
            console.log(error);
            res.status(500).send("Invalid request to tcg")
        }
        res.json(response.data)

    } catch (error) {
        console.log(error);
        res.status(500).send("server error")
    }
});

module.exports = router;