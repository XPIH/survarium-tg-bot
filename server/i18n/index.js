const DICT = {
    ua: require('./ua')
};

const LANGS = Object.keys(DICT);
const DEFAULT_LANG = 'ua';

module.exports = (key, opts) => {
    let lang = opts && opts.lang && LANGS.includes(opts.lang) && opts.lang || DEFAULT_LANG;

    return DICT[lang][key];
};
