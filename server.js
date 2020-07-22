const port = 80;

const express = require("express");
const app = express();
const server = app.listen(port);

const fs = require("fs");
const path = require("path");
const body_parser = require("body-parser");

app.set("view engine", "ejs");
app.use("/assets", express.static("assets"));
app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());

app.get("/", (req, res) => {
	res.render("index");
});

function validJSON(json) {
	try {
		let object = JSON.parse(json);
		if(object && typeof object === "object") {
			return object;
		}
	}
	catch(e) {
		console.log(e);
	}
	return false;
}