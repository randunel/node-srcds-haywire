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

Rcon.prototype.getRoundStatus = function(cb) {
    var self = this;
    this.command('status', function(err, res) {
        cb(err, Rcon.parsers.parseStatus(res));
    });
};

Rcon.parsers = {
    parseStatus: function(string) {
        // TODO: convert this parser into a RegEx parser
        var result = {};
        var items = string.split('\n');

        // The first item contains the hostname
        // hostname: ServerName
        result.name = items[0].split('hostname: ')[1];

        // The second item contains the srcds version and VAC data
        // version : X.Y.Z/build prot (in)secure
        if(!items[1]) console.log('items[1] falsey', string);
        var rawVersionArray = items[1].split('version : ')[1].split(' ');
        if(rawVersionArray.length == 2) rawVersionArray.splice(1, 0, '');
        result.version = [rawVersionArray[0]].concat(rawVersionArray[1]).join(' ');
        result.secure = rawVersionArray[2] == 'secure' ? true : false;

        // The third item is the ip address
        // udp/ip  : IP:port  (public ip: IP)
        var rawIp = items[2].split(': ');
        if(rawIp.length <= 2) {
            result.address = rawIp[1].split(':')[0];
            result.port = rawIp[1].split(':')[1];
        }
        else if(rawIp.length > 2) {
            var tempIp = rawIp[1].split(' ')[0].split(':');
            result.localAddress = tempIp[0];
            result.localPort = tempIp[1];
            result.address = rawIp[2].split(')')[0];
            result.port = result.localPort;
        }

        // The fourth item is the os
        // os    :  Linux
        var tempOs = items[3].split(' ');
        result.os = tempOs[tempOs.length - 1];

        // The fifth item is the server type
        // type   :  community dedicated
        result.type = items[4].split(': ')[1].split('').reverse().join('').trim().split('').reverse().join('').trim();

        // The sixth item is the map name
        // map     : de_dust
        result.map = items[5].split(': ')[1].split('').reverse().join('').trim().split('').reverse().join('').trim();

        // The seventh element contains player info
        // players : 10 humans, 0 bots (20/10 max) (hibernating)
        var tempPlayers = items[6].split(':')[1].split(' ');
        result.humans = tempPlayers[1];
        result.bots = tempPlayers[3];
        var tempSlots = tempPlayers[5].split('(')[1].split('/');
        result.maxplayers = tempSlots[0];
        result.numPlayers = tempSlots[1];
        result.hibernating = items[6].indexOf('not hibernating') > -1 ? false : true;

        // The eigth element is an empty newline
        // The nineth element is the column header
        // # userid name uniqueid connected ping loss stats rate adr
        // TODO: parse player data according to column header
        //
        // The last element is '#end'
        var i = 9;
        result.players = [];
        while(items[i+=1].indexOf('#end') != 0) {
            result.players.push(getPlayerData(items[i]));
        }
        function getPlayerData(row) {
            var split = row.split('"');
            return {
                userid: Number(split[0].substring(1, split[0].length - 1)),
                name: split[1]
            };
        }
        return result;
    },
    parseLogaddressList: function(string) {
        if(string.indexOf('no addresses in the list') > -1) return [];
        var list = [];
        var items = string.split('\n');
        items.shift();
        // Test for printable ascii chars only
        items.forEach(function(address) {
            if(/^[\040-\176]*$/.test(address) && address.length > 0) {
                list.push(address);
            }
        });
        return list;
    }
};

