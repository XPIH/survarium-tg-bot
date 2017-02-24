const Redis = require('ioredis');

const config = require('./config');

const redis = new Redis({
    keyPrefix: 'sv-tg-bot:',
    port: config.cache.port,
    host: config.cache.host,
    password: config.cache.auth,
    family: config.cache.ipv,
    suffix: config.cache.sfx
});

const redisHost = redis.connector.options.host + ':' + redis.connector.options.port;

redis
    .on('ready', function () {
        console.info('redis connected', redisHost);
    })
    .on('error', function (err) {
        console.error('redis error', err);
    });

module.exports = redis;
