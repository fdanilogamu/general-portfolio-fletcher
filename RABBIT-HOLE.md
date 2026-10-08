# Rabbit Hole

The entry control sits at the bottom of TL;DR. Shared layout pages and standalone
project/Show & Tell pages expose the unlocked shortcut beside “I'm lost”.

Jekyll generates project destinations from `site.pages` with `rabbit_hole: true`
in their front matter. Add that flag to a published individual project, case
study, or future dedicated Show & Tell page. Do not mark orientation pages,
category indexes, external links, or placeholders. Jekyll's unpublished pages
are absent from the production page collection. No parallel route list ships.

Invention histories currently share an interactive explorer rather than separate
HTML files. Each non-base published record in `RESIDENT_INVENTOR_PATHS` becomes a
distinct `resident-inventor.html?history=<id>` destination. The query restores the
selected history on direct loads and back/forward. New records automatically
join the pool; `published: false` opts out. These are dedicated history views of
the existing page, not newly generated standalone history documents. Show & Tell
currently has no dedicated entry pages, so its feed is excluded.

The eight project routes and nine histories each receive equal probability.
Selection draws only from destinations not yet selected in this tab's session.
It excludes the current destination and avoids the previous selection when
possible. After every destination has been selected, a new cycle begins. If the
sole remaining unvisited destination is the current page, activation does nothing
until the visitor moves elsewhere; it does not repeat a visited destination or
reset early. Empty pools or a sole current page also do nothing. Crypto uses rejection sampling
to avoid modulo bias, with Math.random as fallback. Ordinary location.assign
navigation preserves the site's full-page routing and browser history.

`rabbit-hole-unlocked` remains in localStorage. `rabbit-hole-session` lives in
sessionStorage and contains visited canonical routes, the previous selection and
an optional pending navigation. Query parameters distinguish history views;
query order, fragments, index.html aliases and unreserved path encoding are
normalized. Obsolete routes are removed when reading session state. A destination
is reserved before navigation and committed only when its page loads, preserving
the old cycle if navigation throws or the visitor returns without arriving.
Repeated clicks are ignored while navigation is pending. pageshow restores
controls and session state after cached back/forward navigation; storage events
sync permanent unlock between tabs. The legacy localStorage previous-selection
key is no longer used. If storage is blocked, navigation and controls work within
the current document, but session progress cannot survive full-page navigation.

Run `node --test tests/rabbit-hole.test.cjs`. CI also runs these checks alongside
the Jekyll build. Desktop/mobile visual verification requires a rendered Jekyll
site; local Ruby/Jekyll is unavailable in the current development environment.

Changed files: `_layouts/default.html`, `_includes/rabbit-hole.html`,
`_includes/rabbit-hole-standalone.html`, `static/js/rabbit-hole.js`, `styles.css`,
`0-about/ideas.html`, `0-about/js/resident-inventor.js`,
`0-about/lemonless-tms-case-study.html`, `0-about/porpoise-ai-case-study.html`,
`0-resources/oei.html`, `0-things-i-do-for-fun/prison-planet.html`,
`0-things-i-do-for-fun/spotify/spotify.html`,
`0-things-i-do-for-fun/inglesrebelde.html`, `0-things-i-do-for-fun/ircalc.html`,
`porpoise/index.html`, `porpoise/statistics.html`, `show-and-tell/index.html`,
`_config.yml`, `.github/workflows/pages.yml`, `tests/rabbit-hole.test.cjs`,
and this document.
