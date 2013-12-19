var mongo = require('mongodb').MongoClient;

module.exports = Client;

function Client(config) {
    var self = this;
    this.config = config;
    this.connected = false;
    this.connecting = true;
    this.col = {};
    this.connect(function(err) {
        // Connection error on startup
        if(err) {
            throw err;
        }
    });
}

Client.prototype.connect = function(cb) {
    var self = this;
    this.connecting = true;
    this.connected = false;
    mongo.connect(this.config.address, function(err, db) {
        if(err) {
            cb && cb(err);
            return;
        }
        self.db = db;
        self.connected = true;
        self.connecting = false;
        cb && cb();
    });
};

