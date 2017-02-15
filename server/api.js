const config = require('./config');
const got = require('got');
const cache = require('./cache');

const apiHost = config.api;

exports.stats = (nickname) => {
    if (!nickname) {
        return Promise.reject();
    }

    const cacheKey = `player:${nickname}`;
    const cached = cache.get(cacheKey);

    if (cached) {
        return Promise.resolve(cached);
    }

    return got(`${apiHost}/v2/players/${nickname}`, { json: true }).then(res => { cache.set(cacheKey, res.body); return res.body; });
};

exports.find = (nickname, options) => {
    if (!nickname) {
        return Promise.reject();
    }

    let limit = options && options.limit || 10;

    return got(`${apiHost}/v2/players`, {
        json: true,
        query: {
            nickname,
            limit
        }
    }).then(res => res.body);
};
