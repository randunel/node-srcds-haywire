var rcon = require('srcds-rcon');
var _ = require('underscore');

module.exports = Rcon;

function Rcon(settings) {
    var self = this;
    this.settings = settings;
    this.connecting = true;
    this.connected = false;
    this.client = new rcon(settings.address, settings.password);
    this.connect(function(err) {
        if(err) {
            throw err;
        }
    });
}

Rcon.prototype.command = function(cmd, cb) {
    var self = this;
    if(!this.connected) {
        this.client.once('connect', function() {
            self.client.runCommand(cmd, cb);
        });
        if(!this.connecting) {
            this.client.connect(function() {
                self.connected = true;
                self.connecting = false;
            });
        }
        return;
    }
    this.client.runCommand(cmd, cb);
};

Rcon.prototype.connect = function(cb) {
    var self = this;
    this.client.connect(function(err) {
        self.connected = true;
        self.connecting = false;
        cb && cb(err);
    });
};

Rcon.prototype.setupLogger = function(params, cb) {
    var self = this;

    var done = _.after(4, function() {
        cb && cb();
    });

    this.command('logaddress_list', function(err, res) {
        var logAddress = params.address + ':' + params.port;
        if(res.indexOf('no addresses in the list') > -1 || res.indexOf(logAddress) == -1) {
            self.command('logaddress_add ' + logAddress, function(err, res) {
                done();
            });
            return;
        }
        done();
    });
    this.command('log on', done);
    this.command('sv_logecho 0', done);
    this.command('sv_logfile 0', done);
};
