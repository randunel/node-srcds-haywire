module.exports = Controller;

function Controller(app) {
    this.app = app;
}

Controller.prototype.getLiveMap = function(req, res) {
    res.end('not implemented');
};

