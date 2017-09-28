
var ChatController = function(chatbot) {
	var self = this;
	this.chatbot = chatbot;
	this.currentPath = ["root"];
	this.context = {};
	this.state = "root";
	this.requestClarification = false;

	this.reset = function() {
		this.currentPath = ["root"];
		this.context = {};
		this.state = "root";
		this.requestClarification = false;
	};

	this.tree = {
		root: {
			prompt: ["Hello! I want to help you choose a university.", "In which state do you want to go to college?", "It's OK if you're not sure or don't care."],
			dunno: {
				prompt: ["Do you know what you want to study?"],
				what: {
					jump: ["root", "where", "what"]
				},
				dunno: {
					dynamic: function() {
						// TODO show hottest jobs data
						return ["That's OK! Here are some suggestions for the top jobs and industries right now."];
					}
				}
			},
			where: {
				dynamic: function() {
					var state = Capitalize(InverseUSStatesMap[self.context["where"]]);
					return ["OK, I will look for schools in " + state + ".", "Do you know what you want to study?"];
				},
				what: {
					dynamic: function() {
						if (self.context["where"] !== undefined) {
							new ScorecardQuery()
							.withFields([self.context["what"]])
							.inState(self.context["where"])
							.orderedBy("salary_s_50")
							.get(self.displaySchools);

							var state = Capitalize(InverseUSStatesMap[self.context["where"]]);
							var industry = IndustryNames[self.context["what"]];
							return ["Great! I will look for schools in " + state + " that offer " + industry + "."];
						} else {
							new ScorecardQuery()
							.withFields([self.context["what"]])
							.orderedBy("salary_s_50")
							.get(self.displaySchools);

							var industry = IndustryNames[self.context["what"]];
							return ["Great! Here are some of the top schools that offer degrees in " + industry + "."];
						}
					}
				},
				dunno: {
					dynamic: function() {
						new ScorecardQuery()
						.inState(self.context["where"])
						.orderedBy("salary_s_50")
						.get(self.displaySchools);

						var state = Capitalize(InverseUSStatesMap[self.context["where"]]);
						return ["That's OK! Here are some of the top schools in " + state + "."];
					}
				}
			}
		}
	};

	this.GetNextPrompt = function() {
		if (self.requestClarification) {
			self.requestClarification = false;
			var clarification = ["I'm sorry, I don't understand."];
			console.log(self.state);
			switch (self.state) {
				case "root":
					clarification.push("Please enter a US state name or abbreviation to search for colleges.");
					return clarification;
					break;
				case "where":
					clarification.push("Do you know what you want to study?");
					clarification.push("It's OK if you're not sure or don't know.");
					return clarification;
				default:
					break;
			}
			return clarification.concat(self.GetNextPrompt());
		}

		var node;
		self.currentPath.forEach(function(key) {
			if (key === "root") {
				node = self.tree["root"];
			} else {
				node = node[key];
			}
		});

		if (node.dynamic !== undefined) {
			return node.dynamic();
		} else if (node.jump !== undefined) {
			self.currentPath = node.jump;
			self.state = node.jump.slice(1).join(".");
			return self.GetNextPrompt();
		} else {
			return node.prompt;
		}
	};

	this.HandleInput = function(input, callback) {
		self.chatbot.ParseInput(input, function(intents) {
			self.Consume(intents);
			callback();
		});
	}

	this.Consume = function(intents) {
		console.log(intents);
		if (intents === undefined) { self.requestClarification = true; return; }
		switch (self.state) {
			case "root":
				if (intents.kind === "location") {
					// Look for location
					if (intents.value.length === 2) {
						// State abbreviation?
						var abbr = intents.value.toUpperCase();
						if (InverseUSStatesMap[abbr] !== undefined) {
							// Found state
							self.context["where"] = abbr;
							self.currentPath.push("where");
							self.state = "where";
						} else {
							// State not found
							self.requestClarification = true;
						}
					} else {
						// State name?
						var abbr = USStatesMap[intents.value.toLowerCase()];
						if (abbr !== undefined) {
							// Found state
							self.context["where"] = abbr;
							self.currentPath.push("where");
							self.state = "where";
						} else {
							// State not found
							self.requestClarification = true;
						}
					}
				} else if (intents.kind === "response") {
					if (intents.value === "unsure" || intents.value === "indifferent") {
						// User unsure/indifferent where they want to study
						self.currentPath.push("dunno");
						self.state = "dunno";
					} else {
						self.requestClarification = true;
					}
				} else {
					self.requestClarification = true;
				}
				break;
			case "dunno":
				if (intents.kind === "industry") {
					// What the user wants to study
					self.context["what"] = intents.value;
					self.currentPath.push("what");
					self.state = "dunno.what";
				} else if (intents.kind === "response") {
					if (intents.value === "unsure" || intents.value === "indifferent") {
						// User unsure/indifferent what they want to study
						self.currentPath.push("dunno");
						self.state = "dunno.dunno";
					} else {
						self.requestClarification = true;
					}
				} else {
					self.requestClarification = true;
				}
				break;
			case "where":
				if (intents.kind === "industry") {
					// What the user wants to study
					self.context["what"] = intents.value;
					self.currentPath.push("what");
					self.state = "where.what";
				} else if (intents.kind === "response") {
					if (intents.value === "unsure" || intents.value === "indifferent" || intents.value === "negative") {
						// User unsure/indifferent what they want to study
						self.currentPath.push("dunno");
						self.state = "where.dunno";
					} else {
						self.requestClarification = true;
					}
				} else {
					self.requestClarification = true;
				}
			default:
				break;
		}
	};

	this.displaySchools = function(schools) {
		if (schools !== undefined) {
			self.averages = CalculateAverages(schools);
			self.schools = schools;
			self.schoolIndex = 6;
		} else {
			self.schoolIndex += 6;
			$("#university-box").empty();
		}

		var count = Math.min(self.schoolIndex, self.schools.length);
		for (var i = 0; i < count; i++) {
			var school = self.schools[i];
			var card = CardForSchool(school, self.averages);
			$("#university-box").append(card);
		}
		if (count < self.schools.length) {
			var row = $("<div class='row center-align'>");
			var showMore = $("<button type='button' class='btn-flat waves-effect waves-grey btn-flat'>").text("Show More");
			showMore.click(function() {
				self.displaySchools();
			});
			row.append($("<br>")).append(showMore);
			$("#university-box").append(row);
		}
	};
};
