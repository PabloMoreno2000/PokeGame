const express = require("express");
const connectDB = require("./config/db");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 5070;

app.use(cors());
// Connect to the database
connectDB();
// Ask the server to accept JSON objects in the body of the POST/GET requests
app.use(express.json({ extended: false }));

// Make a request to "http://localhost:5070" to see if it's running
app.get("/", (req, res) => res.send("API Running"));
app.use("/admin/managecards", require("./routes/admin/managecards"));
app.use("/admin/managetypes", require("./routes/admin/managetypes"));
app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/game", require("./routes/api/game"));
app.use("/api/lobby", require("./routes/api/lobby"));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
