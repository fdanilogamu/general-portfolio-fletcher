// Opt-in live check: creates six real recorded requests; do not run without deployment authorization.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setTimeout as wait } from 'node:timers/promises';
import { STANCES } from '../lib/stances.js';
const base = new URL(process.env.API_BASE_URL || '');
assert.equal(base.protocol, 'https:');
const origin = process.env.WEBSITE_ORIGIN || 'https://thestuffihave.online';
async function stats() {
  const response = await fetch(new URL('/api/stats', base), { headers: { Origin: origin } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), origin);
  const body = await response.json();
  assert.deepEqual(body.stances.map(row => row.stance), STANCES);
  assert.equal(body.total, body.stances.reduce((sum, row) => sum + BigInt(row.downloads), 0n).toString());
  return body;
}
const before = await stats();
for (const stance of STANCES) {
  for (const method of ['HEAD', 'OPTIONS']) {
    const res = await fetch(new URL(`/api/download/${stance}`, base), { method });
    assert.equal(res.status, method === 'HEAD' ? 200 : 204);
    if (method === 'HEAD') assert.equal(res.headers.get('x-download-recorded'), 'false');
  }
  const res = await fetch(new URL(`/api/download/${stance}`, base));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('x-download-recorded'), 'true');
  assert.equal(res.headers.get('content-disposition'), `attachment; filename="${stance}.yaml"`);
  assert.deepEqual(Buffer.from(await res.arrayBuffer()), await readFile(new URL(`../../porpoise/stances/${stance}.yaml`, import.meta.url)));
}
assert.equal((await fetch(new URL('/api/download/unknown', base))).status, 404);
await wait(16000); // Let the public 15-second snapshot expire.
const after = await stats();
for (let i = 0; i < 6; i++) assert.ok(BigInt(after.stances[i].downloads) >= BigInt(before.stances[i].downloads) + 1n);
console.log('PASS: deployed canonical downloads, recorded increments, methods, allowlist, stats, and CORS.');
