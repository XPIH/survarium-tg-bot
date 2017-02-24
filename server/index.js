const bot    = require('./bot');
const api    = require('./api');
const i18n   = require('./i18n');
const config = require('./config');
const cache  = require('./cache');
const helpers = require('./helpers');

const FRONT = config.front;
const ERR_NOCACHED = 'no cached data';

bot.onText(/.*/, msg => {
    let date = new Date();

    console.log(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ${msg.text}`);
});

bot.onText(/\/stats(@\w+)?(\s(.*))?/, (msg, match) => {
    const chatId = msg.chat.id;
    let nickname = match[3];

    if (!nickname) {
        return bot.sendMessage(chatId, i18n('usage:stats'), { parse_mode: 'Markdown' });
    }

    nickname = nickname.trim();

    bot.track(msg, 'Player stats');

    let send = message => {
        bot.sendMessage(chatId, message, {
            parse_mode: 'HTML',
            disable_web_page_preview: true
        });
    };

    const cacheKey = `players:${nickname}`;
    cache
        .get(cacheKey)
        .then(cached => {
            if (cached) {
                return send(cached);
            }

            throw new Error(ERR_NOCACHED);
        })
        .catch(() => api
                .player(nickname)
                .then(json => {
                    const message = `${helpers.playerName(json)}\n` +
                        `LVL: ${json.progress.level}\n` +
                        `KD: ${json.total.kd} (${json.total.kills}/${json.total.dies})`;

                    cache.set(cacheKey, message, 'EX', 60 * 10);

                    return send(message);
                })
            )
        .catch(bot.handleError.bind(bot, chatId, msg));
});

bot.on('inline_query', msg => {
    const chatId = msg.id;
    const query  = msg.query;

    if (!query) {
        return;
    }

    return api
        .find(query, { limit: 10 })
        .then(json => {
            if (!json) {
                return;
            }

            bot.track(msg, 'Inline query');

            return bot.answerInlineQuery(chatId, json.map(player => ({
                type: 'article',
                id: player.nickname,
                title: player.nickname,
                message_text: `/stats ${player.nickname}`
            })));
        })
        .catch(bot.handleError.bind(bot, chatId, msg));
});

bot.onText(/\/steam/, (msg) => {
    const chatId = msg.chat.id;

    bot.track(msg, 'Steam online');

    let send = count => {
        bot.sendMessage(chatId, i18n('steam:online').replace('%count%', count));
    };

    const cacheKey = `steam:online`;
    cache
        .get(cacheKey)
        .then(cached => {
            if (cached) {
                return send(cached);
            }

            throw new Error(ERR_NOCACHED);
        })
        .catch(() => api
                .steamOnline()
                .then(json => {
                    let count = json.count;

                    cache.set(cacheKey, count, 'EX', 60 * 5);

                    return send(count);
                })
        )
        .catch(bot.handleError.bind(bot, chatId, msg));
});

bot.onText(/\/online/, (msg) => {
    const chatId = msg.chat.id;

    bot.track(msg, 'Players online');

    let send = count => {
        bot.sendMessage(chatId, i18n('players:online').replace('%count%', count));
    };

    const cacheKey = `players:online`;
    cache
        .get(cacheKey)
        .then(cached => {
            if (cached) {
                return send(cached);
            }

            throw new Error(ERR_NOCACHED);
        })
        .catch(() => api
                .online({ minutes: 18 })
                .then(json => {
                    let count = json.count;

                    cache.set(cacheKey, count, 'EX', 60 * 2);

                    return send(count);
                })
        )
        .catch(bot.handleError.bind(bot, chatId, msg));
});

bot.onText(/\/devmsg/, (msg) => {
    const chatId = msg.chat.id;

    bot.track(msg, 'Last devmessage');

    let send = message => {
        helpers.devmessage(message).forEach(chunk =>
            bot.sendMessage(chatId, chunk, {
                parse_mode: 'HTML',
                disable_web_page_preview: true
            }));
    };

    const cacheKey = `vg:messages`;
    cache
        .get(cacheKey)
        .then(cached => {
            if (cached) {
                return send(cached);
            }

            throw new Error(ERR_NOCACHED);
        })
        .catch(() => Promise
                .all([
                    api.vgdevs(),
                    api.vgmessages({ limit: 1 })
                ])
                .then(vg => {
                    let devs = vg[0];
                    let message = vg[1].data[0];

                    message.dev = devs.filter(dev => Number(dev.id) === message.dev)[0];

                    cache.set(cacheKey, message, 'EX', 60 * 2);

                    return send(message);
                })
        )
        .catch(bot.handleError.bind(bot, chatId, msg));
});

bot.onText(/\/match(@\w+)?(\s(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    let matchId = match[3];

    if (!matchId) {
        return bot.sendMessage(chatId, i18n('usage:match'), { parse_mode: 'Markdown' });
    }

    matchId = Number(matchId);

    bot.track(msg, 'Match stats');

    let send = message => {
        bot.sendMessage(chatId, message, {
            parse_mode: 'HTML',
            disable_web_page_preview: true
        });
    };

    const cacheKey = `matches:${matchId}`;
    cache
    .get(cacheKey)
    .then(cached => {
        if (cached) {
            return send(cached);
        }

        throw new Error(ERR_NOCACHED);
    })
    .catch(() => Promise.all([
            api.match(matchId),
            api.stats(matchId)
        ])
        .then(json => {
            let match = json[0];
            let stats = json[1];

            let map = match.map.lang.russian;
            let table = [
                { name: 'A', elo: 0, win: false, body: '' },
                { name: 'B', elo: 0, win: false, body: '' }
            ];

            stats.forEach(stat => {
                let scope = table[stat.team];

                scope.win = stat.victory;
                scope.elo += stat.player.progress.elo;
                scope.body += `${stat.place}. ${helpers.playerName(stat.player)} <b>${stat.score}</b> ${stat.kd} (${stat.kills}/${stat.dies})\n`;
            });

            let textTable = table.reduce((textTable, table) => {
                return textTable + `Команда ${table.name} (ELO ${table.elo}) – ${table.win ? 'Победа' : 'Поражение'}\n` +
                    table.body + `\n`;
            }, '');

            const message = `<a href="${FRONT}/matches/${encodeURIComponent(match.id)}">${match.id} / ${map.name} – ${map.mode}</a>\n` +
                `LVL: ${match.level}; ${match.rating_match ? 'рейтинговый' : 'PVP'} \n` +
                textTable;

            cache.set(cacheKey, message, 'EX', 60 * 60);

            return send(message);
        })
    )
    .catch(bot.handleError.bind(bot, chatId, msg));
});
