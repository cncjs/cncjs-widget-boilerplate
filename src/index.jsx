import React from 'react';
import ReactDOM from 'react-dom';
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
const container = params.container || 'App';
import(`./containers/${container}`)
    .then(({ default: Component }) => {
        ReactDOM.render(
            <Component />,
            document.getElementById('viewport')
        );

        if (!params.token) {
            return;
        }

        const host = ''; // e.g. http://localhost:8000
        const options = {
            query: 'token=' + params.token
        };
        controller.connect(host, options, () => {
            window.parent.postMessage({
                token: params.token,
                action: {
                    type: 'connect'
                }
            }, '*');
        });
    });
