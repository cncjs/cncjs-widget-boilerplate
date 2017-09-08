/* eslint no-continue: 0 */
const parse = (qs = '') => {
    if (qs[0] === '?') {
        qs = qs.slice(1);
    }
    const query = {};
    const arr = qs.split('&');
    for (let i = 0; i < arr.length; ++i) {
        if (!arr) {
            continue;
        }
        const [key, value] = arr[i].split('=');
        if (!key) {
            continue;
        }
        query[decodeURIComponent(key)] = decodeURIComponent(value);
    }
    return query;
};

export default {
    parse
};
