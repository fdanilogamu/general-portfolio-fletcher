(() => {
  const status = document.getElementById('stats-status');
  const panel = document.getElementById('stats-panel');
  const retry = document.getElementById('stats-retry');
  const slugs = ['archivist', 'challenger', 'confidante', 'drafter', 'explorer', 'panic-room'];
  const format = value => BigInt(value).toLocaleString();
  async function load() {
    panel.hidden = true; retry.hidden = true;
    status.textContent = 'Loading recorded download counts…';
    let base;
    try {
      const config = window.PORPOISE_API;
      if (!config?.baseUrl) {
        status.textContent = 'Download statistics are not connected yet. All six stances are available in the library.';
        return;
      }
      base = new URL(config.baseUrl);
      if (base.protocol !== 'https:' || base.pathname !== '/' || base.search || base.hash || base.username || base.password) throw new Error();
      const response = await fetch(`${base.origin}/api/stats`, { credentials: 'omit', signal: AbortSignal.timeout(6000) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!Array.isArray(data.stances) || data.stances.length !== 6 || !/^\d+$/.test(data.total)) throw new Error();
      const counts = slugs.map(slug => {
        const matches = data.stances.filter(row => row.stance === slug);
        if (matches.length !== 1 || !/^\d+$/.test(matches[0].downloads)) throw new Error();
        return BigInt(matches[0].downloads);
      });
      if (counts.reduce((a, b) => a + b, 0n) !== BigInt(data.total)) throw new Error();
      const timestamp = new Date(data.generatedAt);
      if (!Number.isFinite(timestamp.getTime())) throw new Error();
      document.getElementById('stats-total').textContent = format(data.total);
      const maximum = counts.reduce((a, b) => a > b ? a : b, 0n);
      slugs.forEach((slug, i) => {
        document.getElementById(`count-${slug}`).textContent = format(counts[i]);
        document.getElementById(`bar-${slug}`).style.width = `${maximum ? Number(counts[i] * 10000n / maximum) / 100 : 0}%`;
      });
      panel.hidden = false;
      status.textContent = maximum === 0n ? 'No downloads have been recorded yet. Explore the stance library to get started.' : `Snapshot: ${timestamp.toLocaleString()}. Statistics may be cached for up to 15 seconds.`;
    } catch {
      status.textContent = 'Statistics are temporarily unavailable. You can still download every stance from the library.';
      retry.hidden = false;
    }
  }
  retry.addEventListener('click', load);
  load();
})();
