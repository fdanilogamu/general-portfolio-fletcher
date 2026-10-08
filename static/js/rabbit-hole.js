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

  // Runtime membership comes exclusively from the explicitly approved registry.
  function pool(registry) {
    const ids = new Set();
    const urls = new Set();
    return (Array.isArray(registry) ? registry : []).filter(entry => {
      const route = normalize(entry?.url);
      if (entry?.status !== 'approved' || !/^[a-z0-9-]+$/.test(entry.id || '') ||
          !route || /[?#]/.test(entry.url) || ids.has(entry.id) || urls.has(route)) return false;
      ids.add(entry.id); urls.add(route);
      return true;
    }).map(entry => ({...entry, url: normalize(entry.url)}));
  }

  function identify(destinations, value, base = '') {
    if (typeof value !== 'string') return null;
    if (destinations.some(entry => entry.id === value)) return value;
    const route = normalize(value);
    if (!route) return null;
    const url = new URL(route, 'https://rabbit-hole.invalid');
    const samePath = path => path === url.pathname || (base && path === base + url.pathname);
    const canonical = destinations.find(entry => samePath(entry.url));
    if (canonical) return canonical.id;
    // One-way migration of old query-based history session entries.
    if (url.pathname === base + '/0-about/resident-inventor.html' || url.pathname === '/0-about/resident-inventor.html') {
      const id = url.searchParams.get('history');
      return destinations.find(entry => entry.category === 'invention-history' && entry.id === id)?.id || null;
    }
    return null;
  }

  function cleanState(destinations, state, base = '') {
    const clean = values => [...new Set((Array.isArray(values) ? values : [])
      .map(value => identify(destinations, value, base)).filter(Boolean))];
    const destination = identify(destinations, state?.pending?.destination, base);
    const visited = clean(state?.visited);
    const pendingVisited = clean(state?.pending?.visited);
    return {
      version: 2,
      visited,
      previous: identify(destinations, state?.previous, base),
      pending: destination ? {destination, visited: [...new Set([...pendingVisited, destination])]} : null
    };
  }

  function randomIndex(length, crypto = root.crypto, random = Math.random) {
    if (length < 1) return -1;
    if (!crypto || !crypto.getRandomValues) return Math.floor(random() * length);
    const limit = 0x100000000 - (0x100000000 % length);
    const value = new Uint32Array(1);
    do { crypto.getRandomValues(value); } while (value[0] >= limit);
    return value[0] % length;
  }

  function selectCycle(destinations, current, state, pick = randomIndex) {
    const clean = cleanState(destinations, state);
    let visited = clean.visited;
    let choices = destinations.filter(entry => !visited.includes(entry.id) && entry.id !== current);
    // Exhausted includes a cycle whose sole remaining unselected exhibit is current.
    // Manual browsing still never writes an ID to visited.
    if (!choices.length) {
      visited = [];
      choices = destinations.filter(entry => entry.id !== current);
      const fresh = choices.filter(entry => entry.id !== clean.previous);
      if (fresh.length) choices = fresh;
    }
    if (!choices.length) return {destination: null, state: clean};
    const destination = choices[pick(choices.length)].id;
    return {destination, state: {...clean, pending: {destination, visited: [...visited, destination]}}};
  }

  const api = {randomIndex, pool, normalize, identify, cleanState, selectCycle};
  if (typeof module !== 'undefined') module.exports = api;
  root.RabbitHole = api;
  if (!root.document) return;
  const document = root.document;
  const source = document.getElementById('rabbit-hole-destinations');
  if (!source) return;
  const script = document.querySelector('script[src$="/static/js/rabbit-hole.js"]');
  const base = new URL(script.src).pathname.replace(/\/static\/js\/rabbit-hole\.js$/, '');
  const destinations = pool(JSON.parse(source.textContent));
  let unlocked = false;
  let session = cleanState(destinations, null, base);
  let navigating = false;
  function read(key) { try { return root.localStorage.getItem(key); } catch (_) { return null; } }
  function write(key, value) { try { root.localStorage.setItem(key, value); } catch (_) { /* In-memory fallback. */ } }
  function saveSession() {
    try { root.sessionStorage.setItem(sessionKey, JSON.stringify(session)); } catch (_) { /* In-memory fallback. */ }
  }
  function currentId() {
    const url = new URL(root.location.href);
    const route = normalize(url.pathname);
    return destinations.find(entry => entry.url === route)?.id || null;
  }
  function restoreSession() {
    try {
      const stored = root.sessionStorage.getItem(sessionKey);
      session = cleanState(destinations, stored ? JSON.parse(stored) : session, base);
    } catch (_) { session = cleanState(destinations, session, base); }
    if (session.pending) {
      if (session.pending.destination === currentId()) {
        session.visited = session.pending.visited;
        session.previous = session.pending.destination;
        session.pending = null;
      } else {
        const url = new URL(root.location.href);
        const redirecting = document.getElementById('ri-history-routes') &&
          identify(destinations, url.pathname + url.search, base) === session.pending.destination;
        // Preserve a legacy reservation through the index's one-way redirect.
        if (!redirecting) session.pending = null;
      }
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
    const result = selectCycle(destinations, currentId(), session);
    unlocked = true;
    write(unlockKey, 'true');
    sync();
    if (!result.destination) return;
    navigating = true;
    const before = session;
    session = result.state;
    saveSession();
    try { root.location.assign(destinations.find(entry => entry.id === result.destination).url); }
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
