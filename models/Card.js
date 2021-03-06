const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "cardtype",
    required: true,
  },
  photo: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  pokemonInfo: {
    hp: {
      type: Number,
    },
    idtcgcard: {
      type: String,
      unique: true,
    },
    attacks: [
      {
        name: {
          type: String,
        },
        description: {
          type: String,
        },
        energy: {
          type: Number,
        },
        damage: {
          type: Number,
        },
      },
    ],
  },
  itemInfo: {
    effects: [
      {
        attribute: {
          type: String,
        },
        boost: {
          type: Number,
        },
      },
    ],
  },
});

module.exports = Subject = mongoose.model("card", CardSchema);
