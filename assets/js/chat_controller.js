
var ChatController = function(chatbot, scorecard) {
	var self = this;
	this.chatbot = chatbot;
	this.scorecard = scorecard;
	this.currentPath = ["root"];
	this.context = {};
	this.state = "root";
	this.requestClarification = false;

	this.reset = function() {
		this.currentPath = ["root"];
		this.context = {};
	};

	this.tree = {
		root: {
			prompt: ["Hello! I want to help you choose a university.", "In which state do you want to go to college?", "It's OK if you're not sure or don't care."],
			dunno: {
				prompt: ["OK. Do you know what you want to study?"],
				what: {
					jump: ["root", "where", "what"]
				},
				dunno: {
					prompt: ["OK. Here are some suggestions for the top jobs and industries right now.", "<a href='#'>Click here</a>"]
				}
			},
			where: {
				prompt: ["OK. Do you know what you want to study?"],
				what: {
					dynamic: function() {
						if (self.context["where"] !== undefined) {
							return ["Great! Here are some of the top schools in " + self.context["where"] + " that offer " + self.context["what"]];
						} else {
							return ["OK. Here are some of the top schools that offer degrees in " + self.context["what"]];
						}
					}
				},
				dunno: {
					dynamic: function() {
						return ["OK. Here are some of the top schools in " + self.context["where"]];
					}
				}
			}
		}
	};

	this.GetNextPrompt = function() {
		if (self.requestClarification) {
			self.requestClarification = false;
			var clarification = ["I'm sorry, I don't understand."];
			switch (self.state) {
				case "root":
					clarification.push("Please enter a US state name or abbreviation to search for colleges.");
					return clarification;
					break;
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
					if (intents.value === "unsure" || intents.value === "indifferent") {
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
};
