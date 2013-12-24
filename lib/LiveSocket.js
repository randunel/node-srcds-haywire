var sockjs = require('sockjs');

module.exports = Socket;

function Socket(settings, Game) {
    var self = this;
    this.settings = settings;
    this.adapter = sockjs.createServer(settings);
    this.pool = {};
    this.adapter.on('connection', function(conn) {
        conn.write(JSON.stringify(self.Game.getCurrentStatus()));
        conn.on('close', function() {
            delete self.pool[conn.id];
        });
        self.pool[conn.id] = conn;
    });
    this.Game = Game;
    this.stats = Game.emitter;

    this.stats.on('game', function(name, data) {
        data.event = name;
        var message = JSON.stringify(data);
        for(var id in self.pool) {
            self.pool[id].write(message);
        }
    });
}

