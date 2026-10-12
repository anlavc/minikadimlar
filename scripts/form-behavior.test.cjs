const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/site.js'), 'utf8');

function setup(fetch, { valid = true, honeypot = '' } = {}) {
  const handlers = {};
  const classes = new Set();
  const button = { innerHTML: 'Mesajı gönder ↗', textContent: '', disabled: false };
  const status = {
    textContent: '', focused: false,
    classList: { add: c => classes.add(c), remove: (...cs) => cs.forEach(c => classes.delete(c)) },
    focus() { this.focused = true; }
  };
  const form = {
    action: 'https://formspree.io/f/mkjozerq',
    elements: { _gotcha: { value: honeypot } }, resets: 0,
    reportValidity: () => valid, reset() { this.resets++; },
    querySelector: () => button, addEventListener: (name, fn) => { handlers[name] = fn; }
  };
  const timers = [];
  const requests = [];
  vm.runInNewContext(source, {
    document: { querySelector: selector => ({ '#contact-form': form, '#form-status': status }[selector] || null), addEventListener() {} },
    window: { fetch, setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout() {}, matchMedia: () => ({ addEventListener() {} }) },
    fetch: async (...args) => { requests.push(args); return fetch(...args); },
    FormData: class { constructor(value) { this.form = value; } }, AbortController
  });
  return { form, button, status, classes, requests, timers, submit: () => handlers.submit({ preventDefault() {} }) };
}

test('successful send uses the supplied endpoint, resets fields and announces success', async () => {
  const s = setup(async () => ({ ok: true, status: 200 }));
  await s.submit();
  assert.equal(s.requests[0][0], 'https://formspree.io/f/mkjozerq');
  assert.equal(s.requests[0][1].method, 'POST');
  assert.equal(s.requests[0][1].headers.Accept, 'application/json');
  assert.equal(s.form.resets, 1);
  assert.equal(s.button.disabled, false);
  assert.ok(s.classes.has('success'));
  assert.match(s.status.textContent, /Mesajınız gönderildi/);
  assert.equal(s.status.focused, true);
});

for (const code of [422, 429, 500]) {
  test(`HTTP ${code} preserves the draft and restores the send button`, async () => {
    const s = setup(async () => ({ ok: false, status: code }));
    await s.submit();
    assert.equal(s.form.resets, 0);
    assert.equal(s.button.disabled, false);
    assert.ok(s.classes.has('error'));
    assert.match(s.status.textContent, code === 429 ? /çok fazla istek/ : /Gönderim doğrulanamadı/);
  });
}

test('offline failure keeps the draft with an email alternative', async () => {
  const s = setup(async () => { throw new TypeError('offline'); });
  await s.submit();
  assert.equal(s.form.resets, 0);
  assert.match(s.status.textContent, /anilavcidev@gmail.com/);
  assert.equal(s.button.disabled, false);
});

test('slow requests time out without discarding the draft', async () => {
  const s = setup((url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('aborted')));
  }));
  const pending = s.submit();
  assert.equal(s.button.disabled, true);
  s.timers[0]();
  await pending;
  assert.equal(s.form.resets, 0);
  assert.equal(s.button.disabled, false);
  assert.ok(s.classes.has('error'));
});

test('invalid forms and filled honeypots never call Formspree', async () => {
  for (const options of [{ valid: false }, { honeypot: 'spam' }]) {
    const s = setup(async () => ({ ok: true }), options);
    await s.submit();
    assert.equal(s.requests.length, 0);
    assert.equal(s.form.resets, 0);
  }
});

test('double submit only sends one request while the first is pending', async () => {
  let resolve;
  const s = setup(() => new Promise(r => { resolve = r; }));
  const first = s.submit();
  await s.submit();
  assert.equal(s.requests.length, 1);
  resolve({ ok: true });
  await first;
  assert.equal(s.form.resets, 1);
});
