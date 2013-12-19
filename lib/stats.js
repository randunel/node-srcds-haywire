var Logger = require('srcds-log');
var EventEmitter = require('events').EventEmitter;

module.exports = Stats;

function Stats(config) {
    this.logger = new Logger(config.address);
    this.logger.on('data', this.handle);
}

Stats.prototype.__proto__ = EventEmitter.prototype;

Stats.prototype.handle = function(data) {
    console.log('logger data', data);
};

