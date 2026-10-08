(function () {
  'use strict';
  const source = document.getElementById('ri-history-routes');
  if (!source) return;
  const routes = JSON.parse(source.textContent);
  const url = new URL(window.location.href);
  const id = url.searchParams.get('history');
  if (!Object.prototype.hasOwnProperty.call(routes, id)) return;
  // Only stable loop anchors belong on a history page; index/model fragments do not.
  const fragment = url.hash.match(/^#([a-z-]+)-loop-(\d+)$/);
  const hash = fragment && fragment[1] === id && Number(fragment[2]) < routes[id].sections ? url.hash : '';
  window.location.replace(routes[id].url + hash);
})();
