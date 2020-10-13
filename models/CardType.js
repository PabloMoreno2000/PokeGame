const mongoose = require("mongoose");

const CardTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

module.exports = Subject = mongoose.model("cardtype", CardTypeSchema);
