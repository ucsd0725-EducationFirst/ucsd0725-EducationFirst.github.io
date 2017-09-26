var ScorecardQuery = function() {
    var self = this;
    this.fields = [];
    this.state = "";
    this.ordered = "";
    this.base_url = "https://whispering-tundra-57343.herokuapp.com/v1?";

    this.withFields = function(fields) {
        self.fields = fields;
        return self;
    }

    this.inState = function(state) {
        self.state = state;
        return self;
    }

    this.orderedBy = function(column) {
        self.ordered = column;
        return self;
    }

    this.get = function(callback) {
        var url = self.base_url;
        if (self.fields.length > 0) {
            console.log(self.fields)
            url += "&fields=" + self.fields.join(",");
        }
        if (self.state.length > 0) {
            url += "&state=" + self.state.toUpperCase();
        }
        if (self.ordered.length > 0) {
            url += "&ordered=" + self.ordered;
        }

        $.get(url)
        .done(function(json) {
            if (json.error) {
                console.error("ScorecardQuery error: malformed URL " + url);
            } else {
                callback(json.results);
            }
        })
        .fail(function(err) {
            console.error(err);
        });
    }
};

function FilterChildrenByPropertyPath(object, path, filter) {
    var results = {};
    overObjects:
    for (var id in object) {
        var child = object[id];
        var value = JSON.parse(JSON.stringify(child));
        for (var i = 0; i < path.length; i++) {
            var p = path[i];
            if (value[p]) {
                value = value[p];
            } else {
                continue overObjects;
            }
        }
        if (filter(value)) {
            results[id] = child;
        }
    }
    return results;
}

function OrderChildrenByPropertyPath(object, path, ascending) {
    // Sorts with biggest values first by default
    ascending = ascending || false;
    var ordered = [];
    for (var key in object) {
        var child = object[key];
        child.key = key;
        ordered.push(child);
    }
    ordered.sort(function(a, b) {
        var a_value; var b_value;
        path.forEach(function(p) {
            if (a[p]) { a = a[p]; } else { return -1; }
            if (b[p]) { b = b[p]; } else { return 1; }
        });
        return ascending ? (a > b) : (a < b);
    });
    return ordered;
}

function CalculateAverages(schools) {
    var averages = {
        "in-state-tuition": {count: 0, sum: 0},
        "out-state-tuition": {count: 0, sum: 0}
    };
    for (var i = 0; i < schools.length; i++) {
        var s = schools[i];
        if (s.tuition.in_state > 0) {
            averages["in-state-tuition"].count++;
            averages["in-state-tuition"].sum += s.tuition.in_state;
        }
        if (s.tuition.out_state > 0) {
            averages["out-state-tuition"].count++;
            averages["out-state-tuition"].sum += s.tuition.out_state;
        }
    }
    for (var key in averages) {
        var obj = averages[key];
        if (obj.count > 0) {
            obj.average = obj.sum / obj.count;
        } else {
            obj.average = 0;
        }
        averages[key] = obj;
    }
    return averages;
}
