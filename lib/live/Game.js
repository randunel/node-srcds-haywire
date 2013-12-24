var Player = require('./models/Player.js');
var EventEmitter = require('events').EventEmitter;
var async = require('async');
var _ = require('underscore');

module.exports = Game;

function Game(data) {
    var self = this;
    this.address = data.address;
    this.port = data.port;
    this.map = data.map || '';
    this.phase = data.phase || 0; // 0 == unknown, 1 == first half, 2 == second half
    this.players = {};
    this.score = [0, 0, 0, 0];
    _.each(data.players, function(playerData) {
        self.players[playerData.userid] = new Player(playerData);
    });
};

Game.prototype.getGameData = function() {
    return {
        address: this.address,
        port: this.port,
        players: this.players
    };
};

Game.prototype.end = function() {
    this.phase = 3;
    // TODO: remove event listeners
    // TODO: remove useless info, such as positions, etc
}

Game.prototype.announce_phase_end = function() {
    // This is the last call to this instance
    console.log('Game instance ended');
    this.end();
};

Game.prototype.cs_intermission = function() {
    console.log('Half finished');
    ++this.phase;
};

Game.prototype.player_connect = function(data) {
    this.players[data.pId].name = data.name;
    this.players[data.pId].steamId = data.steamId;
    this.players[data.pId].address = data.address;
    console.log('Player connected', this.players[data.pId]);
};

Game.prototype.player_death = function(data) {
    console.log(this.players[data.attId].name, 'killed', this.players[data.pId].name, 'with', data.wep);
    this.players[data.pId].hp = 0;
    ++this.players[data.attId].score;
};

Game.prototype.player_disconnect = function(data) {
    console.log('Player disconnected', this.players[data.pId]);
    delete this.players[data.pId];
};

Game.prototype.player_falldamage = function(data) {
    this.players[data.pId].hp = data.health;
};

Game.prototype.player_given_c4 = function(data) {
    this.players[data.pId].c4 = true;
    this.c4 = data.pId;
};

Game.prototype.player_spawned = function(data) {
    this.players[data.pId].newRound();
};

Game.prototype.player_team = function(data) {
    console.log('Player change team', this.players[data.pId].name);
    if(data.disconnect) {
        this.player_disconnect(data);
        return;
    }
    this.players[data.pId].team = data.team;
};

Game.prototype.round_end = function(data) {
    console.log(data.winner, 'won due to', data.reason, 'with the message', data.message);
    ++this.score[data.winner];
};

Game.prototype.round_start = function(data) {
    console.log('Round start');
    _.invoke(this.players, 'newRound');
};

Game.prototype.switch_team = function(data) {
    console.log('Game switch team');
    _.invoke(this.players, 'switchTeam');
};

Game.list = [];
Game.runningInstance = null;
Game.stats = null;
Game.rcon = null;
Game.emitter = new EventEmitter();

Game.newInstance = function(data) {
    var game = new Game(data);
    Game.list.push(game);
    return game;
};

Game.attach = function(stats, rcon) {
    Game.stats = stats;
    Game.rcon = rcon;
    // Attach game changing event listeners
    stats.on('cs_intermission', function() {
        // Start a new game on cs_intermission
        Game.runningInstance = Game.newInstance(Game.runningInstance.getGameData);
    });
    // Initialize the first game
    // This is an ongoing game, so pre-existing stats must be requested from the server
    rcon.getRoundStatus(function(err, status) {
        // Make sure that the map didn't change while waiting for the response
        if(!Game.runningInstance) {
            Game.runningInstance = Game.newInstance(status);
        }
        stats.on('game', function(name, data) {
            var game = Game.runningInstance;
            if(!!data.pId) {
                if(!!!game.players[data.pId]) {
                    game.players[data.pId] = new Player(data);
                }
                !!data.pos && (game.players[data.pId].pos = data.pos);
                !!data.ang && (game.players[data.pId].ang = data.ang);
            }
            !!game[name] && game[name](data);
            // TODO: Check if the event is safe, eg: does not contain sensitive information
            // TODO: Add delay
            Game.emitter.emit('game', name, data);
        });
    });
};

Game.getCurrentStatus = function() {
    // Filter out sensitive information
    return {
        address: Game.runningInstance.address,
        port: Game.runningInstance.port,
        map: Game.runningInstance.map,
        phase: Game.runningInstance.phase,
        players: Game.runningInstance.players
    };
}

