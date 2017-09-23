var Scorecard = function() {
    var config = {
        apiKey: "AIzaSyBxpTELNwV5kDCAQXTpG-lMzWnIbzcNazs",
        authDomain: "bentham-endurance.firebaseapp.com",
        databaseURL: "https://bentham-endurance.firebaseio.com",
        projectId: "bentham-endurance",
        storageBucket: "bentham-endurance.appspot.com",
        messagingSenderId: "305674895801"
    };
    firebase.initializeApp(config);
    this.database = firebase.database();
    var self = this;

    this.byField = function(field) {
        var q = new ScorecardQuery(self.database);
        q.field = field;
        return q;
    }

    this.byState = function(state) {
        var q = new ScorecardQuery(self.database);
        q.state = state;
        return q;
    }
}

var ScorecardQuery = function(database) {
    var self = this;
    this.database = database;

    this.byField = function(field) {
        self.field = field;
        return self;
    }

    this.byState = function(state) {
        self.state = state;
        return self;
    }

    this.get = function(callback) {
        function getSchools(schools, callback) {
            var numSchools = Object.keys(schools).length;
            for (var id in schools) {
               self.database.ref("/schools")
                            .child(id)
                            .once("value")
                            .then(function(snapshot) {
                                schools[snapshot.key].school = snapshot.val();
                                numSchools--;
                            });
            }
            var loop = setInterval(function() {
                if (numSchools < 1) {
                    clearInterval(loop);
                    callback(schools);
                }
            }, 100);
        }

        if (self.field && self.state) {
            self.database.ref("/fields")
                         .child(self.field)
                         .orderByChild("state")
                         .equalTo(self.state)
                         .once("value")
                         .then(function(snapshot) {
                             getSchools(snapshot.val(), callback);
                         });
        } else if (self.field) {
            self.database.ref("/fields")
                         .child(self.field)
                         .once("value")
                         .then(function(snapshot) {
                             getSchools(snapshot.val(), callback);
                         });
        } else if (self.state) {
            self.database.ref("/schools")
                         .orderByChild("state")
                         .equalTo(self.state)
                         .once("value")
                         .then(function(snapshot) {
                             getSchools(snapshot.val(), callback);
                         });
        } else {
            throw new Error("ScorecardQuery error: not enough parameters");
        }
    }
}

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
