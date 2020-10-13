const express = require("express");
const connectDB = require("./config/db");
const app = express();

const PORT = 5070;

// Connect to the database
connectDB();
// Ask the server to accept JSON objects in the body of the POST/GET requests
app.use(express.json({ extended: false }));

// Make a request to "http://localhost:5070" to see if it's running
app.get("/", (req, res) => res.send("API Running"));
app.use("/admin/managecards", require("./routes/admin/managecards"));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
