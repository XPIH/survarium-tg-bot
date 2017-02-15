const bot = require('./bot');
const api = require('./api');
const i18n = require('./i18n');
const config = require('./config');
const cache = require('./cache');

const FRONT = config.front;

bot.onText(/.*/, msg => console.log(msg.text));

bot.onText(/\/stats(@\w+)?(\s(.*))?/, (msg, match) => {
    const chatId = msg.chat.id;
    let nickname = match[3];

    if (!nickname) {
        return bot.sendMessage(chatId, i18n('usage:stats'), { parse_mode: 'Markdown' });
    }

    nickname = nickname.trim();

    bot.track(msg, 'Player stats');

    const cacheKey = `player:${nickname}`;
    const cached = cache.get(cacheKey);

    let send = (message) => {
        bot.sendMessage(chatId, message, {
            parse_mode: 'HTML',
            disable_web_page_preview: true
        });
    };

    if (cached) {
        return send(cached);
    }

    return api
        .stats(nickname)
        .then(json => {
            let name = json.nickname;

            if (json.clan_meta) {
                name = `[${json.clan_meta.abbr}] ${name}`;
            }

            const message = `<a href="${FRONT}/players/${encodeURIComponent(json.nickname)}">${name}</a>\n` +
                `LVL: ${json.progress.level}\n` +
                `KD: ${json.total.kd} (${json.total.kills}/${json.total.dies})`;

            cache.set(cacheKey, message);
            send(message);
        })
        .catch(bot.handleError.bind(bot, chatId, msg));
});

bot.on('inline_query', msg => {
    const chatId = msg.id;
    const query = msg.query;

    if (!query) {
        return;
    }

    return api
        .find(query, { limit: 10 })
        .then(json => {
            bot.answerInlineQuery(chatId, json.map(player => ({
                type: 'article',
                id: player.nickname,
                title: player.nickname,
                message_text: `/stats ${player.nickname}`
            })));

            bot.track(msg, 'Inline query');
        })
        .catch(bot.handleError.bind(bot, chatId, msg));
});
