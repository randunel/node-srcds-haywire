var Logger = require('srcds-log');
var EventEmitter = require('events').EventEmitter;

module.exports = Stats;

function Stats(settings, rcon, db) {
    this.logger = new Logger(settings);
    this.logger.on('data', this.handle);
    this.rcon = rcon;
    this.db = db;

    this.game = {
        players: {},
        server: {}
    };

    // Make sure the server sends logs
    this.rcon.setupLogger(settings);
}

Stats.prototype.__proto__ = EventEmitter.prototype;

Stats.prototype.handle = function(data) {
    var self = this;
    var hwIndex = data.indexOf(': HW->');
    if(hwIndex > -1 && hwIndex < 31 /*28*/) {
        var split = data.split(': HW->')[1].split('->');
        var e = {
            name: split.shift(),
            body: split.join('->')
        };
        if(Stats.parser[e.name]) {
            //console.log(e.name, Stats.parser[e.name](e.body));
            return;
        }
        console.log('Unknown haywire event', data);
        return;
    }
};

Stats.parser = {
    announce_phase_end: function(body) {
        return {};
    },
    bomb_beep: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            ent: Number(data[0]),
            pos: [Number(data[1]), Number(data[2]), Number(data[3])]
        };
    },
    bullet_impact: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            pId: Number(data[0]),
            pos: [Number(data[1]), Number(data[2]), Number(data[3])],
            ang: [Number(data[4]), Number(data[5]), Number(data[6])],
            ent: [Number(data[7]), Number(data[8]), Number(data[9])]
        };
    },
    buytime_ended: function(body) {
        return {};
    },
    cs_pre_restart: function(body) {
        return {};
    },
    cs_intermission: function(body) {
        return {};
    },
    cs_win_panel_match: function(body) {
        // Fix plugin
        return {};
    },
    cs_win_panel_round: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            timerDefend: Number(data[0]),
            timerAttack: Number(data[1]),
            time: Number(data[2]),
            finalEvent: Number(data[3]),
            token: data[4], // Fix plugin
            funPlayer: Number(data[5]),
            funData: [Number(data[6]), Number(data[7]), Number(data[8])]
        };
    },
    decoy_detonate: function(body) {
        return Stats.parseUserEntity(Stats.splitRegularBody(body));
    },
    decoy_firing: function(body) {
        return Stats.parseUserEntity(Stats.splitRegularBody(body));
    },
    decoy_started: function(body) {
        return Stats.parseUserEntity(Stats.splitRegularBody(body));
    },
    enter_bombzone: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            pId: Number(data[0]),
            pos: [Number(data[1]), Number(data[2]), Number(data[3])],
            ang: [Number(data[4]), Number(data[5]), Number(data[6])],
            hasbomb: Boolean(data[7]), // player has bomb
            isplanted: Boolean(data[8]) // bomb is planted
        };
    },
    enter_buyzone: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            pId: Number(data[0]),
            pos: [Number(data[1]), Number(data[2]), Number(data[3])],
            ang: [Number(data[4]), Number(data[5]), Number(data[6])],
            buy: Boolean(data[7]) // can buy
        };
    },
    exit_bombzone: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            pId: Number(data[0]),
            pos: [Number(data[1]), Number(data[2]), Number(data[3])],
            ang: [Number(data[4]), Number(data[5]), Number(data[6])],
            hasbomb: Boolean(data[7]), // player has bomb
            isplanted: Boolean(data[8]) // bomb is planted
        };
    },
    exit_buyzone: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            pId: Number(data[0]),
            pos: [Number(data[1]), Number(data[2]), Number(data[3])],
            ang: [Number(data[4]), Number(data[5]), Number(data[6])],
            buy: Boolean(data[7]) // can buy
        };
    },
    grenade_bounce: function(body) {
        return Stats.parseSimpleUserId(Stats.splitRegularBody(body));
    },
    hegrenade_detonate: function(body) {
        return Stats.parseUserEntity(Stats.splitRegularBody(body));
    },
    item_equip: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            pId: Number(data[0]),
            pos: [Number(data[1]), Number(data[2]), Number(data[3])],
            ang: [Number(data[4]), Number(data[5]), Number(data[6])],
            item: data[7],
            zoom: Boolean(data[8]), // can zoom
            hassil: Boolean(data[9]), // has silencer
            sil: Boolean(data[10]), // is silenced
            tracers: Boolean(data[11]), // has tracers
            type: data[12] // weapon type
        };
    },
    item_pickup: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            pId: Number(data[0]),
            pos: [Number(data[1]), Number(data[2]), Number(data[3])],
            ang: [Number(data[4]), Number(data[5]), Number(data[6])],
            item: data[7]
        };
    },
    item_purchase: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            pId: Number(data[0]),
            pos: [Number(data[1]), Number(data[2]), Number(data[3])],
            ang: [Number(data[4]), Number(data[5]), Number(data[6])],
            team: Number(data[7]),
            item: data[8]
        };
    },
    player_activate: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            pId: Number(data[0])
        };
    },
    player_connect: function(body) {
        var data = body.split('],[');
        data[0] = data[0].substring(1);
        return {
            index: Number(data.shift()),
            pId: Number(data.shift()),
            steamId: data.shift(),
            address: data.shift(),
            bot: Boolean(data.shift()),
            name: data.join('],[')
        };
    },
    player_death: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            pId: Number(data[0]),
            pos: [Number(data[1]), Number(data[2]), Number(data[3])],
            ang: [Number(data[4]), Number(data[5]), Number(data[6])],
            attId: Number(data[7]),
            attPos: [Number(data[8]), Number(data[9]), Number(data[10])],
            attAng: [Number(data[11]), Number(data[12]), Number(data[13])],
            ass: Number(data[14]), // assister
            wep: data[15],
            hs: Boolean(data[16]),
            dominated: Number(data[17]),
            revenge: Number(data[18]),
            penetrated: Number(data[19]) // how many objects penetrated before hitting the target
        };
    },
    player_falldamage: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            pId: Number(data[0]),
            pos: [Number(data[1]), Number(data[2]), Number(data[3])],
            ang: [Number(data[4]), Number(data[5]), Number(data[6])],
            dmg: Number(data[7])
        };
    },
    player_footstep: function(body) {
        return Stats.parseSimpleUserId(Stats.splitRegularBody(body));
    },
    player_hurt: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            pId: Number(data[0]),
            pos: [Number(data[1]), Number(data[2]), Number(data[3])],
            ang: [Number(data[4]), Number(data[5]), Number(data[6])],
            attId: Number(data[7]),
            attPos: [Number(data[8]), Number(data[9]), Number(data[10])],
            attAng: [Number(data[11]), Number(data[12]), Number(data[13])],
            health: Number(data[14]), // remaining
            armor: Number(data[15]),
            wep: data[16],
            dmgHealth: Number(data[17]),
            dmgArmor: Number(data[18]),
            hitgroup: Number(data[19])
        };
    },
    player_jump: function(body) {
        return Stats.parseSimpleUserId(Stats.splitRegularBody(body));
    },
    player_radio: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            pId: Number(data[0]),
            pos: [Number(data[1]), Number(data[2]), Number(data[3])],
            ang: [Number(data[4]), Number(data[5]), Number(data[6])],
            radio: Number(data[7]) // radio slot
        };
    },
    player_team: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            pId: Number(data[0]),
            team: Number(data[1]),
            oldTeam: Number(data[2]),
            disconnect: Boolean(data[3])
        };
    },
    round_end: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            winner: Number(data[0]),
            reason: Number(data[1]),
            message: data[2]
        };
    },
    round_freeze_end: function(body) {
        return {};
    },
    round_mvp: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            pId: Number(data[0]),
            reason: Number(data[1])
        };
    },
    round_start: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            timelimit: Number(data[0]),
            fraglimit: Number(data[1]),
            objective: data[2]
        };
    },
    server_cvar: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            cvar: data[0],
            value: data[1]
        };
    },
    smokegrenade_detonate: function(body) {
        return Stats.parseUserEntity(Stats.splitRegularBody(body));
    },
    smokegrenade_expired: function(body) {
        return Stats.parseUserEntity(Stats.splitRegularBody(body));
    },
    switch_team: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            players: Number(data[0]),
            spectators: Number(data[1]),
            rank: Number(data[2]), // average rank??
            tSlots: Number(data[3]), // free t slots
            ctSlots: Number(data[4]) // free ct slots
        };
    },
    weapon_fire: function(body) {
        var data = Stats.splitRegularBody(body);
        return {
            pId: Number(data[0]),
            pos: [Number(data[1]), Number(data[2]), Number(data[3])],
            ang: [Number(data[4]), Number(data[5]), Number(data[6])],
            wep: data[7],
            sil: Boolean(data[8]) // silenced true/false
        };
    },
    weapon_reload: function(body) {
        return Stats.parseSimpleUserId(Stats.splitRegularBody(body));
    },
    weapon_zoom: function(body) {
        return Stats.parseSimpleUserId(Stats.splitRegularBody(body));
    }
};

Stats.splitRegularBody = function(body) {
    var data = body.split('],[');
    data[0] = data[0].substring(1);
    data[data.length - 1] = data[data.length - 1].substring(0, data[data.length - 1].length - 1);
    return data;
};

Stats.parseSimpleUserId = function(data) {
    return {
        pId: Number(data[0]),
        pos: [Number(data[1]), Number(data[2]), Number(data[3])],
        ang: [Number(data[4]), Number(data[5]), Number(data[6])]
    };
}

Stats.parseUserWithEntity = function(data) {
    return {
        pId: Number(data[0]),
        pos: [Number(data[1]), Number(data[2]), Number(data[3])],
        ang: [Number(data[4]), Number(data[5]), Number(data[6])],
        ent: Number(data[7]),
        entPos: [Number(data[8]), Number(data[9]), Number(data[10])]
    };
}

