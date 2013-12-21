var Logger = require('srcds-log');
var EventEmitter = require('events').EventEmitter;

module.exports = Stats;

function Stats(settings, rcon, db) {
    this.logger = new Logger(settings);
    this.logger.on('data', this.handle);
    this.rcon = rcon;
    this.db = db;

    // Make sure the server sends logs
    this.rcon.setupLogger(settings);
}

Stats.prototype.__proto__ = EventEmitter.prototype;

Stats.prototype.handle = function(data) {
    console.log('logger data', data);
};

