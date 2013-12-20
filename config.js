module.exports = {
    db: {
        address: 'mongodb://localhost/haywire'
    },
    log: {
        address: '192.168.0.14',
        port: 27017,
        authorized: 0 // falsey values == all
    },
    socket: {
        sockjs_url: 'http://cdn.sockjs.org/sockjs-0.3.min.js'
    }
};

