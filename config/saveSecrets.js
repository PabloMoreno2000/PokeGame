const fs = require("fs");
const path = require("path");
const original = require("./default.json");
// Puts a variable port inside a file as a json
const saveSecrets = () => {
  const data = JSON.stringify({
    mongoURI: process.env.mongoURI || original.mongoURI,
    jwtSecret: process.env.jwtSecret || original.jwtSecret,
  });
  fs.writeFile(path.join(__dirname, "default.json"), data, (error) => {
    if (error) {
      console.error(error);
    }
  });
};

module.exports = saveSecrets;
