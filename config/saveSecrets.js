const fs = require("fs");
const path = require("path");
const original = require("./default.json");
// Puts a variable port inside a file as a json
const saveSecrets = () => {
  const hasEnv = process.env.mongoURI && process.env.jwtSecret;
  const hasDefault = original && original.mongoURI && original.jwtSecret;
  let data = null;
  if (!hasDefault && !hasEnv) {
    console.error("Fata error: No mongoURI/jwtSecret");
  } else if (hasEnv) {
    data = JSON.stringify({
      mongoURI: process.env.mongoURI,
      jwtSecret: process.env.jwtSecret,
    });
  } else {
    data = JSON.stringify({
      mongoURI: original.mongoURI,
      jwtSecret: original.jwtSecret,
    });
  }
  console.log(
    hasEnv ? "Secrets set from process env" : "Secrets set from default"
  );
  fs.writeFile(path.join(__dirname, "default.json"), data, (error) => {
    if (error) {
      console.error(error);
    }
  });
};

module.exports = saveSecrets;
