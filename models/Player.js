module.exports = Player;

function Player() {
    ;
}

Player.init = function(app) {
    Player.app = app;
    return Player;
};

Player.getPlayers = function(filter, cb) {
    cb();
};

