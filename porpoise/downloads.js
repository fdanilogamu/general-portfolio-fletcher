(() => {
  const config = window.PORPOISE_API;
  if (!config?.downloadsEnabled || !config.baseUrl) return;
  let base;
  try { base = new URL(config.baseUrl); } catch { return; }
  if (base.protocol !== 'https:' || base.pathname !== '/' || base.search || base.hash || base.username || base.password) return;
  document.querySelectorAll('.stance-card[data-stance] .download').forEach(link => {
    const stance = link.closest('[data-stance]').dataset.stance;
    const staticUrl = new URL(link.getAttribute('href'), document.baseURI).href;
    const filename = link.getAttribute('download');
    link.href = `${base.origin}/api/download/${encodeURIComponent(stance)}`;
    let pending = false;
    const save = url => {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    };
    link.addEventListener('click', async event => {
      // Preserve normal browser behavior for modified clicks and new tabs.
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (pending) return;
      pending = true;
      try {
        const response = await fetch(link.href, { credentials: 'omit', signal: AbortSignal.timeout(6000) });
        if (!response.ok || !response.headers.get('content-type')?.includes('application/yaml')) throw new Error();
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        save(url);
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } catch {
        // Do not retry the counted request: a timed-out increment may have committed.
        save(staticUrl);
      } finally { pending = false; }
    });
  });
})();
