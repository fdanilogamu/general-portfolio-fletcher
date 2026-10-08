// No request data reaches this module. One SQL statement serializes concurrent increments.
export const INCREMENT_SQL = `UPDATE porpoise_download_counts
SET downloads = downloads + 1, updated_at = now() WHERE stance = $1 RETURNING downloads`;
export const STATS_SQL = 'SELECT stance, downloads::text AS downloads FROM porpoise_download_counts';
export async function query(text, params = []) {
  if (!process.env.PORPOISE_DATABASE_URL) throw new Error('Database unavailable');
  const { neon } = await import('@neondatabase/serverless');
  return neon(process.env.PORPOISE_DATABASE_URL).query(text, params, {
    fetchOptions: { signal: AbortSignal.timeout(2000) }
  });
}
