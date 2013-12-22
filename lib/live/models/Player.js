module.exports = Player;

function Player(data) {
    this.userid = data.userid;
    this.name = data.name || '';
    this.score = data.score;
}

