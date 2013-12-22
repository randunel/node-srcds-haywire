var Player = require('./models/Player.js');
var async = require('async');

module.exports = Game;

function Game(data) {
    this.players = data.players || {};
    this.map = data.map || '';
    this.phase = data.phase || 0; // 0 == not started, 1 == first half, 2 == second half
    this.stats = data.stats;
};

Game.prototype.end = function() {
    this.phase = 0;
    // TODO: remove event listeners
    // TODO: remove useless info, such as positions, etc
}

Game.list = [];
Game.runningInstance = null;
Game.stats = null;
Game.rcon = null;

Game.newInstance = function(data) {
    var game = new Game(data);
    Game.list.push(game);
};

Game.attach = function(stats, rcon) {
    Game.stats = stats;
    Game.rcon = rcon;

    // Attach game changing event listeners
    stats.on('cs_intermission', function() {
        if(Game.runningInstance) {
            Game.runningInstance.end();
        }
        Game.runningInstance = Game.newInstance( {
            stats: Game.stats
        });
    });
    // Initialize the first game
    // This is an ongoing game, so pre-existing stats must be requested from the server
    async.parallel( [
        /*function(done) {
            Game.rcon.getPlayerList(function(err, list) {
                console.log('Game', err, list);
                done(err, list);
            });
        },*/
        function(done) {
            Game.rcon.getRoundStatus(function(err, status) {
                console.log('Game', err, status);
                done(err, status);
            });
    }], function(err, res) {
        console.log('Game async done');
    });
}

