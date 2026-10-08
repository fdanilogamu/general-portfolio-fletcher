(function () {
  'use strict';
  // Content and causal structure are already in HTML. Only enhance scroll affordances.
  document.querySelectorAll('.ri-sequence-shell').forEach(shell => {
    const list = shell.querySelector('.ri-sequence');
    const hint = shell.querySelector('.ri-scroll-hint');
    function update() {
      const overflows = list.scrollWidth > list.clientWidth + 2;
      const atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 4;
      hint.hidden = !overflows;
      hint.textContent = atEnd ? 'End of this path' : 'History continues → scroll';
      shell.classList.toggle('is-at-end', !overflows || atEnd);
    }
    list.addEventListener('scroll', update, {passive: true});
    if (window.ResizeObserver) new ResizeObserver(update).observe(list);
    else window.addEventListener('resize', update);
    update();
  });
})();
