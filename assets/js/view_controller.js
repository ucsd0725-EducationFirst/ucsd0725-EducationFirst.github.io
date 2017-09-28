function CardForSchool(school, averages) {
	var card = $("<div class='card uni-card hoverable'>").attr({id: "school-" + school.key}).data({state: "closed"});
	var cardContent = $("<div class='card-content'>").appendTo(card);

	var minimize = $("<i>");
	minimize.addClass("material-icons right minimize-card");
	minimize.html('add');
	minimize.data({schoolID: school.key});

	var schoolName = $("<span class='school-name card-title'>").text(school.name);
	var loc = school.location.city + ", " + school.location.state;
	var schoolLoc = $("<span class='school-location'>").text(loc);

	var schoolInfo = $("<div class='school-info'>").hide();
	schoolInfo.append($("<br>")).append($("<div class='divider'>")).append("<br>");

	var statsRow = $("<div class='row'>").appendTo(schoolInfo);
	var statsCol = $("<div class='col s6'>").appendTo(statsRow);
	var imgCol = $("<div class='col s6'>").appendTo(statsRow);
	$("<h5>").text("Statistics").appendTo(statsCol);
	if (school.url) {
		$("<p>").append($("<a>").attr({href: "http://" + school.url, target: "_blank"}).text("School Website")).appendTo(statsCol)
	}
	if (school.demographics.size > 0) {
		$("<p>").text("Student Population: " + school.demographics.size).appendTo(statsCol);
	}
	if (school.demographics.female > 0 || school.demographics.male > 0) {
		var fPerc = Math.floor(school.demographics.female * 100);
		var mPerc = 100 - fPerc;
		$("<p>").text(fPerc + "% Female | " + mPerc + "% Male").appendTo(statsCol);
	}
	var withPluses = school.name.split(" ").join("+");
	$.get("https://api.duckduckgo.com/?q=" + withPluses + "&format=json").done(function(json) {
		try {
			json = JSON.parse(json);
			if (json.Image !== undefined && json.Image !== null) {
				$("<img class='school-logo'>").attr({src: json.Image}).appendTo(imgCol);
			}
		} catch (err) {
			console.log(err);
		}
	});

	$("<h5>").text("Admissions").appendTo(schoolInfo);
	$("<p>").text("TODO: Add test scores").appendTo(schoolInfo);

	var moneyRow = $("<div class='row'>").appendTo(schoolInfo);
	var tuitionCol = $("<div class='col s12 m6'>").appendTo(moneyRow);
	var repaymentCol = $("<div class='col s12 m6'>").appendTo(moneyRow);

	$("<h5>").text("Tuition").appendTo(tuitionCol);
	if (school.tuition.pell_grant_rate > 0) {
		var perc = Math.floor(school.tuition.pell_grant_rate * 100);
		$("<p>").html(perc + "% of students receive Pell Grants<br><br>").appendTo(tuitionCol);
	}
	if (school.tuition.in_state > 0 || school.tuition.out_state > 0) {
		var chartID = "tuition-" + school.key;
		var tuitionChart = $("<canvas class='card-chart'>").attr({id: chartID}).appendTo(tuitionCol);
		var ctx = tuitionChart[0].getContext("2d");
		new Chart(ctx, {
			type: 'bar',
			data: {
				labels: ["In State", "I.S. (Avg)", "Out of State", "O.S. (Avg)"],
				datasets: [{
					data: [
						school.tuition.in_state,
						Math.floor(averages["in-state-tuition"].average),
						school.tuition.out_state,
						Math.floor(averages["out-state-tuition"].average)
					],
					backgroundColor: [
						'rgba(226, 82, 56, 0.5)',
						'rgba(66, 134, 244, 0.5)',
						'rgba(198, 196, 81, 0.5)',
						'rgba(40, 214, 55, 0.5)'
					],
					borderColor: [
						'rgba(255,99,132,1)',
						'rgba(54, 162, 235, 1)',
						'rgba(255, 206, 86, 1)',
						'rgba(34, 117, 11, 0.5)'
					],
					borderWidth: 1.5
				}]
			},
			options: {
				legend: false,
				scales: {
					yAxes: [{
						scaleLabel: {
							display: true,
							labelString: "Tuition"
						},
						ticks: {
							min: 0,
							callback: function(value, index, values) {
								return "$" + value;
							}
						}
					}],
					xAxes: [{
						scaleLabel: {
							display: false
						}
					}]
				}
			}
		});
	} else {
		$("<p>").text("Tuition Data Unavailable").appendTo(tuitionCol);
	}

	$("<h5>").text("Repayment").appendTo(repaymentCol);
	if (school.repayment.median > 0) {
		$("<p>").html("Average Student Debt: $" + school.repayment.median + "<br><br>").appendTo(repaymentCol);
	}
	if (school.repayment["1_yr"] > 0) {
		var labels = ["1", "3", "5", "7"];
		var data = [
			Math.floor(school.repayment["1_yr"] * 100),
			Math.floor(school.repayment["3_yr"] * 100),
			Math.floor(school.repayment["5_yr"] * 100),
			Math.floor(school.repayment["7_yr"] * 100)
		];
		var chartID = "repayment-" + school.key;
		var repaymentChart = $("<canvas class='card-chart'>").attr({id: chartID}).appendTo(repaymentCol);
		var ctx = repaymentChart[0].getContext("2d");
		new Chart(ctx, {
			type: 'line',
			data: {
				"labels": labels,
				datasets: [{
					"data": data,
					backgroundColor: [ 'rgba(214, 249, 117, 0.7)' ],
					borderColor: [ 'rgba(158, 206, 24, 0.7)' ],
					borderWidth: 1.5
				}]
			},
			options: {
				legend: {
					display: false
				},
				scales: {
					yAxes: [{
						scaleLabel: {
							display: true,
							labelString: 'Completed Repayments'
						},
						ticks: {
							min: 50,
							max: 100,
							callback: function(value, index, values) {
								return value + "%";
							}
						}
					}],
					xAxes: [{
					  scaleLabel: {
						display: true,
						labelString: 'Years Out of School'
					  }
					}]
				}
			}
		});
	} else {
		$("<p>").text("Repayment Data Unavailable").appendTo(repaymentCol);
	}

	$("<h5>").text("Salaries").appendTo(schoolInfo);
	var salaryRow = $("<div class='row'>").appendTo(schoolInfo);
	var startingCol = $("<div class='col s12 m6'>").appendTo(salaryRow);
	var eventualCol = $("<div class='col s12 m6'>").appendTo(salaryRow);
	if (school.salary.starting["10"] > 0) {
		$("<p>").html("Starting Salary<br><br>").appendTo(startingCol);
		var chartID = "salary-s-" + school.key;
		var salaryChart = $("<canvas class='card-chart'>").attr({id: chartID}).appendTo(startingCol);
		var ctx = salaryChart[0].getContext("2d");
		new Chart(ctx, {
			type: 'bar',
			data: {
				labels: ["10", "25", "50", "75", "90"],
				datasets: [{
					data: [
						school.salary.starting["10"],
						school.salary.starting["25"],
						school.salary.starting["25"],
						school.salary.starting["50"],
						school.salary.starting["75"]
					],
					backgroundColor: [
						'rgba(205, 9, 242, 0.8)',
						'rgba(205, 9, 242, 0.8)',
						'rgba(205, 9, 242, 0.8)',
						'rgba(205, 9, 242, 0.8)',
						'rgba(205, 9, 242, 0.8)'
					],
					borderColor: [
						'rgba(45, 43, 45,0.8)',
						'rgba(45, 43, 45,0.8)',
						'rgba(45, 43, 45,0.8)',
						'rgba(45, 43, 45,0.8)',
						'rgba(45, 43, 45,0.8)'

					],
					borderWidth: 1.6
				}]
			},
			options: {
				legend: {
					display: false
				},
				scales: {
					yAxes: [{
						scaleLabel: {
							display: true,
							labelString: 'Earnings'
						},
						ticks: {
							min: 0,
							max: 180000,
							callback: function(value, index, values) {
								return "$" + value;
							}
						}
					}],
					xAxes: [{
						scaleLabel: {
							display: true,
							labelString: 'Percentile'
						}
					}]
				}
			}
		});
	} else {
		$("<p>").text("Salary Data Unavailable").appendTo(startingCol);
	}
	if (school.salary.eventual["10"] > 0) {
		$("<p>").html("Long Term Salary<br><br>").appendTo(eventualCol);
		var chartID = "salary-e-" + school.key;
		var salaryChart = $("<canvas class='card-chart'>").attr({id: chartID}).appendTo(eventualCol);
		var ctx = salaryChart[0].getContext("2d");
		new Chart(ctx, {
			type: 'bar',
			data: {
				labels: ["10", "25", "50", "75", "90"],
				datasets: [{
					data: [
						school.salary.eventual["10"],
						school.salary.eventual["25"],
						school.salary.eventual["25"],
						school.salary.eventual["50"],
						school.salary.eventual["75"]
					],
					backgroundColor: [
						'rgba(205, 9, 242, 0.8)',
						'rgba(205, 9, 242, 0.8)',
						'rgba(205, 9, 242, 0.8)',
						'rgba(205, 9, 242, 0.8)',
						'rgba(205, 9, 242, 0.8)'
					],
					borderColor: [
						'rgba(45, 43, 45,0.8)',
						'rgba(45, 43, 45,0.8)',
						'rgba(45, 43, 45,0.8)',
						'rgba(45, 43, 45,0.8)',
						'rgba(45, 43, 45,0.8)'

					],
					borderWidth: 1.6
				}]
			},
			options: {
				legend: {
					display: false
				},
				scales: {
					yAxes: [{
						scaleLabel: {
							display: true,
							labelString: 'Earnings'
						},
						ticks: {
							min: 0,
							max: 180000,
							callback: function(value, index, values) {
								return "$" + value;
							}
						}
					}],
					xAxes: [{
						scaleLabel: {
							display: true,
							labelString: 'Percentile'
						}
					}]
				}
			}
		});
	}

	[
		minimize,
		schoolName,
		schoolLoc,
		schoolInfo
	].forEach(function(element) {
		cardContent.append(element);
	});

	return card;
}

function Capitalize(w) {
	return w[0].toUpperCase() + w.slice(1);
}
