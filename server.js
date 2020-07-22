const port = 80;

const express = require("express");
const app = express();
const server = app.listen(port);

const fs = require("fs");
const path = require("path");
const body_parser = require("body-parser");

const dataDirectory = path.join(__dirname, "./data/");
const mturkFile = dataDirectory + "/mturk.txt";
const transactionsFile = dataDirectory + "/transactions.txt";

app.set("view engine", "ejs");
app.use("/assets", express.static("assets"));
app.use(body_parser.urlencoded({ extended:true }));
app.use(body_parser.json({ limit:"100mb" }));

app.get("/", (req, res) => {
	res.render("index");
});

app.get("/mturk", async (req, res) => {
	if(await checkDataDirectory() && await checkMTurkFile()) {
		res.send(await getFileContent(mturkFile));
	}
});
app.get("/transactions", async (req, res) => {
	if(await checkDataDirectory() && await checkTransactionsFile()) {
		res.send(await getFileContent(transactionsFile));
	}
});

app.post("/mturk", async (req, res) => {
	let json = req.body.content;
	if(await checkDataDirectory() && await checkMTurkFile()) {
		updateMTurkStats(json);
	}
});

app.post("/addTransaction", async (req, res) => {
	if(await checkDataDirectory() && await checkTransactionsFile()) {

	}
});
app.post("/editTransaction", async (req, res) => {
	if(await checkDataDirectory() && await checkTransactionsFile()) {

	}
});
app.post("/deleteTransaction", async (req, res) => {
	if(await checkDataDirectory() && await checkTransactionsFile()) {

	}
});

function updateMTurkStats(json) {
	fs.writeFile(dataDirectory + "/mturk.txt", json, { encoding:"utf-8" }, function(error) {
		if(error) {
			console.log(error);
		}
	})
}

async function getFileContent(file) {
	let result = false;
	if(fs.existsSync(file)) {
		return fs.readFileSync(file,  function(error, content) {
			if(error) {
				console.log(error);
			}
		});
	}
	return result;
}

async function checkDataDirectory() {
	let exists = false;
	if(!fs.existsSync(dataDirectory)) {
		return fs.mkdirSync(dataDirectory, function(error) {
			if(error) {
				console.log(error);
			}
		});
	}
	else {
		exists = true;
	}
	return exists;
}
async function checkMTurkFile() {
	let exists = false;
	if(!fs.existsSync(mturkFile)) {
		return fs.writeFile(mturkFile, "", function(error) {
			if(error) {
				console.log(error);
			}
		});
	}
	else {
		exists = true;
	}
	return exists;
}
async function checkTransactionsFile() {
	let exists = false;
	if(!fs.existsSync(transactionsFile)) {
		return fs.writeFileSync(transactionsFile, "", function(error) {
			if(error) {
				console.log(error);
			}
		});
	}
	else {
		exists = true;
	}
	return exists;
}

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