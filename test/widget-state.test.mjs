import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import qs from 'qs';
import semver from 'semver';

// Execute the actual entry point with only its imports replaced by controlled
// dependencies, so its message validation, startup, and resize paths run together.
const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
  .replace(/^import .*;\n/gm, '');

function setup({ standalone = false } = {}) {
  const listeners = new Map();
  const classes = new Set();
  const opened = [];
  const sent = [];
  const warnings = [];
  const root = { textContent: '' };
  let connected;
  let resized;
  let observed;
  let rendered = 0;
  const parent = { postMessage: (...args) => sent.push(args) };
  const window = {
    parent,
    location: { search: '?token=secret&host=http%3A%2F%2Flocalhost%3A8000' },
    addEventListener: (type, callback) => listeners.set(type, callback),
  };
  if (standalone) window.parent = window;
  const body = {
    clientHeight: 100, clientWidth: 200,
    offsetHeight: 101, offsetWidth: 201,
    scrollHeight: 102, scrollWidth: 202,
  };
  const document = {
    body,
    documentElement: { classList: { toggle: (name, enabled) => {
      if (enabled) classes.add(name);
      else classes.delete(name);
    } } },
    getElementById: () => root,
  };
  vm.runInNewContext(source, {
    window, document, qs, semver,
    console: { warn: (...args) => warnings.push(args), error: assert.fail },
    customWidget: { render: () => { rendered += 1; } },
    controller: {
      connect: (...args) => { connected = args; },
      open: (...args) => opened.push(args),
    },
    ResizeObserver: class {
      constructor(callback) { resized = callback; }
      observe(target) { observed = target; }
    },
  });
  const message = (type, payload, overrides = {}, source = parent) => {
    listeners.get('message')({ source, data: {
      token: 'secret', version: '2.0.0-alpha.4', action: { type, payload }, ...overrides,
    } });
  };
  return {
    message, opened, sent, warnings, root, body,
    get connected() { return connected; },
    get observed() { return observed; },
    get rendered() { return rendered; },
    reconnect: () => connected[2](), resize: () => resized(),
    fullscreen: () => classes.has('widget-fullscreen'),
  };
}

const metadata = (ident = 'serial:port') => ({
  controller: { type: 'Grbl' },
  connection: { ident, type: 'serial', options: { port: '/dev/test', baudrate: 115200 } },
});

for (const initial of [false, true]) {
  test(`initial ${initial} and repeated enter/exit transitions`, () => {
    const widget = setup();
    for (const fullscreen of [initial, true, true, false, false, true, false]) {
      widget.message('widget:state', { fullscreen });
      assert.equal(widget.fullscreen(), fullscreen);
    }
    assert.equal(widget.opened.length, 0);
  });

  for (const stateFirst of [false, true]) {
    test(`independent messages: fullscreen ${initial}, state first ${stateFirst}`, () => {
      const widget = setup();
      const state = () => widget.message('widget:state', { fullscreen: initial });
      const change = () => widget.message('change', metadata());
      (stateFirst ? [state, change] : [change, state]).forEach((send) => send());
      assert.equal(widget.fullscreen(), initial);
      assert.equal(widget.opened.length, 1);
      assert.equal(widget.opened[0][0], 'Grbl');
      assert.equal(widget.opened[0][1], 'serial');
      assert.deepEqual(widget.opened[0][2], metadata().connection.options);
    });
  }
}

test('change and legacy actions do not alter fullscreen; empty ident does not open', () => {
  const widget = setup();
  widget.message('change', { ...metadata(), fullscreen: true });
  assert.equal(widget.fullscreen(), false);
  widget.message('widget:state', { fullscreen: true });
  widget.message('change', { ...metadata(''), fullscreen: false });
  widget.message('widget:fullscreenchange', { fullscreen: false });
  assert.equal(widget.fullscreen(), true);
  assert.equal(widget.opened.length, 1);
});

test('missing and invalid fullscreen retain either current state without opening controller', () => {
  const widget = setup();
  for (const fullscreen of [false, true]) {
    widget.message('widget:state', { fullscreen });
    for (const payload of [undefined, null, {}, false, true, 0, 'true',
      { fullscreen: null }, { fullscreen: 'false' }, { fullscreen: 0 },
      { fullscreen: 1 }, { fullscreen: {} }, { fullscreen: [] }]) {
      widget.message('widget:state', payload);
      assert.equal(widget.fullscreen(), fullscreen);
    }
  }
  assert.equal(widget.opened.length, 0);
});

test('source, token and version gates apply to both message types', () => {
  for (const type of ['widget:state', 'change']) {
    const payload = type === 'change' ? metadata() : { fullscreen: true };
    for (const rejected of [
      (w) => w.message(type, payload, {}, {}),
      (w) => w.message(type, payload, { token: 'wrong' }),
      (w) => w.message(type, payload, { version: '1.9.99' }),
    ]) {
      const widget = setup();
      rejected(widget);
      assert.equal(widget.fullscreen(), false);
      assert.equal(widget.opened.length, 0);
    }
    const widget = setup({ standalone: true });
    widget.message(type, payload);
    assert.equal(widget.fullscreen(), false);
    assert.equal(widget.opened.length, 0);
  }
  const widget = setup();
  widget.message('widget:state', { fullscreen: true }, { version: undefined });
  assert.equal(widget.fullscreen(), true);
  widget.message('widget:state', { fullscreen: false }, { version: '1.9.99' });
  assert.equal(widget.root.textContent, 'This widget is not compatible with CNCjs 1.9.99');
  assert.equal(widget.fullscreen(), true);
});

test('connect, reconnect snapshots and resize retain existing behavior', () => {
  const widget = setup();
  assert.equal(widget.rendered, 1);
  assert.equal(widget.connected[0], 'http://localhost:8000');
  assert.equal(widget.connected[1].query, 'token=secret');
  assert.equal(widget.observed, widget.body);
  for (const fullscreen of [true, false, true]) {
    widget.reconnect();
    widget.message('widget:state', { fullscreen });
    widget.message('change', metadata());
    assert.equal(widget.fullscreen(), fullscreen);
  }
  assert.equal(widget.opened.length, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(widget.sent)), Array.from({ length: 3 }, () => [
    { token: 'secret', action: { type: 'connect' } }, '*',
  ]));
  widget.resize();
  assert.deepEqual(JSON.parse(JSON.stringify(widget.sent.at(-1))), [{
    token: 'secret', action: { type: 'resize', payload: widget.body },
  }, '*']);
});
