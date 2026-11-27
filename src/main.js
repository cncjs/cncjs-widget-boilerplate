import 'normalize.css';
import qs from 'qs';
import semver from 'semver';
import controller from './lib/controller';
import * as customWidget from './widgets/custom';

// Query Parameters
// * token (required): An authentication token to enable secure communication.
// * host (optional): Specifies the host to connect to. Defaults to an empty string.
const params = qs.parse(window.location.search.slice(1));

window.addEventListener('message', (event) => {
  if (window.parent === window || event.source !== window.parent) {
    return;
  }

  const { token, version, action } = { ...event.data };

  // Token authentication
  if (token !== params.token) {
    console.warn(`Received a message with an unauthorized token (${token}).`);
    return;
  }

  if (version && !semver.satisfies(version, '>=2.0.0-0', { includePrerelease: true })) {
    const el = document.getElementById('root');
    el.textContent = `This widget is not compatible with CNCjs ${version}`;
    return;
  }

  const { type, payload } = { ...action };
  if ((type === 'change' || type === 'widget:fullscreenchange') && typeof payload?.fullscreen === 'boolean') {
    document.documentElement.classList.toggle('widget-fullscreen', payload.fullscreen);
  }

  if (type === 'change') {
    const {
      controller: { type: controllerType },
      connection,
    } = { ...payload };

    // Do not actively close connection if the connection ident is empty
    if (connection.ident) {
      controller.open(controllerType, connection.type, connection.options, (err) => {
        // TODO
      });
    }
  }
});

try {
  customWidget.render();

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

  new ResizeObserver(() => {
    // Use the postMessage API for inter-frame communication
    window.parent.postMessage({
      token: params.token,
      action: {
        type: 'resize',
        payload: {
          clientHeight: document.body.clientHeight,
          clientWidth: document.body.clientWidth,
          offsetHeight: document.body.offsetHeight,
          offsetWidth: document.body.offsetWidth,
          scrollHeight: document.body.scrollHeight,
          scrollWidth: document.body.scrollWidth
        }
      }
    }, '*');
  }).observe(document.body);
} catch(err) {
  console.error(err);
}
