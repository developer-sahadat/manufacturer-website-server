const express = require("express");
require("dotenv").config();
var cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

/*****Express js mongodb crud operations start code*****/

/*****Express js mongodb crud operations end code*****/

app.get("/", (req, res) => {
  res.send("Hello Express Js");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
