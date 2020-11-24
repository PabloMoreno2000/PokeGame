const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator/check");
const User = require("../../models/User");

// @route  POST api/user
// @desct  Register user
// @access Public/non-authentication/no-token
router.post(
  "/",
  [
    // Second parameter of check is a custom error message
    // Checks for the value of a json key called "name"
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    // The check is done with the second parameter of above within []
    // Pass the request whose body has a json element
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // 400 is for a bad request
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    const { name, email, password } = req.body;

    try {
      // Check if there's a user with that name (since we put name as unique)
      let user = await User.findOne({ name });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });
      }

      user = new User({
        name,
        email,
        password,
      });

      // 10 is recommended in documentation, the bigger the number means more security
      const salt = await bcrypt.genSalt(10);
      // Encrypt the password
      user.password = await bcrypt.hash(password, salt);
      // Remember that User is a moongose model and we connected moongose with our database
      await user.save();

      const payload = {
        user: {
          id: user.id, // Moongose gets the id of the database
        },
      };

      // Generate a JSON Web Token (encrypted payload with signature)
      jwt.sign(
        payload,
        process.env.jwtSecret || config.get("jwtSecret"), // encryption key
        { expiresIn: 360000 },
        // Callback
        (err, token) => {
          // If there's an error, throw it
          if (err) throw err;
          // Else, set in the json of the response this web token with
          // the user id that can be used for authentication after sign up
          res.json({ token });
        }
      );

      // res.send("User registered");
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
