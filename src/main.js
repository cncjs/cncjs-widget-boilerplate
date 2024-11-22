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
  const { token, version, action } = { ...event.data };

  // Token authentication
  if (token !== params.token) {
    console.warn(`Received a message with an unauthorized token (${token}).`);
    return;
  }

  if (version && semver.satisfies(version, '<1.9.10 || >=2.0.0')) {
    const el = document.getElementById('viewport');
    el.innerHTML = `
      <div style="padding: 10px">
        This widget is not compatible with CNCjs ${version}
      </div>
    `.trim();
    return;
  }

  const { type, payload } = { ...action };
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
