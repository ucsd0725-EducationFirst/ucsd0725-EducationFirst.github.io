
var ChatController = function(chatbot) {
	var self = this;
	this.chatbot = chatbot;
	this.currentPath = ["root"];
	this.context = {};
	this.state = "root";
	this.requestClarification = false;
	this.sortBy = "salary";
	this.promptQueue = [];
	this.schools = [];

	this.reset = function() {
		this.currentPath = ["root"];
		this.context = {};
		this.state = "root";
		this.requestClarification = false;
		this.sortBy = "salary";
		this.promptQueue = [];
		this.schools = [];
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
						self.showTopMajors();
						return ["Here are some of the top majors right now."];
					}
				}
			},
			where: {
				dynamic: function() {
					var state = Capitalize(InverseUSStatesMap[self.context["where"]]);
					return ["I will look for schools in " + state + ".", "Do you know what you want to study?"];
				},
				what: {
					dynamic: function() {
						if (self.context["where"] !== undefined) {
							self.getSchools();
							var state = Capitalize(InverseUSStatesMap[self.context["where"]]);
							var industry = IndustryNames[self.context["what"]];
							return ["I will look for schools in " + state + " that offer " + industry + "."];
						} else {
							self.getSchools();
							var industry = IndustryNames[self.context["what"]];
							return ["Here are some of the top schools that offer degrees in " + industry + "."];
						}
					}
				},
				dunno: {
					dynamic: function() {
						self.showTopMajors();
						return ["Here are some of the top majors right now."];
					}
				}
			}
		}
	};

	this.getSchools = function() {
		if (self.context.what === "business") { self.context.what = "business_marketing"; }
		if (self.context.what === "comm_tech") { self.context.what = "communications_technology"; }
		if (self.context.what === "foreign_language") { self.context.what = "language"; }
		$("#loadingSpinner").show();
		if (self.context.where) {
			if (self.context.what) {
				new ScorecardQuery()
				.withFields([self.context.what])
				.inState(self.context.where)
				.get(self.displaySchools);
			} else {
				new ScorecardQuery()
				.inState(self.context.where)
				.get(self.displaySchools);
			}
		} else {
			if (self.context.what) {
				new ScorecardQuery()
				.withFields([self.context.what])
				.get(self.displaySchools);
			} else {
				self.schools = [];
				self.showTopMajors();
			}
		}
	}

	this.showTopMajors = function() {
		$("#loadingSpinner").hide();
		$("#university-box").empty();
		$("#search-settings").hide();
		HotCollegeMajors.forEach(function(m) {
			$("#university-box").append(CardForTopMajor(m));
		});
	}

	this.GetNextPrompt = function() {
		if (self.promptQueue.length > 0) {
			queue = self.promptQueue;
			self.promptQueue = [];
			return queue;
		}

		if (self.requestClarification) {
			self.requestClarification = false;
			var clarification = ["I'm sorry, I don't understand."];
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
			console.log(intents);
			if (intents === undefined) { self.requestClarification = true; callback(); return; }
			if (intents.kind === "greeting") {
				self.promptQueue.push("Hello!");
				callback();
				return;
			}
			self.Consume(intents);
			callback();
		});
	}

	this.addTag = function(tagText, data) {
		var tag = $("<div class='chip'>").html(tagText);
		var close = $("<i class='close material-icons'>").text("close");
		close.addClass("context-" + data);
		tag.append(close);
		$("#tag-box").find(".context-" + data).parent().remove();
		$("#tag-box").append(tag);
	}

	this.lookForLocation = function(intents) {
		function foundState(abbr) {
			self.context["where"] = abbr;
			self.currentPath = ["root", "where"];
			self.addTag(Capitalize(InverseUSStatesMap[abbr]), "where");
			return true;
		}
		if (intents.value.length === 2) {
			// State abbreviation?
			var abbr = intents.value.toUpperCase();
			if (InverseUSStatesMap[abbr] !== undefined) {
				if (foundState(abbr)) {
					return true;
				}
			} else {
				// State not found
				self.requestClarification = true;
			}
		} else {
			// State name?
			var abbr = USStatesMap[intents.value.toLowerCase()];
			if (abbr !== undefined) {
				if (foundState(abbr)) {
					return true;
				}
			} else {
				// State not found
				self.requestClarification = true;
			}
		}
	}

	this.Consume = function(intents) {
		console.log(self.state, self.currentPath);
		switch (self.state) {
			case "root":
				if (intents.kind === "location") {
					if (self.lookForLocation(intents)) {
						self.state = "where";
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
					self.addTag(self.context["what"], "what");
				} else if (intents.kind === "response") {
					if (intents.value === "unsure" || intents.value === "indifferent" || intents.value === "negative") {
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
					self.addTag(self.context["what"], "what");
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
				break;
			default:
				var redisplayFlag = false;
				if (intents.kind === "location") {
					self.lookForLocation(intents);
					redisplayFlag = true;
				} else if (intents.kind === "industry") {
					self.context["what"] = intents.value;
					self.addTag(self.context["what"], "what");
					redisplayFlag = true;
				}
				if (redisplayFlag && !self.requestClarification) {
					if (self.context.where) {
						if (self.context.what) {
							self.currentPath = ["root", "where", "what"];
						} else {
							self.currentPath = ["root", "where", "dunno"];
						}
					} else {
						if (self.context.what) {
							self.currentPath = ["root", "where", "what"];
						} else {
							self.currentPath = ["root", "dunno", "dunno"];
						}
					}
				}
				break;
		}
	};

	this.displaySchools = function(schools) {
		$("#loadingSpinner").hide();
		$("#university-box").empty();
		$("#search-settings").show();
		if (schools !== undefined) {
			self.averages = CalculateAverages(schools);
			self.schools = schools;
			self.schoolIndex = 6;
		} else {
			self.schoolIndex += 6;
		}

		if (self.schools.length < 1) {
			var message = $("<p>").text("It doesn't look like there are any schools that match those criteria.")
			$("#university-box").append(message);
			return;
		}

		console.log("sorting", self.sortBy);
		switch (self.sortBy) {
			case "tuition":
				self.schools.sort(function(a, b) {
					return a.tuition.in_state > b.tuition.in_state;
				});
				break;
			case "size-low":
				self.schools.sort(function(a, b) {
					return a.demographics.size > b.demographics.size;
				});
				break;
			case "size-high":
				self.schools.sort(function(a, b) {
					return a.demographics.size < b.demographics.size;
				});
				break;
			default:
				self.schools.sort(function(a, b) {
					return a.salary.starting["50"] < b.salary.starting["50"];
				});
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
