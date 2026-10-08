import { test } from 'node:test';
import assert from 'node:assert/strict';
import { neonConfig } from '@neondatabase/serverless';
import { query, INCREMENT_SQL } from '../lib/database.js';

// Synthetic connection strings only. Intercept the driver transport; no Neon calls.
test('database connection uses only PORPOISE_DATABASE_URL and never the integration variable', async () => {
  const originalPorpoise = process.env.PORPOISE_DATABASE_URL;
  const originalIntegration = process.env.DATABASE_URL;
  const originalFetch = neonConfig.fetchFunction;
  let calls = 0;
  try {
    process.env.DATABASE_URL = 'postgresql://test:test@integration.neon.tech/other-database?sslmode=require';
    delete process.env.PORPOISE_DATABASE_URL;
    neonConfig.fetchFunction = async (_, options) => {
      calls++;
      assert.equal(new Headers(options.headers).get('Neon-Connection-String'), process.env.PORPOISE_DATABASE_URL);
      assert.deepEqual(JSON.parse(options.body), { query: INCREMENT_SQL, params: ['archivist'] });
      assert.ok(options.signal instanceof AbortSignal);
      return new Response(JSON.stringify({ fields: [{ name: 'downloads', dataTypeID: 25 }], rows: [['1']] }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    };
    await assert.rejects(query(INCREMENT_SQL, ['archivist']), { message: 'Database unavailable' });
    assert.equal(calls, 0, 'Missing Porpoise configuration must not use DATABASE_URL');
    process.env.PORPOISE_DATABASE_URL = 'postgresql://test:test@porpoise.neon.tech/porpoise-database?sslmode=require';
    assert.deepEqual(await query(INCREMENT_SQL, ['archivist']), [{ downloads: '1' }]);
    assert.equal(calls, 1);
    delete process.env.DATABASE_URL;
    assert.deepEqual(await query(INCREMENT_SQL, ['archivist']), [{ downloads: '1' }]);
    assert.equal(calls, 2, 'The integration variable is not required');
  } finally {
    neonConfig.fetchFunction = originalFetch;
    if (originalPorpoise === undefined) delete process.env.PORPOISE_DATABASE_URL;
    else process.env.PORPOISE_DATABASE_URL = originalPorpoise;
    if (originalIntegration === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalIntegration;
  }
});
