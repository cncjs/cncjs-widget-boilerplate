import browser from 'detect-browser';
import logger from 'universal-logger';
import { styleable } from 'universal-logger-browser';
import emoji from 'node-emoji';

const namespace = emoji.get('speech_balloon');
const colorized = browser && (['ie', 'edge'].indexOf(browser.name) < 0);
const log = logger(namespace)
    .use(styleable({
        colorized: colorized,
        showSource: true,
        showTimestamp: true
    }));

log.enableStackTrace();

export default log;
