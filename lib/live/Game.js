var Player = require('./models/Player.js');
var async = require('async');
var _ = require('underscore');

module.exports = Game;

function Game(data) {
    var self = this;
    this.address = data.address;
    this.port = data.port;
    this.map = data.map || '';
    this.phase = data.phase || 0; // 0 == unknown, 1 == first half, 2 == second half
    this.players = [];
    _.each(data.players, function(playerData) {
        self.players.push(new Player(playerData));
    });
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
        // Start a new game on cs_intermission
        if(Game.runningInstance) {
            Game.runningInstance.end();
        }
        Game.runningInstance = Game.newInstance();
    });
    // Initialize the first game
    // This is an ongoing game, so pre-existing stats must be requested from the server
    Game.rcon.getRoundStatus(function(err, status) {
        // Make sure that the map didn't change while waiting for the response
        if(!Game.runningInstance) {
            Game.newInstance(status);
        }
    });
}

