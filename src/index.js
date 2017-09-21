import qs from 'qs';
import controller from './lib/controller';
import log from './lib/log';
import './styles/vendor.styl';
import './styles/app.styl';

// Query Parameters
// * token (required): An authentication token to enable secure communication.
// * host (optional): Specifies the host to connect to. Defaults to an empty string.
// * widget (optional): Specifies a folder name under 'src/widgets'. Defaults to 'ReactApp'.
const params = qs.parse(window.location.search.slice(1));

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
    if (type === 'change') {
        // Do not close the port if the port parameter is empty
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
        const host = params.host || ''; // e.g. http://localhost:8000
        const options = {
            query: 'token=' + params.token
        };
        controller.connect(host, options, () => {
            // Use the postMessage API for inter-frame communication
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
