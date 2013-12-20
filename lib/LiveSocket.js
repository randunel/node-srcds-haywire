var sockjs = require('sockjs');

module.exports = Socket;

function Socket(settings) {
    var self = this;
    this.settings = settings;
    this.adapter = sockjs.createServer(settings);
    this.pool = [];
    this.adapter.on('connection', function(conn) {
        self.pool.push(conn);
    });
}

