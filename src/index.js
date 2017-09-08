import controller from './lib/controller';
import query from './lib/query';
import log from './lib/log';
import './styles/vendor.styl';
import './styles/app.styl';

const params = query.parse(window.location.search);

window.addEventListener('message', (event) => {
    // TODO: event.origin

    const { token, action } = { ...event.data };

    // Token authentication
    if (token !== params.token) {
        if (process.env.NODE_ENV === 'production') {
            log.warn(`Received a message with an unauthorized token (${token}).`);
        }
        return;
    }

    const { type, payload } = { ...action };
    if (type === 'update') {
        const { port } = { ...payload };
        port && controller.openPort(port);
    }
});

// Dynamic imports
const widget = params.widget || 'ReactApp';
import(`./widgets/${widget}`)
    .then(m => {
        const { default: render } = m;

        if (typeof render !== 'function') {
            log.error(`Expected a function but got ${render}. Check the default export in "widgets/${widget}".`);
            return undefined;
        }

        return render();
    })
    .then(() => {
        if (!params.token) {
            return;
        }

        // Connect to a socket.io server
        const host = ''; // e.g. http://localhost:8000
        const options = {
            query: 'token=' + params.token
        };
        controller.connect(host, options, () => {
            // Post a message to the parent window
            window.parent.postMessage({
                token: params.token,
                action: {
                    type: 'connect'
                }
            }, '*');
        });
    })
    .catch(err => {
        log.error(err);
    });
