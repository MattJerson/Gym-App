// This is also placeholders and will change once development has started

// backend/app.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Example endpoint
app.get("/", (req, res) => {
  res.send("API is running!");
});

// Add more routes here...
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
