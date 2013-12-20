module.exports = Controller;

function Controller(app) {
    this.app = app;
}

Controller.prototype.getMainStats = function(req, res) {
    var filter = {
        skip: req.query.skip || 0,
        limit: req.query.limit || 50
    };
    this.app.models.Player.getPlayers(filter, function(err, playerList) {
        if(err) {
            res.end(err);
            return;
        }
        res.render('../views/stats/index.ejs', playerList);
    });
};

