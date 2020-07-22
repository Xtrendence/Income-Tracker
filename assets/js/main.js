// TODO: Delete transaction, sort transactions by date, monthly earnings, mobile site, MTurk transfer adjustment.

document.addEventListener("DOMContentLoaded", function() {
	let body = document.getElementsByTagName("body")[0];

	let divOverlay = document.getElementsByClassName("overlay")[0];

	let divIncomeList = document.getElementsByClassName("income-list")[0];

	let buttonUpload = document.getElementsByClassName("footer-button upload")[0];
	let buttonAdd = document.getElementsByClassName("footer-button add")[0];

	let inputFile = document.getElementsByClassName("file-input")[0];

	let inputSource = document.getElementsByClassName("add-input source")[0];
	let inputAmount = document.getElementsByClassName("add-input amount")[0];
	let inputDate = document.getElementsByClassName("add-input date")[0];
	let buttonCancelAdd = document.getElementsByClassName("add action-button cancel")[0];
	let buttonConfirmAdd = document.getElementsByClassName("add action-button confirm")[0];

	let divAddWrapper = document.getElementsByClassName("add-wrapper")[0];

	let divChartWrapper = document.getElementsByClassName("chart-wrapper")[0];

	let spanTotalEarningsMTurk = document.getElementsByClassName("stats-total mturk")[0];
	let spanTotalEarningsOther = document.getElementsByClassName("stats-total other")[0];
	let spanTotalEarningsAdded = document.getElementsByClassName("stats-total added")[0];

	getTransactions();

	buttonUpload.addEventListener("click", function() {
		inputFile.click();
	});
	inputFile.addEventListener("change", function() {
		let file = inputFile.files[0];
		if(typeof file !== "undefined") {
			if(file.name.split(".").pop().toLowerCase() === "json") {
				let reader = new FileReader();
				reader.addEventListener("load", (e) => {
					let result = e.target.result;
					if(validJSON(result) || empty(result)) {
						updateMTurkStats(result);
					}
					else {
						console.log("Invalid JSON format.");
					}
					inputFile.value = "";
				});
				reader.readAsText(file);
			}
			else {
				console.log("JSON files only.");
			}
		}
	});

	buttonAdd.addEventListener("click", function() {
		if(divAddWrapper.classList.contains("hidden")) {
			showAdd("add");
		}
		else {
			hideAdd();
		}
	});
	buttonCancelAdd.addEventListener("click", function() {
		hideAdd();
	});
	buttonConfirmAdd.addEventListener("click", function() {
		let action = divAddWrapper.getAttribute("data-action");
		let id = divAddWrapper.getAttribute("data-id");
		let source = inputSource.value;
		let amount = inputAmount.value;
		let date = inputDate.value;
		inputSource.value = "";
		inputAmount.value = "";
		inputDate.value = "";
		switch(action) {
			case "add":
				addTransaction(source, amount, date);
				break;
			case "edit":
				editTransaction(id, source, amount, date);
				break;
		}
		hideAdd();
	});
	divAddWrapper.addEventListener("keydown", function(e) {
		if(e.key.toLowerCase() === "enter") {
			buttonConfirmAdd.click();
		}
	});
	divOverlay.addEventListener("click", function() {
		hideAdd();
	});

	function showAdd(action, args) {
		divOverlay.classList.remove("hidden");
		divAddWrapper.classList.remove("hidden");
		divAddWrapper.setAttribute("data-action", action);
		switch(action) {
			case "add":
				inputSource.value = "";
				inputAmount.value = "";
				inputDate.value = "";
				break;
			case "edit":
				inputSource.value = args.source;
				inputAmount.value = args.amount;
				inputDate.value = args.date;
				break;
		}
	}
	function hideAdd() {
		divOverlay.classList.add("hidden");
		divAddWrapper.classList.add("hidden");
		divAddWrapper.setAttribute("data-action", "add");
		divAddWrapper.setAttribute("data-id", "");
	}

	function getMTurkStats() {
		let xhr = new XMLHttpRequest();
		xhr.addEventListener("readystatechange", function() {
			if(xhr.readyState === XMLHttpRequest.DONE) {
				let json = xhr.responseText;
				if(validJSON(json)) {
					let stats = JSON.parse(json);
					let days = stats.days;
					let total = 0;
					let earnings = {};
					for(let i = 0; i < days.length; i++) {
						let day = days[i].day;
						let date = day.date;
						let earned = day.earnings;
						if(earned !== 0) {
							total += earned;
							let pair = { [date]:earned };
							Object.assign(earnings, pair);
						}
					}
					spanTotalEarningsMTurk.setAttribute("data-mturk", JSON.stringify(earnings));
					calculateMTurk(total);
				}
			}
		});
		xhr.open("GET", "/mturk", true);
		xhr.send();
	}
	function updateMTurkStats(json) {
		let xhr = new XMLHttpRequest();
		xhr.addEventListener("readystatechange", function() {
			if(xhr.readyState === XMLHttpRequest.DONE) {
				getTransactions();
			}
		});
		xhr.open("POST", "/mturk", true);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.send(JSON.stringify({ content:json }));
	}
	function calculateMTurk(total) {
		let xhr = new XMLHttpRequest();
		xhr.addEventListener("readystatechange", function() {
			if(xhr.readyState === XMLHttpRequest.DONE) {
				if(validJSON(xhr.responseText)) {
					let result = JSON.parse(xhr.responseText);
					let gbp = result.rates.GBP;
					total = total * gbp;
					spanTotalEarningsMTurk.textContent = "MTurk: £" + total.toFixed(2);
					calculateTotal();
				}
			}
		});
		xhr.open("GET", "https://api.exchangeratesapi.io/latest?base=USD", true);
		xhr.send();
	}

	function getTransactions() {
		let xhr = new XMLHttpRequest();
		xhr.addEventListener("readystatechange", function() {
			if(xhr.readyState === XMLHttpRequest.DONE) {
				spanTotalEarningsOther.textContent = "Other: £0";
				let json = xhr.responseText;
				if(validJSON(json)) {
					divIncomeList.innerHTML = "";
					let transactions = JSON.parse(json);
					let ids = Object.keys(transactions).reverse();
					let total = 0;
					for(let i = 0; i < ids.length; i++) {
						let div = document.createElement("div");
						div.classList.add("income-transaction");
						div.id = ids[i];
						div.innerHTML = '<div class="income-transaction-details"><span class="income-source">' + transactions[ids[i]].source + '</span><span class="income-amount">' + transactions[ids[i]].amount + '</span><span class="income-date">' + transactions[ids[i]].date + '</span></div><div class="income-transaction-actions hidden"><button class="income action-button back">Back</button><button class="income action-button edit">Edit</button><button class="income action-button delete">Delete</button></div>';

						div.addEventListener("click", function() {
							if(div.getElementsByClassName("income-transaction-actions")[0].classList.contains("hidden")) {
								div.getElementsByClassName("income-transaction-details")[0].classList.add("hidden");
								div.getElementsByClassName("income-transaction-actions")[0].classList.remove("hidden");
							}
							else {
								div.getElementsByClassName("income-transaction-details")[0].classList.remove("hidden");
								div.getElementsByClassName("income-transaction-actions")[0].classList.add("hidden");
							}
						});
						div.getElementsByClassName("income action-button edit")[0].addEventListener("click", function() {
							showAdd("edit", { source:transactions[ids[i]].source, amount:transactions[ids[i]].amount, date:transactions[ids[i]].date });
							divAddWrapper.setAttribute("data-id", ids[i]);
						});

						divIncomeList.appendChild(div);
						total += parseFloat(transactions[ids[i]].amount);
					}
					calculateTransactions(total);
				}
				getMTurkStats();
			}
		});
		xhr.open("GET", "/transactions", true);
		xhr.send();
	}
	function addTransaction(source, amount, date) {
		let xhr = new XMLHttpRequest();
		xhr.addEventListener("readystatechange", function() {
			if(xhr.readyState === XMLHttpRequest.DONE) {
				getTransactions();
			}
		});
		xhr.open("POST", "/addTransaction", true);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.send(JSON.stringify({ source:source, amount:amount, date:date }));
	}
	function editTransaction(id, source, amount, date) {
		let xhr = new XMLHttpRequest();
		xhr.addEventListener("readystatechange", function() {
			if(xhr.readyState === XMLHttpRequest.DONE) {
				getTransactions();
			}
		});
		xhr.open("POST", "/editTransaction", true);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.send(JSON.stringify({ id:id, source:source, amount:amount, date:date }));
	}
	function deleteTransaction(id) {
		let xhr = new XMLHttpRequest();
		xhr.addEventListener("readystatechange", function() {
			if(xhr.readyState === XMLHttpRequest.DONE) {
				getTransactions();
			}
		});
		xhr.open("POST", "/deleteTransaction", true);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.send(JSON.stringify({ id:id }));
	}
	function calculateTransactions(total) {
		let current = 0;
		if(!empty(spanTotalEarningsOther.textContent.replace("Other: £", ""))) {
			current = parseFloat(spanTotalEarningsOther.textContent.replace("Other: £", ""));
		}
		let updated = current + total;
		spanTotalEarningsOther.textContent = "Other: £" + updated.toFixed(2);
		calculateTotal();
	}
	function parseTransactionList() {
		let transactions = {};
		let divTransactions = document.getElementsByClassName("income-transaction");
		for(let i = 0; i < divTransactions.length; i++) {
			let divTransaction = divTransactions[i];
			let amount = divTransaction.getElementsByClassName("income-amount")[0].textContent.replace("£", "");
			let date = divTransaction.getElementsByClassName("income-date")[0].textContent;
			Object.assign(transactions, { [divTransaction.id]: { amount:parseFloat(amount), date:date }});
		}
		return transactions;
	}

	function parseEarnings() {
		divChartWrapper.innerHTML = "";

		let transactions = parseTransactionList();

		let currentDate = new Date();
		let currentMonth = "0" + (currentDate.getMonth() + 1).toString().slice(-2);

		let dates = {};

		let dataMTurk = spanTotalEarningsMTurk.getAttribute("data-mturk");
		if(!empty(dataMTurk)) {
			let statsMTurk = JSON.parse(spanTotalEarningsMTurk.getAttribute("data-mturk"));
			let times = Object.keys(statsMTurk);

			for(let i = 0; i < times.length; i++) {
				let time = times[i];
				let date = new Date(time);
				let day = ("0" + date.getDate()).slice(-2);
				let month = ("0" + parseInt(date.getMonth() + 1)).toString().slice(-2);
				if(month === currentMonth) {
					if(day in dates) {
						dates[day] = parseFloat(dates[day]) + parseFloat(statsMTurk[time]);
					}
					else {
						Object.assign(dates, { [day]:parseFloat(statsMTurk[time]) });
					}
				}
			}

			let ids = Object.keys(transactions);
			for(let i = 0; i < ids.length; i++) {
				let transaction = transactions[ids[i]];
				let transactionDay = transaction.date.split("/")[0];
				let transactionMonth = transaction.date.split("/")[1];
				if(transactionMonth === currentMonth) {
					if(transactionDay in dates) {
						dates[transactionDay] = parseFloat(dates[transactionDay]) + parseFloat(transaction.amount);
					}
					else {
						Object.assign(dates, { [transactionDay]:parseFloat(transaction.amount) });
					}
				}
			}

			let days = Object.keys(dates).sort(function(a, b) {
				return a.localeCompare(b);
			});;
			let earnings = [];

			for(let i = 0; i < days.length; i++) {
				earnings.push(parseFloat(dates[days[i]]).toFixed(2));
			}

			generateChart(days, earnings);
		}
	}

	function generateMonthlyEarnings() {

	}

	function generateChart(days, earnings) {
		let canvas = document.createElement("canvas");
		canvas.classList.add("chart");
		let contextChart = canvas.getContext("2d");
		let chart = new Chart(contextChart, {
			type:"line",
			data: {
				labels:days,
				datasets:[{
					label:"Earnings (£)",
					backgroundColor:"rgb(86,204,242)",
					borderColor:"rgb(50, 130, 240)",
					data:earnings
				}]
			}
		});
		divChartWrapper.appendChild(canvas);
	}

	function calculateTotal() {
		let added = parseFloat(spanTotalEarningsMTurk.textContent.replace("MTurk: £", "")) + parseFloat(spanTotalEarningsOther.textContent.replace("Other: £", ""));
		if(added.toString().toLowerCase() !== "nan") {
			spanTotalEarningsAdded.textContent = "Total: £" + added;
		}
		parseEarnings();
	}

	if(detectMobile()) {
		body.id = "mobile";
	}
	else {
		body.id = "desktop";
	}
});

function empty(string) {
	if(string !== null && typeof string !== "undefined" && string.toString().trim() !== "" && JSON.stringify(string) !== "" && JSON.stringify(string) !== "{}") {
		return false;
	}
	return true;
}

// Replace all occurrences in a string.
String.prototype.replaceAll = function(str1, str2, ignore) {
	return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
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

// Detect whether or not the user is on a mobile browser.
function detectMobile() {
	var check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	return check;
}