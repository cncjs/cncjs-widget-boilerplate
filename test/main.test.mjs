import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import qs from 'qs';
import semver from 'semver';

// Execute the real entry point with browser/socket dependencies replaced.
const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
  .replace(/^import .*;\n/gm, '');

const setup = ({ initial = false, standalone = false } = {}) => {
  let fullscreen = initial;
  let onMessage;
  const ports = [];
  const replies = [];
  const viewport = { innerHTML: '' };
  const parent = { postMessage: (message) => replies.push(message) };
  const window = {
    parent,
    location: { search: '?token=secret&host=http%3A%2F%2Fhost' },
    addEventListener: (type, handler) => { onMessage = handler; }
  };
  if (standalone) window.parent = window;
  const context = {
    window,
    document: {
      documentElement: { classList: { toggle: (name, value) => {
        assert.equal(name, 'widget-fullscreen');
        fullscreen = value;
      } } },
      getElementById: () => viewport,
      body: {}
    },
    controller: {
      openPort: (port) => ports.push(port),
      connect: (host, options, callback) => {
        assert.equal(host, 'http://host');
        assert.equal(options.query, 'token=secret');
        if (!standalone) callback();
      }
    },
    customWidget: { render() {} },
    ResizeObserver: class { observe() {} },
    console: { warn() {}, error: (error) => { throw error; } },
    qs,
    semver
  };
  vm.runInNewContext(source, context);
  return {
    ports, replies, viewport,
    fullscreen: () => fullscreen,
    send: (type, payload, envelope = {}) => onMessage({
      source: parent,
      data: { token: 'secret', version: '1.10.7', action: { type, payload } },
      ...envelope
    })
  };
};

for (const initial of [false, true]) {
  test(`independent state applies initial ${initial} and transitions`, () => {
    const widget = setup({ initial: !initial });
    widget.send('widget:state', { fullscreen: initial, port: '/ignored' });
    assert.equal(widget.fullscreen(), initial);
    widget.send('widget:state', { fullscreen: !initial });
    assert.equal(widget.fullscreen(), !initial);
    widget.send('widget:state', { fullscreen: initial });
    assert.equal(widget.fullscreen(), initial);
    assert.deepEqual(widget.ports, []);
  });
}

for (const stateFirst of [false, true]) {
  test(`state and port change work with stateFirst=${stateFirst}`, () => {
    const widget = setup();
    const state = () => widget.send('widget:state', { fullscreen: true });
    const change = () => widget.send('change', { port: '/dev/ttyUSB0', fullscreen: false });
    if (stateFirst) { state(); change(); } else { change(); state(); }
    widget.send('widget:fullscreenchange', { fullscreen: false });
    assert.equal(widget.fullscreen(), true);
    assert.deepEqual(widget.ports, ['/dev/ttyUSB0']);
    widget.send('widget:state', { fullscreen: false });
    widget.send('change', { port: '/dev/ttyUSB1', fullscreen: true });
    widget.send('widget:fullscreenchange', { fullscreen: true });
    assert.equal(widget.fullscreen(), false);
    assert.deepEqual(widget.ports, ['/dev/ttyUSB0', '/dev/ttyUSB1']);
  });
}

test('missing and invalid fullscreen leave the current state alone', () => {
  for (const payload of [undefined, null, {}, { fullscreen: undefined },
    { fullscreen: null }, { fullscreen: 0 }, { fullscreen: 1 },
    { fullscreen: 'true' }, { fullscreen: 'false' }]) {
    const widget = setup();
    widget.send('widget:state', payload);
    assert.equal(widget.fullscreen(), false);
    widget.send('widget:state', { fullscreen: true });
    assert.equal(widget.fullscreen(), true);
    for (const type of ['widget:state', 'change', 'widget:fullscreenchange']) {
      widget.send(type, payload);
      assert.equal(widget.fullscreen(), true);
    }
    widget.send('widget:fullscreenchange', { fullscreen: false });
    assert.equal(widget.fullscreen(), true);
  }
});

test('connect and port handling remain unchanged while old fullscreen formats are ignored', () => {
  const widget = setup({ initial: true });
  assert.equal(widget.replies.length, 1);
  assert.equal(widget.replies[0].action.type, 'connect');
  assert.equal(widget.replies[0].token, 'secret');
  widget.send('change', { port: '/dev/ttyUSB0', fullscreen: false });
  assert.equal(widget.fullscreen(), true);
  widget.send('widget:fullscreenchange', { fullscreen: true });
  assert.equal(widget.fullscreen(), true);
  widget.send('widget:fullscreenchange', { fullscreen: false });
  assert.equal(widget.fullscreen(), true);
  widget.send('change', { port: '/dev/ttyUSB1' });
  widget.send('change', { port: '' });
  widget.send('change');
  assert.equal(widget.fullscreen(), true);
  assert.deepEqual(widget.ports, ['/dev/ttyUSB0', '/dev/ttyUSB1']);
});

for (const initial of [false, true]) {
  test(`old fullscreen formats are ignored before and after state with initial=${initial}`, () => {
    const widget = setup({ initial });
    for (const afterState of [false, true]) {
      if (afterState) widget.send('widget:state', { fullscreen: initial });
      for (const type of ['change', 'widget:fullscreenchange']) {
        widget.send(type, { fullscreen: !initial });
        assert.equal(widget.fullscreen(), initial);
      }
    }
  });
}

test('version gate still rejects incompatible controller changes', () => {
  for (const version of ['1.9.9', '2.0.0']) {
    const widget = setup();
    widget.send('change', undefined, { data: {
      token: 'secret', version,
      action: { type: 'change', payload: { port: '/dev/ttyUSB0', fullscreen: true } }
    } });
    assert.deepEqual(widget.ports, []);
    assert.equal(widget.fullscreen(), false);
    assert.match(widget.viewport.innerHTML, /not compatible with CNCjs/);
  }
});

test('source, token, and existing version gates also protect widget state', () => {
  for (const envelope of [
    { source: {} },
    { data: { token: 'wrong', action: { type: 'widget:state', payload: { fullscreen: true } } } },
    ...['1.9.9', '2.0.0', '2.1.0'].map((version) => ({ data: {
      token: 'secret', version, action: { type: 'widget:state', payload: { fullscreen: true } }
    } }))
  ]) {
    const widget = setup();
    widget.send('widget:state', { fullscreen: true }, envelope);
    assert.equal(widget.fullscreen(), false);
    widget.send('widget:state', { fullscreen: true });
    assert.equal(widget.fullscreen(), true);
  }
  const widget = setup({ standalone: true });
  widget.send('widget:state', { fullscreen: true });
  assert.equal(widget.fullscreen(), false);
});
