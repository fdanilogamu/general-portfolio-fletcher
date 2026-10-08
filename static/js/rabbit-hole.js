(function (root) {
  'use strict';
  const unlockKey = 'rabbit-hole-unlocked';
  const previousKey = 'rabbit-hole-previous';

  function randomIndex(length, crypto = root.crypto, random = Math.random) {
    if (length < 1) return -1;
    if (!crypto || !crypto.getRandomValues) return Math.floor(random() * length);
    const limit = 0x100000000 - (0x100000000 % length);
    const value = new Uint32Array(1);
    do { crypto.getRandomValues(value); } while (value[0] >= limit);
    return value[0] % length;
  }

  function pool(projects, histories, base = '') {
    return [...new Set([
      ...projects.filter(route => typeof route === 'string' && route.startsWith('/') && !route.startsWith('//')),
      ...histories.filter(path => !path.base && path.id && path.published !== false).map(path =>
        `${base}/0-about/resident-inventor.html?history=${encodeURIComponent(path.id)}`)
    ])];
  }

  function select(destinations, current, previous, pick = randomIndex) {
    let choices = destinations.filter(route => route !== current);
    if (!choices.length) return null;
    const fresh = choices.filter(route => route !== previous);
    if (fresh.length) choices = fresh;
    return choices[pick(choices.length)];
  }

  const api = { randomIndex, pool, select };
  if (typeof module !== 'undefined') module.exports = api;
  root.RabbitHole = api;
  if (!root.document) return;
  const document = root.document;
  const source = document.getElementById('rabbit-hole-destinations');
  if (!source) return;
  const script = document.querySelector('script[src$="/static/js/rabbit-hole.js"]');
  const base = new URL(script.src).pathname.replace(/\/static\/js\/rabbit-hole\.js$/, '');
  const destinations = pool(JSON.parse(source.textContent), root.RESIDENT_INVENTOR_PATHS || [], base);
  let unlocked = false;
  let previous = null;
  function read(key) { try { return root.localStorage.getItem(key); } catch (_) { return null; } }
  function write(key, value) { try { root.localStorage.setItem(key, value); } catch (_) { /* Keep working in memory. */ } }
  function sync() {
    unlocked = unlocked || read(unlockKey) === 'true';
    document.querySelectorAll('.rabbit-hole-nav').forEach(button => { button.hidden = !unlocked; });
  }
  api.navigate = function () {
    const url = new URL(root.location.href);
    const history = url.searchParams.get('history');
    const current = url.pathname + (history ? `?history=${encodeURIComponent(history)}` : '');
    const destination = select(destinations, current, read(previousKey) || previous);
    unlocked = true;
    write(unlockKey, 'true');
    sync();
    if (!destination) return;
    previous = destination;
    write(previousKey, destination);
    root.location.assign(destination);
  };
  document.addEventListener('click', event => {
    if (event.target.closest('[data-rabbit-hole]')) api.navigate();
  });
  root.addEventListener('pageshow', sync);
  root.addEventListener('storage', sync);
  sync();
})(typeof window === 'undefined' ? globalThis : window);
