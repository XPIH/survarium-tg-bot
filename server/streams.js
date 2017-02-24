const got    = require('got');
const bot    = require('./bot');
const cache  = require('./cache');
const config = require('./config');

const KEY = config.streams.youtubeKey;
const HANDLE = 'https://www.googleapis.com/youtube/v3';
const CHANNELS = config.streams.channels;

const notifyAboutStream = (stream) => {
    const videoId = stream.id.videoId;
    const cacheKey = `streams:yt:${videoId}`;

    const notify = () => {
        let message = `<a href="https://www.youtube.com/watch?v=${videoId}">${stream.snippet.title}</a>`;

        cache.set(cacheKey, 1, 'EX', 60 * 60 * 24);

        return Promise.all(CHANNELS.map(channel => bot.sendMessage(channel, message, {
            parse_mode: 'HTML',
            disable_web_page_preview: false
        })));
    };

    return cache.exists(cacheKey)
        .then(result => result ? null : notify())
        .catch(notify);
};

const getYoutubeLiveStreams = () => {
    const query = {
        maxResults     : 6,
        key            : KEY,
        q              : 'survarium',
        type           : 'video',
        order          : 'date',
        part           : 'snippet',
        videoEmbeddable: 'any',
        videoSyndicated: 'any',
        videoDefinition: 'any',
        videoDuration  : 'any',
        eventType      : 'live'
    };

    return got(`${HANDLE}/search`, {
        query,
        json: true,
        headers: {
            'referer': 'https://survarium.pro'
        }
    }).then(res => {
        const result = res.body;

        if (!result.items || !result.items.length) {
            return;
        }

        return new Promise((resolve) => {
            const items = result.items;

            const next = () => {
                if (!items.length) {
                    return resolve();
                }

                return notifyAboutStream(items.shift())
                    .then(next)
                    .catch(next);
            };

            next();
        });
    }).catch(err => {
        console.log(err);
    }).then(() => {
        setTimeout(getYoutubeLiveStreams, config.streams.refreshInterval)
    });
};

getYoutubeLiveStreams();

