(function (root) {
  'use strict';
  const unlockKey = 'rabbit-hole-unlocked';
  const sessionKey = 'rabbit-hole-session';

  function normalize(route) {
    if (typeof route !== 'string' || !route.startsWith('/') || route.startsWith('//')) return null;
    try {
      const url = new URL(route, 'https://rabbit-hole.invalid');
      if (url.origin !== 'https://rabbit-hole.invalid') return null;
      url.pathname = decodeURI(url.pathname).replace(/\/index\.html$/, '/');
      url.searchParams.sort();
      return url.pathname + url.search;
    } catch (_) { return null; }
  }

  function cleanState(destinations, state) {
    const eligible = new Set(destinations);
    const clean = routes => [...new Set((Array.isArray(routes) ? routes : []).map(normalize).filter(route => eligible.has(route)))];
    const previous = normalize(state?.previous);
    const destination = normalize(state?.pending?.destination);
    return {
      visited: clean(state?.visited),
      previous: eligible.has(previous) ? previous : null,
      pending: eligible.has(destination) ? {destination, visited: clean(state.pending.visited)} : null
    };
  }

  function selectCycle(destinations, current, state, pick = randomIndex) {
    const clean = cleanState(destinations, state);
    let visited = clean.visited;
    let choices = destinations.filter(route => !visited.includes(route));
    if (!choices.length) { visited = []; choices = destinations.slice(); }
    choices = choices.filter(route => route !== normalize(current));
    // If the only unvisited route is the current page, wait rather than repeat
    // a visited route or prematurely discard the unfinished cycle.
    if (!choices.length) return {destination: null, state: clean};
    const destination = select(choices, normalize(current), clean.previous, pick);
    return {destination, state: {...clean, pending: {destination, visited: [...visited, destination]}}};
  }

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
    ].map(normalize).filter(Boolean))];
  }

  function select(destinations, current, previous, pick = randomIndex) {
    let choices = destinations.filter(route => route !== current);
    if (!choices.length) return null;
    const fresh = choices.filter(route => route !== previous);
    if (fresh.length) choices = fresh;
    return choices[pick(choices.length)];
  }

  const api = { randomIndex, pool, select, normalize, cleanState, selectCycle };
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
  let session = cleanState(destinations, null);
  let navigating = false;
  function read(key) { try { return root.localStorage.getItem(key); } catch (_) { return null; } }
  function write(key, value) { try { root.localStorage.setItem(key, value); } catch (_) { /* Keep working in memory. */ } }
  function saveSession() {
    try { root.sessionStorage.setItem(sessionKey, JSON.stringify(session)); } catch (_) { /* In-memory fallback. */ }
  }
  function currentRoute() {
    const url = new URL(root.location.href);
    const history = url.searchParams.get('history');
    return normalize(url.pathname + (history ? `?history=${encodeURIComponent(history)}` : ''));
  }
  function restoreSession() {
    try {
      const stored = root.sessionStorage.getItem(sessionKey);
      session = cleanState(destinations, stored ? JSON.parse(stored) : null);
    } catch (_) { session = cleanState(destinations, session); }
    if (session.pending) {
      if (session.pending.destination === currentRoute()) {
        session.visited = session.pending.visited;
        session.previous = session.pending.destination;
      }
      // Only a successful arrival commits the reserved selection. A refresh,
      // failed navigation or back/forward to another route discards it.
      session.pending = null;
    }
    saveSession();
    navigating = false;
  }
  function sync() {
    unlocked = unlocked || read(unlockKey) === 'true';
    document.querySelectorAll('.rabbit-hole-nav').forEach(button => { button.hidden = !unlocked; });
  }
  api.navigate = function () {
    if (navigating) return;
    const result = selectCycle(destinations, currentRoute(), session);
    unlocked = true;
    write(unlockKey, 'true');
    sync();
    if (!result.destination) return;
    navigating = true;
    const before = session;
    session = result.state;
    saveSession();
    try { root.location.assign(result.destination); }
    catch (_) { session = before; saveSession(); navigating = false; }
  };
  document.addEventListener('click', event => {
    if (event.target.closest('[data-rabbit-hole]')) api.navigate();
  });
  root.addEventListener('pageshow', () => { restoreSession(); sync(); });
  root.addEventListener('storage', sync);
  restoreSession();
  sync();
})(typeof window === 'undefined' ? globalThis : window);
