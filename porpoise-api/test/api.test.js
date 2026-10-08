import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { downloadHandler, statsHandler } from '../lib/handlers.js';
import { STANCES } from '../lib/stances.js';
import { INCREMENT_SQL, STATS_SQL } from '../lib/database.js';

async function call(handler, stance, method = 'GET', headers = {}) {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(body) { this.body = body; } };
  await handler({ method, query: { stance }, headers }, res);
  return res;
}
const canonical = stance => readFile(new URL(`../../porpoise/stances/${stance}.yaml`, import.meta.url));
test('all six downloads deliver canonical bytes and one atomic increment', async () => {
  const calls = [];
  const handler = downloadHandler({ budget: () => true, run: async (...args) => { calls.push(args); return [{ downloads: '1' }]; } });
  for (const stance of STANCES) {
    const res = await call(handler, stance);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, await canonical(stance));
    assert.equal(res.headers['Content-Disposition'], `attachment; filename="${stance}.yaml"`);
    assert.equal(res.headers['Content-Type'], 'application/yaml; charset=utf-8');
    assert.equal(res.headers['Cache-Control'], 'no-store');
    assert.equal(res.headers['X-Download-Recorded'], 'true');
  }
  assert.deepEqual(calls, STANCES.map(s => [INCREMENT_SQL, [s]]));
  assert.match(INCREMENT_SQL, /SET downloads = downloads \+ 1/);
  assert.match(INCREMENT_SQL, /WHERE stance = \$1 RETURNING downloads/);
});
test('concurrent requests issue independent atomic SQL updates (mock database)', async () => {
  let count = 0;
  const handler = downloadHandler({ budget: () => true, run: async (sql) => { assert.equal(sql, INCREMENT_SQL); count++; return [{ downloads: String(count) }]; } });
  const responses = await Promise.all(Array.from({ length: 50 }, () => call(handler, 'archivist')));
  assert.equal(count, 50);
  assert.ok(responses.every(res => res.headers['X-Download-Recorded'] === 'true'));
});
test('allowlist rejects arbitrary paths, arrays, and inherited object names without reading', async () => {
  const handler = downloadHandler({ read: () => { throw new Error('Unexpected file access'); }, run: () => assert.fail() });
  for (const bad of ['../schema.sql', '%2e%2e%2farchivist', 'ARCHIVIST', 'toString', 'unknown', '', undefined, ['archivist']]) {
    assert.equal((await call(handler, bad)).statusCode, 404);
  }
});
test('database errors, missing rows, and exhausted budget preserve file availability', async () => {
  for (const options of [{ run: async () => { throw new Error('SECRET'); } }, { run: async () => [] }, { budget: () => false, run: () => assert.fail() }]) {
    const res = await call(downloadHandler(options), 'drafter');
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, await canonical('drafter'));
    assert.equal(res.headers['X-Download-Recorded'], 'false');
  }
  const res = await call(downloadHandler({ read: async () => { throw new Error(); }, run: () => assert.fail() }), 'drafter');
  assert.equal(res.statusCode, 503);
});
test('HEAD, OPTIONS, unsupported methods, and prefetch never increment', async () => {
  const handler = downloadHandler({ run: () => assert.fail() });
  assert.equal((await call(handler, 'archivist', 'HEAD')).body, undefined);
  assert.equal((await call(handler, 'archivist', 'OPTIONS')).statusCode, 204);
  assert.equal((await call(handler, 'archivist', 'POST')).statusCode, 405);
  assert.equal((await call(handler, 'archivist', 'GET', { 'sec-purpose': 'prefetch' })).headers['X-Download-Recorded'], 'false');
});
test('public stats preserve bigint precision, fixed library order, and overall total', async () => {
  const handler = statsHandler({ run: async sql => {
    assert.equal(sql, STATS_SQL);
    return STANCES.map(stance => ({ stance, downloads: '9007199254740993', private: 'secret' })).reverse();
  } });
  const res = await call(handler, undefined, 'GET', { origin: 'https://thestuffihave.online' });
  const body = JSON.parse(res.body);
  assert.deepEqual(body.stances, STANCES.map(stance => ({ stance, downloads: '9007199254740993' })));
  assert.equal(body.total, '54043195528445958');
  assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://thestuffihave.online');
  assert.match(res.headers['Cache-Control'], /s-maxage=15/);
  assert.ok(!res.body.includes('secret'));
  const denied = await call(handler, undefined, 'GET', { origin: 'https://evil.example' });
  assert.equal(denied.headers['Access-Control-Allow-Origin'], undefined);
});
test('stats failure returns unavailable, never invented zeros or internal details', async () => {
  for (const run of [async () => { throw new Error('SECRET PORPOISE_DATABASE_URL'); }, async () => []]) {
    const res = await call(statsHandler({ run }));
    assert.equal(res.statusCode, 503);
    assert.deepEqual(JSON.parse(res.body), { error: 'Statistics temporarily unavailable' });
    assert.equal(res.headers['Cache-Control'], 'no-store');
  }
});
test('schema contains only aggregate columns and preserves counts on initialization', async () => {
  const schema = await readFile(new URL('../schema.sql', import.meta.url), 'utf8');
  assert.equal((schema.match(/CREATE TABLE/gi) || []).length, 1);
  assert.match(schema, /stance text PRIMARY KEY/);
  assert.match(schema, /downloads bigint/);
  assert.match(schema, /updated_at timestamptz/);
  assert.match(schema, /ON CONFLICT \(stance\) DO NOTHING/);
  assert.ok(!/visitor|session|user.agent|fingerprint|ip_address|event/i.test(schema));
});
test('frontend defaults retain six static downloads; activation is explicit', async () => {
  const root = new URL('../../porpoise/', import.meta.url);
  const html = await readFile(new URL('index.html', root), 'utf8');
  for (const stance of STANCES) assert.ok(html.includes(`href="stances/${stance}.yaml"`));
  const config = await readFile(new URL('api-config.js', root), 'utf8');
  const script = await readFile(new URL('downloads.js', root), 'utf8');
  const context = { window: {}, URL, document: { querySelectorAll: () => assert.fail('Defaults must not replace links') } };
  runInNewContext(config, context); runInNewContext(script, context);
  assert.equal(context.window.PORPOISE_API.downloadsEnabled, false);
  const links = STANCES.map(stance => ({ closest: () => ({ dataset: { stance } }) }));
  context.window.PORPOISE_API = { baseUrl: 'https://api.example', downloadsEnabled: true };
  context.document.querySelectorAll = () => links;
  runInNewContext(script, context);
  links.forEach((link, i) => assert.equal(link.href, `https://api.example/api/download/${STANCES[i]}`));
});
