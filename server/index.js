const bot = require('./bot');
const api = require('./api');
const i18n = require('./i18n');
const config = require('./config');
const cache = require('./cache');

const FRONT = config.front;

bot.onText(/.*/, msg => console.log(msg.text));

bot.onText(/\/stats\s?(.*)/, (msg, match) => {
    const chatId = msg.chat.id;
    const nickname = match[1];

    if (!nickname) {
        return bot.sendMessage(chatId, i18n('usage:stats'), { parse_mode: 'Markdown' });
    }

    bot.track(msg, 'Player stats');

    return api
        .stats(nickname)
        .then(json => {
            const message = `[${json.nickname}](${FRONT}/players/${json.nickname})` + '\n' +
                `LVL: ${json.progress.level}` + '\n' +
                `KD: ${json.total.kd} (${json.total.kills}/${json.total.dies})`;

            bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
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
