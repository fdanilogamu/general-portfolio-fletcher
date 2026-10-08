import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { STANCES } from '../lib/stances.js';
const script = await readFile(new URL('../../porpoise/downloads.js', import.meta.url), 'utf8');
const config = await readFile(new URL('../../porpoise/api-config.js', import.meta.url), 'utf8');
function setup(fetch) {
  const saved = [], requests = [], revoked = [];
  const links = STANCES.map(stance => ({
    getAttribute: key => key === 'href' ? `stances/${stance}.yaml` : `${stance}.yaml`,
    closest: () => ({ dataset: { stance } }),
    addEventListener(name, callback) { this.click = callback; }
  }));
  class BrowserURL extends URL {
    static createObjectURL(blob) { assert.equal(blob, 'YAML-BLOB'); return 'blob:download'; }
    static revokeObjectURL(url) { revoked.push(url); }
  }
  const context = {
    window: {}, URL: BrowserURL, AbortSignal, setTimeout: callback => callback(),
    document: { baseURI: 'https://thestuffihave.online/porpoise/', querySelectorAll: () => links,
      body: { appendChild() {} }, createElement: () => ({ click() { saved.push({ href: this.href, download: this.download }); }, remove() {} }) },
    fetch: async (...args) => { requests.push(args); return fetch(...args); }
  };
  runInNewContext(config, context); runInNewContext(script, context);
  return { links, saved, requests, revoked };
}
const event = overrides => ({ button: 0, preventDefault() { this.prevented = true; }, ...overrides });
test('all six primary clicks use the production API once and download its response without credentials', async () => {
  const state = setup(async () => ({ ok: true, headers: new Headers({ 'content-type': 'application/yaml; charset=utf-8' }), blob: async () => 'YAML-BLOB' }));
  for (let i = 0; i < STANCES.length; i++) {
    assert.equal(state.links[i].href, `https://general-portfolio-fletcher-porpoise.vercel.app/api/download/${STANCES[i]}`);
    await state.links[i].click(event());
    assert.equal(state.requests[i][0], state.links[i].href);
    assert.equal(state.requests[i][1].credentials, 'omit');
    assert.ok(state.requests[i][1].signal instanceof AbortSignal);
    assert.deepEqual(state.saved[i], { href: 'blob:download', download: `${STANCES[i]}.yaml` });
  }
  assert.equal(state.requests.length, 6);
  assert.equal(state.revoked.length, 6);
});
test('network, timeout, HTTP and non-YAML responses fall back to each original static URL without retrying', async () => {
  for (const fetch of [async () => { throw new Error('offline'); }, async () => { throw new DOMException('Timed out', 'TimeoutError'); },
    async () => ({ ok: false }), async () => ({ ok: true, headers: new Headers({ 'content-type': 'text/html' }) })]) {
    const state = setup(fetch);
    for (let i = 0; i < STANCES.length; i++) {
      await state.links[i].click(event());
      assert.deepEqual(state.saved[i], { href: `https://thestuffihave.online/porpoise/stances/${STANCES[i]}.yaml`, download: `${STANCES[i]}.yaml` });
    }
    assert.equal(state.requests.length, 6);
  }
});
test('modified clicks preserve browser behavior and pending clicks do not issue duplicate requests', async () => {
  let finish;
  const state = setup(() => new Promise(resolve => { finish = resolve; }));
  for (const override of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
    const click = event(override);
    await state.links[0].click(click);
    assert.equal(click.prevented, undefined);
  }
  assert.equal(state.requests.length, 0);
  const pending = state.links[0].click(event());
  await state.links[0].click(event());
  assert.equal(state.requests.length, 1);
  finish({ ok: false }); await pending;
  assert.equal(state.saved.length, 1);
});
