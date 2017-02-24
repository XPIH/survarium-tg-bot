const config = require('./config');
const got = require('got');

const apiHost = config.api;
const httpOptions = {
    json: true,
    rejectUnauthorized: false
};

exports.player = (nickname) => {
    if (!nickname) {
        return Promise.reject();
    }

    return got(`${apiHost}/v2/players/${encodeURIComponent(nickname)}`, httpOptions)
        .then(res => res.body);
};

exports.find = (nickname, options) => {
    if (!nickname) {
        return Promise.reject();
    }

    let limit = options && options.limit || 10;

    return got(`${apiHost}/v2/players`, Object.assign({
        query: {
            nickname,
            limit
        }
    }, httpOptions)).then(res => res.body);
};

exports.steamOnline = () => {
    return got(`${apiHost}/v2/steam/online`, httpOptions).then(res => res.body);
};

exports.online = (params) => {
    return got(`${apiHost}/v2/players/unique`, Object.assign({
        query: {
            minutes: params && params.minutes || 20
        }
    }, httpOptions)).then(res => res.body);
};

exports.vgdevs = () => {
    return got(`${apiHost}/v2/vg/devs`, httpOptions).then(res => res.body);
};

exports.vgmessages = (params) => {
    return got(`${apiHost}/v2/vg/messages`, Object.assign({
        query: {
            limit: params && params.limit || 1
        }
    }, httpOptions)).then(res => res.body);
};

exports.match = (matchId) => {
    if (!matchId) {
        return Promise.reject();
    }

    return got(`${apiHost}/v2/matches/${encodeURIComponent(matchId)}`, Object.assign({
        query: {
            lang: 'russian'
        }
    }, httpOptions))
    .then(res => res.body);
};

exports.stats = (matchId) => {
    if (!matchId) {
        return Promise.reject();
    }

    return got(`${apiHost}/v2/matches/${encodeURIComponent(matchId)}/stats`, Object.assign({
        query: {
            lang: 'russian',
            sort: {
                score: -1
            }
        }
    }, httpOptions))
    .then(res => res.body);
};
