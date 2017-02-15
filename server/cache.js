const LRU = require('lru-cache');
const options = {
    max: 500,
    length: function (n, key) { return n * 2 + key.length },
    dispose: function (key, n) { n.close() },
    maxAge: 1000 * 60 * 10
};
const cache = LRU(options);

module.exports = cache;
