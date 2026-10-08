(() => {
  const config = window.PORPOISE_API;
  if (!config?.downloadsEnabled || !config.baseUrl) return;
  let base;
  try { base = new URL(config.baseUrl); } catch { return; }
  if (base.protocol !== 'https:' || base.pathname !== '/' || base.search || base.hash || base.username || base.password) return;
  document.querySelectorAll('.stance-card[data-stance] .download').forEach(link => {
    const stance = link.closest('[data-stance]').dataset.stance;
    link.href = `${base.origin}/api/download/${encodeURIComponent(stance)}`;
  });
})();
