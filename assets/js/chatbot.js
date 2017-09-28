var ChatBot = function() {
    var self = this;
    this.api_key = "WWDLJEIW4LK3YSBDEKX6OZ5HLLS2FJEE";
    this.url = "https://api.wit.ai/message?v=20170925";

    this.byConfidence = function(a, b) {
        return a.confidence < b.confidence;
    }

    this.ParseInput = function(input, callback) {
        $.ajax({
            url: self.url,
            data: {
                "q": input,
                "access_token": self.api_key
            },
            dataType: "jsonp",
            method: "GET"
        }).done(function(response) {
            console.log(response)
            if (response.entities.industry !== undefined) {
                var results = response.entities.industry.sort(self.byConfidence);
                var result = results[0];
                result.kind = "industry";
                callback(result);
            } else if (response.entities.response !== undefined) {
                var results = response.entities.response.sort(self.byConfidence);
                var result = results[0];
                result.kind = "response";
                callback(result);
            } else if (response.entities.location !== undefined) {
                var results = response.entities.location.sort(self.byConfidence);
                var result = results[0];
                result.kind = "location";
                callback(result);
            } else if (response.entities.greetings !== undefined) {
                var results = response.entities.greetings.sort(self.byConfidence);
                var result = results[0];
                result.kind = "greeting";
                callback(result);
            } else {
                callback(undefined);
            }
        }).fail(function(err) {
            console.log("wit.ai error: ", err);
        });
    }
}
