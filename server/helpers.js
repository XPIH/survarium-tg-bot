const config = require('./config');
const FRONT  = config.front;

exports.devmessage = message => {
    let dev = message.dev;
    let url = `https://forum.survarium.com/ru/viewtopic.php?f=${message.forum.id}&t=${message.topic.id}&p=${message.post}#p${message.post}`;

    let text = message.text;

    text = text
        .replace(/^\s+/, '')
        .replace(/<\/blockquote>/gm, '\n')
        .replace(/<br>/gm, '\n')
        .replace(/&quot;/gm, '"')
        .replace(/<cite>((?:.|\n)*?)<\/cite>/gm, '__italic__$1__/italic__\n')
        .replace(/<(?:.|\n)*?>/gm, '')
        .replace(/__italic__/gm, '<i>')
        .replace(/__\/italic__/gm, '</i>');

    const head = `<b>${dev.name}</b>: ${message.topic.id ? '<a href="' + url + '">' + message.topic.name + '</a>' : ''}\n`;
    const SIZE = 4096 - head.length;

    const length = text.length;

    let messageChunks = [];

    let send = function (text) {
        messageChunks.push(`${head}${text}`);
    };

    if (length < SIZE) {
        send(text);
    } else {
        for (let size = 0; size < length;) {
            let chunk = text.substr(size, SIZE);
            let lastDot = chunk.lastIndexOf('.');
            if (lastDot !== -1) {
                lastDot += 1;
                send(text.substr(size, lastDot));
                size += lastDot;
            } else {
                send(chunk);
                size += SIZE;
            }
        }
    }

    return messageChunks;
};

exports.playerName = player => {
    let result = player.nickname;

    if (player.clan_meta) {
        result = `[${player.clan_meta.abbr}] ${result}`;
    }

    return `<a href="${FRONT}/players/${encodeURIComponent(player.nickname)}">${result}</a>`;
};
