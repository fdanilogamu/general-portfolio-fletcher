import { readFile } from 'node:fs/promises';
import { STANCES } from './stances.js';
import { query, INCREMENT_SQL, STATS_SQL } from './database.js';

// Per-instance global budget; no visitor keys. This is not a distributed rate limiter.
let windowStart = 0, writes = 0;
function allowWrite() {
  const now = Date.now();
  if (now - windowStart >= 60000) { windowStart = now; writes = 0; }
  return writes++ < 120;
}
function common(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Origin');
  const origins = (process.env.ALLOWED_ORIGINS || 'https://thestuffihave.online,http://localhost:4000,http://127.0.0.1:4000').split(',').map(s => s.trim());
  if (origins.includes(req.headers.origin)) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Expose-Headers', 'X-Download-Recorded');
  }
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return false; }
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD, OPTIONS'); res.statusCode = 405; res.end(); return false;
  }
  return true;
}
function json(res, status, body) {
  res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}
export function downloadHandler({ run = query, read = readFile, budget = allowWrite } = {}) {
  return async (req, res) => {
    if (!common(req, res)) return;
    const stance = req.query?.stance;
    if (typeof stance !== 'string' || !STANCES.includes(stance)) return json(res, 404, { error: 'Unknown stance' });
    let file;
    try { file = await read(new URL(`../assets/${stance}.yaml`, import.meta.url)); }
    catch { return json(res, 503, { error: 'File temporarily unavailable' }); }
    let recorded = false;
    const speculative = /prefetch|prerender/i.test(`${req.headers.purpose || ''} ${req.headers['sec-purpose'] || ''}`);
    if (req.method === 'GET' && !speculative && budget()) {
      try { recorded = (await run(INCREMENT_SQL, [stance])).length === 1; } catch { /* Deliver file; do not log request or credentials. */ }
    }
    res.setHeader('Content-Type', 'application/yaml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${stance}.yaml"`);
    res.setHeader('Content-Length', file.length);
    res.setHeader('X-Download-Recorded', String(recorded));
    res.statusCode = 200; res.end(req.method === 'HEAD' ? undefined : file);
  };
}
export function statsHandler({ run = query } = {}) {
  return async (req, res) => {
    if (!common(req, res)) return;
    if (req.method === 'HEAD') { res.statusCode = 200; res.end(); return; }
    try {
      const rows = await run(STATS_SQL);
      const stances = STANCES.map(stance => {
        const row = rows.find(row => row.stance === stance);
        if (!row || !/^\d+$/.test(String(row.downloads))) throw new Error('Invalid aggregate');
        return { stance, downloads: String(row.downloads) };
      });
      const total = stances.reduce((sum, row) => sum + BigInt(row.downloads), 0n).toString();
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=15, must-revalidate');
      json(res, 200, { stances, total, generatedAt: new Date().toISOString() });
    } catch { json(res, 503, { error: 'Statistics temporarily unavailable' }); }
  };
}
