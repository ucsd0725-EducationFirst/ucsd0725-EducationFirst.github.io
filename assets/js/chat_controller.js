var ChatController = function(chatbot, scorecard) {
	var self = this;
	this.chatbot = chatbot;
	this.scorecard = scorecard;
	this.currentPath = ["root"];
	this.context = {};
	this.state = "root";

	this.reset = function() {
		this.currentPath = ["root"];
		this.context = {};
	};

	this.tree = {
		root: {
			prompt: ["Hello! I want to help you choose a school.", "Do you know where you want to go to school?", "It's OK if you're not sure or don't care."],
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
						return ["Great! Here are some of the top schools in " + self.context["where"] + " that offer " + self.context["what"]];
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
			return self.GetNextPrompt();
		} else {
			return node.prompt;
		}
	};

	this.Consume = function(intents) {
		switch (self.state) {
			case "root":
				if (intents === "san diego") {
					self.context["where"] = intents;
					self.path.push("where");
					self.state = "where";
				} else {
					self.path.push("dunno");
					self.state = "dunno";
				}
				break;
			case "dunno":
				if (intents === "healthcare") {
					self.context["what"] = intents;
					self.path.push("what");
					self.state = "dunno.what";
				} else {
					self.path.push("dunno");
					self.state = "dunno.dunno";
				}
				break;
			default:
				break;
		}
	};
};
