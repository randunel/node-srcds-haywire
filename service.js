var express = require('express');
var http = require('http');

var LiveMapController = require('./controllers/LiveMap.js');
var StatsController = require('./controllers/Stats.js');

var config = require('./config.js');
var app = express();
var httpInstance = http.createServer(app);

app.models = {
    Player: require('./models/Player.js').init(app),
    //Map: require('./models/Map.js').init(app),
    //Weapon: require('./models/Weapon.js').init(app)
};
app.api = {
    db: new (require('./lib/db.js'))(config.db),
    liveSocket: new (require('./lib/LiveSocket.js'))(config.socket, require('./lib/live/Game.js')),
    rcon: new (require('./lib/Rcon.js'))(config.rcon)
};
app.api.stats = new (require('./lib/Stats.js'))(config.log, app.api.rcon, app.api.db);
app.api.liveSocket.Game.attach(app.api.stats, app.api.rcon);
app.api.liveSocket.adapter.installHandlers(httpInstance, {prefix: '/socket'});

var liveMapController = new LiveMapController(app.api.stats);
var statsController = new StatsController(app);

app.use(express.bodyParser());
app.use(express.compress());

app.set('view engine', 'ejs');
app.set('view options', {
    layout: false
});

app.get('/', statsController.getMainStats.bind(statsController));
app.get('/live', liveMapController.getLiveMap.bind(liveMapController));

httpInstance.listen(3000);
