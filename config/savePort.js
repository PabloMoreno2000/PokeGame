const fs = require("fs");
const path = require("path");
// Puts a variable port inside a file as a json
const setPortOnDefault = (port) => {
  const data = JSON.stringify({ port });
  fs.writeFile(path.join(__dirname, "port.json"), data, (error) => {
    if (error) {
      console.error(error);
    }
  });
};

module.exports = setPortOnDefault;
