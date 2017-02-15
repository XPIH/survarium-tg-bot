module.exports = {
    env: process.env.NODE_ENV  || 'development',

    front: process.env.FRONT || 'https://survarium.pro',
    api: process.env.API || 'https://survarium.pro/api',

    telegram: {
        hostname: process.env.TELEGRAM_HOSTNAME || require('os').hostname(),
        token: process.env.TELEGRAM_TOKEN,
        botan: process.env.TELEGRAM_BOTAN,
        channels: (process.env.TELEGRAM_CHANNELS || '').split(','),
        hook: {
            key: process.env.TELEGRAM_HOOK_KEY,
            cert: process.env.TELEGRAM_HOOK_CERT,
            port: process.env.TELEGRAM_HOOK_PORT,
            host: process.env.TELEGRAM_HOOK_HOST,
            del: !!process.env.TELEGRAM_HOOK_DEL
        }
    }
};
