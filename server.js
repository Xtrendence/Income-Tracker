const port = 6969;
const scriptPath = process.cwd() + "\\server.js";

const express = require("express");
const app = express();
const server = app.listen(port);

const fs = require("fs");
const path = require("path");
const body_parser = require("body-parser");

const Service = require("node-windows").Service;

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

app.get("/install", (req, res) => {
	let svc = new Service({
		name:"Income Tracker",
		description:"Income Tracker",
		script:scriptPath
	});

	svc.on("install", function() {
		res.write("Service Installed");
		svc.start();
	});

	svc.on("alreadyinstalled", function() {
		res.write("Service Already Installed");
		svc.start();
	});

	svc.on("error", function(e) {
		res.write(e);
		svc.start();
	});

	svc.install();
});
app.get("/uninstall", (req, res) => {
	let svc = new Service({
		name:"Income Tracker",
		description:"Income Tracker",
		script:scriptPath
	});

	svc.on("uninstall", function() {
		res.write("Service Uninstalled");
		svc.stop();
	});

	svc.on("error", function(e) {
		res.write(e);
		svc.start();
	});

	svc.uninstall();
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
		if(validJSON(json) || empty(json)) {
			updateMTurkStats(json);
		}
	}
});

app.post("/addTransaction", async (req, res) => {
	let source = req.body.source;
	let amount = req.body.amount;
	let date = req.body.date;
	try {
		if(!empty(source) && !empty(amount) && !empty(date) && parseFloat(amount)) {
			if(await checkDataDirectory() && await checkTransactionsFile()) {
				let json = await getFileContent(transactionsFile);
				if(validJSON(json) || empty(json)) {
					let transactions = {};
					if(!empty(json)) {
						transactions = JSON.parse(json);
					}
					let pair = { [epoch()]: { source:source, amount:amount, date:date.replaceAll(" ", "") }};
					Object.assign(transactions, pair);
					fs.writeFile(transactionsFile, JSON.stringify(transactions), function(error) {
						if(error) {
							console.log(error);
						}
						else {
							res.send("done");
						}
					});
				}
			}
		}
	}
	catch(e) {
		console.log(e);
	}
});
app.post("/editTransaction", async (req, res) => {
	let id = req.body.id;
	let source = req.body.source;
	let amount = req.body.amount;
	let date = req.body.date;
	try {
		if(!empty(source) && !empty(amount) && !empty(date) && parseFloat(amount)) {
			if(await checkDataDirectory() && await checkTransactionsFile()) {
				let json = await getFileContent(transactionsFile);
				if(validJSON(json)) {
					let transactions = JSON.parse(json);
					transactions[id].source = source;
					transactions[id].amount = amount;
					transactions[id].date = date.replaceAll(" ", "");
					fs.writeFile(transactionsFile, JSON.stringify(transactions), function(error) {
						if(error) {
							console.log(error);
						}
						else {
							res.send("done");
						}
					});
				}
			}
		}
	}
	catch(e) {
		console.log(e);
	}
});
app.post("/deleteTransaction", async (req, res) => {
	let id = req.body.id;
	try {
		if(!empty(id)) {
			if(await checkDataDirectory() && await checkTransactionsFile()) {
				let json = await getFileContent(transactionsFile);
				if(validJSON(json)) {
					let transactions = JSON.parse(json);
					delete transactions[id];
					fs.writeFile(transactionsFile, JSON.stringify(transactions), function(error) {
						if(error) {
							console.log(error);
						}
						else {
							res.send("done");
						}
					});
				}
			}
		}
	}
	catch(e) {
		console.log(e);
	}
});

function updateMTurkStats(json) {
	let stats = JSON.parse(json);
	delete stats.hits;
	fs.writeFile(dataDirectory + "/mturk.txt", JSON.stringify(stats), { encoding:"utf-8" }, function(error) {
		if(error) {
			console.log(error);
		}
	})
}

async function getFileContent(file) {
	let result = "";
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

function epoch() {
	let date = new Date();
	let time = Math.round(date.getTime() / 1000);
	return time;
}

String.prototype.replaceAll = function(str1, str2, ignore) {
	return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}

function empty(string) {
	if(string !== null && typeof string !== "undefined" && string.toString().trim() !== "" && JSON.stringify(string) !== "" && JSON.stringify(string) !== "{}") {
		return false;
	}
	return true;
}

function validJSON(json) {
	try {
		let object = JSON.parse(json);
		if(object && typeof object === "object") {
			return object;
		}
	}
	catch(e) { }
	return false;
}