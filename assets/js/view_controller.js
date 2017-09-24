function CardForSchool(school, averages) {
	console.log(school);
	var card = $("<div class='card uni-card'>").attr({id: "school-" + school.key}).data({state: "closed"});
	card.addClass("card-open") // debug
	var cardContent = $("<div class='card-content'>").appendTo(card);

	var minimize = $("<i>");
	minimize.addClass("material-icons right minimize-card");
	minimize.html('remove');
	minimize.data({schoolID: school.key});
	minimize.hide();

	var schoolName = $("<span class='school-name card-title'>").text(school.school.name);
	var loc = school.school.location.city + ", " + school.school.location.state;
	var schoolLoc = $("<span class='school-location'>").text(loc);

	var schoolInfo = $("<div class='school-info'>");
	schoolInfo.append($("<br>")).append($("<div class='divider'>")).append("<br>");

	var statsRow = $("<div class='row'>").appendTo(schoolInfo);
	var statsCol = $("<div class='col s6'>").appendTo(statsRow);
	var imgCol = $("<div class='col s6'>").appendTo(statsRow);
	$("<h5>").text("Statistics").appendTo(statsCol);
	if (school.school.url) {
		$("<p>").append($("<a>").attr({href: "http://" + school.school.url, target: "_blank"}).text("School Website")).appendTo(statsCol)
	}
	if (school.school.demographics.size > 0) {
		$("<p>").text("Student Population: " + school.school.demographics.size).appendTo(statsCol);
	}
	if (school.school.demographics.female > 0 || school.school.demographics.male > 0) {
		var fPerc = Math.floor(school.school.demographics.female * 100);
		var mPerc = 100 - fPerc;
		$("<p>").text(fPerc + "% Female | " + mPerc + "% Male").appendTo(statsCol);
	}
	var withPluses = school.school.name.split(" ").join("+");
	$.get("http://api.duckduckgo.com/?q=" + withPluses + "&format=json").done(function(json) {
		if (JSON.parse(json).Image) {
			$("<img class='school-logo'>").attr({src: JSON.parse(json).Image}).appendTo(imgCol);
		}
	});

	$("<h5>").text("Admissions").appendTo(schoolInfo);
	$("<p>").text("TODO: Add test scores").appendTo(schoolInfo);

	var moneyRow = $("<div class='row'>").appendTo(schoolInfo);
	var tuitionCol = $("<div class='col s12 m6'>").appendTo(moneyRow);
	var repaymentCol = $("<div class='col s12 m6'>").appendTo(moneyRow);

	$("<h5>").text("Tuition").appendTo(tuitionCol);
	if (school.school.tuition.pell_grant_rate > 0) {
		var perc = Math.floor(school.school.tuition.pell_grant_rate * 100);
		$("<p>").html(perc + "% of students receive Pell Grants<br><br>").appendTo(tuitionCol);
	}
	if (school.school.tuition.in_state > 0) {
		var chartID = "tuition-" + school.key;
		$("<div class='card-chart'>").attr({id: chartID}).appendTo(tuitionCol);
		// Look at http://www.pikemere.co.uk/blog/tutorial-flot-how-to-create-bar-charts/
		// for potentiall better solution
		setTimeout(function(chartID, tuition, averages) {
			var s = [
				["In State", tuition.in_state],
				["(Avg)", 0],
				["Out of State", tuition.out_state],
				["(Avg) ", 0]
			];
			var a = [
				["In State", 0],
				["(Avg)", averages["in-state-tuition"].average],
				["Out of State", 0],
				["(Avg) ", averages["out-state-tuition"].average]
			];
			$.plot("#" + chartID, [s, a], {
				series: {
					color: "green",
					bars: {show: true, align: "center"}
				},
				xaxis: {mode: "categories", tickLength: 0},
				yaxis: {axisLabel: "Tuition Cost ($)"}
			});
		}, 100, chartID, school.school.tuition, averages);
	} else {
		$("<p>").text("Tuition Data Unavailable").appendTo(tuitionCol);
	}

	$("<h5>").text("Repayment").appendTo(repaymentCol);
	if (school.school.repayment.median_debt > 0) {
		$("<p>").html("Average Student Debt: $" + school.school.repayment.median_debt + "<br><br>").appendTo(repaymentCol);
	}
	if (school.school.repayment["1_yr"] > 0) {
		var data = [
			[1, Math.floor(school.school.repayment["1_yr"] * 100)],
			[3, Math.floor(school.school.repayment["3_yr"] * 100)],
			[5, Math.floor(school.school.repayment["5_yr"] * 100)],
			[7, Math.floor(school.school.repayment["7_yr"] * 100)]
		];
		var chartID = "repayment-" + school.key;
		$("<div class='card-chart'>").attr({id: chartID}).appendTo(repaymentCol);
		setTimeout(function(chartID, repayment) {
			$.plot("#" + chartID, [{
				data: repayment,
				lines: {show: true}
			}], {
				xaxis: {min: 0},
				yaxis: {min: 50, max: 100}
			});
		}, 100, chartID, data);
	} else {
		$("<p>").text("Repayment Data Unavailable").appendTo(repaymentCol);
	}

	$("<h5>").text("Salaries").appendTo(schoolInfo);
	$("<p>").text("TODO: Add starting and eventual salaries").appendTo(schoolInfo);

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
