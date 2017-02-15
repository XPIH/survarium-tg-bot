'use strict';

const TelegramBot = require('node-telegram-bot-api');
const config = require('./config').telegram;

const logKey = 'telegram:';

if (!config.token) {
    console.warn(`${logKey} no token defined`);
}

const options = {};

if (config.hook.key && config.hook.cert) {
    options.webHook = {
        port: config.hook.port,
        key: config.hook.key,
        cert: config.hook.cert
    };
} else {
    options.polling = true;
}

const bot = new TelegramBot(config.token, options);
const webHook = bot.options.webHook;

if (webHook) {
    let webHookURL = `${config.hook.host}:${webHook.port}/bot/${config.token}`;

    bot.setWebHook(webHookURL, webHook.cert);
    console.log(`${logKey} started in webHook-mode on ${webHookURL}`);
} else {
    if (config.hook.del) {
        bot.setWebHook('');
        console.log(`${logKey} webHook removed`);
    }

    console.log(`${logKey} started in pooling mode`);
}

if (!config.botan) {
    console.warn(`${logKey} no botan token defined`);
    bot.track = () => {};
} else {
    const botan = require('botanio')(config.botan);
    bot.track = botan.track.bind(botan);
}

bot.handleError = (chatId, request, error) => bot
    .sendMessage(chatId, `Error happen: ${error.message}`)
    .catch(() => {
        console.error(`Error happen in chat ${chatId}: ${error.message}`);
    });

module.exports = bot;
