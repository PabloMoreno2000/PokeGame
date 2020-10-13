const mongoose = require("mongoose");

const CardTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

module.exports = Subject = mongoose.model("cardtype", CardTypeSchema);
