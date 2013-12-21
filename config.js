module.exports = {
    db: {
        address: 'mongodb://localhost/haywire'
    },
    rcon: {
        address: '192.168.0.14:27015',
        password: 'test'
    },
    log: {
        address: '192.168.0.14',
        port: 27016,
        authorized: 0 // falsey values == all
    },
    socket: {
        sockjs_url: 'http://cdn.sockjs.org/sockjs-0.3.min.js'
    }
};

