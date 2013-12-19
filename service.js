var cluster = require("cluster");
var numCPUs = require("os").cpus().length;

if(cluster.isMaster) {
    // Fork workers
    var numWorkers = Number(process.argv[2]);
    numWorkers = numWorkers || numCPUs;
    for(var i = 0; i < numWorkers; ++i) {
        cluster.fork();
    }

    cluster.on("fork", function(worker) {
        console.log("Worker " + worker.process.pid + " started.");
    });

    cluster.on("listening", function(worker, address) {
        console.log("Worker " + worker.process.pid + " listening on " + address.address + ":" + address.port);
    });

    cluster.on("exit", function(worker, code, signal) {
        console.log("Worker " + worker.process.pid + " died: " + code + "::" + signal + ". RIPs..");
        cluster.fork();
    });
}
else {
    var express = require('express');

    var LiveMapController = require('./controllers/LiveMap.js');
    var StatsController = require('./controllers/Stats.js');

    var config = require('./config.js');
    var app = express();
    app.models = {
        Player: require('./models/Player.js').init(app),
        //Map: require('./models/Map.js').init(app),
        //Weapon: require('./models/Weapon.js').init(app)
    };
    app.api = {
        db: new (require('./lib/db.js'))(config.db)
    };
    app.api.stats = new (require('./lib/stats.js'))(config.log, app.api.db)

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

    app.listen(3000);
}
