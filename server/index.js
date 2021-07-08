const express = require("express");
const cors = require("cors");

const app = express();
let data = "a,b,c\n1,2,3".split("\n").map(function (x) {
  return x.split(",");
});
const XLSX = require("xlsx");

function load_data(file) {
  let wb = XLSX.readFile(file);
  /* generate array of arrays */
  data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  console.log(data);
}

function post_data(req, res) {
  var keys = Object.keys(req.files),
    k = keys[0];
  load_data(req.files[k].path);
  res.status(200).send("ok\n");
}

app.use(cors());
app.use(require("express-formidable")());

app.post("/", function (req, res, next) {
  if (!req.files) return res.status(400).send("No file updated\n");
  return post_data(req, res);
});

const port = +process.argv[2] || +process.env.PORT || 8080;

app.listen(port, function () {
  console.log("Serving HTTP on port " + port);
});
