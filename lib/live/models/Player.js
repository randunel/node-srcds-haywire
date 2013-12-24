module.exports = Player;

function Player(data) {
    this.id = data.userid || data.pId;
    this.name = data.name || '';
    this.team = data.team || 0; // 0=none, 1=spec, 2=t, 3=ct
    this.pos = [0, 0, 0];
    this.ang = [0, 0, 0];
    this.c4 = false;
}

Player.prototype.newRound = function() {
    this.c4 = false;
    this.hp = 100;
};

Player.prototype.switchTeam = function() {
    if(this.team == 2) {
        this.team = 3;
        return;
    }
    this.team = 2;
};

