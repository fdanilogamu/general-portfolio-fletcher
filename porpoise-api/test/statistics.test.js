import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { STANCES } from '../lib/stances.js';
const script = await readFile(new URL('../../porpoise/statistics.js', import.meta.url), 'utf8');
async function render({ baseUrl = 'https://api.example', fetch = async () => { throw new Error(); } } = {}) {
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, { hidden: false, style: {}, textContent: '', addEventListener() {} });
    return elements.get(id);
  };
  runInNewContext(script, {
    window: { PORPOISE_API: { baseUrl } }, document: { getElementById: get },
    URL, AbortSignal, fetch, Date, BigInt
  });
  await new Promise(resolve => setImmediate(resolve));
  return get;
}
test('unconfigured and unavailable statistics remain usable and do not fabricate counts', async () => {
  let get = await render({ baseUrl: '', fetch: () => assert.fail() });
  assert.match(get('stats-status').textContent, /not connected/);
  assert.equal(get('stats-panel').hidden, true);
  get = await render();
  assert.match(get('stats-status').textContent, /temporarily unavailable/);
  assert.equal(get('stats-retry').hidden, false);
});
test('zero and nonzero snapshots render counts and proportional bars in library order', async () => {
  for (const amount of ['0', '15']) {
    const get = await render({ fetch: async (_, options) => {
      assert.equal(options.credentials, 'omit');
      return { ok: true, json: async () => ({ stances: STANCES.map(stance => ({ stance, downloads: amount })), total: String(BigInt(amount) * 6n), generatedAt: '2026-10-08T00:00:00Z' }) };
    } });
    assert.equal(get('stats-panel').hidden, false);
    assert.equal(get('stats-total').textContent, amount === '0' ? '0' : '90');
    for (const stance of STANCES) {
      assert.equal(get(`count-${stance}`).textContent, amount);
      assert.equal(get(`bar-${stance}`).style.width, amount === '0' ? '0%' : '100%');
    }
    assert.match(get('stats-status').textContent, amount === '0' ? /No downloads/ : /15 seconds/);
  }
});
test('malformed public stats fail safely', async () => {
  const get = await render({ fetch: async () => ({ ok: true, json: async () => ({ total: '0', stances: [] }) }) });
  assert.equal(get('stats-panel').hidden, true);
  assert.match(get('stats-status').textContent, /temporarily unavailable/);
});
