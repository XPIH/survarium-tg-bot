const DICT = {
    ru: require('./ru')
};

const LANGS = Object.keys(DICT);
const DEFAULT_LANG = 'ru';

module.exports = (key, opts) => {
    let lang = opts && opts.lang && LANGS.includes(opts.lang) && opts.lang || DEFAULT_LANG;

    return DICT[lang][key];
};
