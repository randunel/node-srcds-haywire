var sockjs = require('sockjs');

module.exports = Socket;

function Socket(settings, Game) {
    var self = this;
    this.settings = settings;
    this.adapter = sockjs.createServer(settings);
    this.pool = [];
    this.adapter.on('connection', function(conn) {
        self.pool.push(conn);
    });
    this.Game = Game;
}

