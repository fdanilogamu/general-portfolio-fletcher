# Resident Inventor and Rabbit Hole V2 QA

## Required automated gates

- Node regression suite: exact 18 approved destinations, valid registry fields and
  unique IDs/URLs, no automatic eligibility, three complete cycles, equal candidate
  indexing, last-unvisited-current reset, selection-only tracking, stable-ID/legacy
  migration, pending commit/rollback, rapid clicks, blocked storage, permanent
  unlock, pageshow, specialized controls, old-history redirects, exact nested
  content parity, and cryptographic rejection sampling.
- A real Jekyll build followed by `tests/verify-resident-inventor.py`: 9 histories,
  16 sections, 89 nodes, 6 base-model nodes; all ordered fields compared to the
  original snapshot; every node in actual article HTML; captions, notes, quotes,
  branches, state labels, suppressed returns, metadata, links, headings, diagram
  annotations, original introduction and five explanatory articles; exactly one
  shared control and registry/script on each of the 18 approved exhibits.
- Porpoise integration: six downloads, PDFs, assets, anchors, case-study links,
  history/library links and existing routes. Templated source is no longer
  byte-compared with generated HTML; the unchanged product behavior and assets
  remain explicitly checked.

## Browser QA

`tests/rabbit-hole-browser.cjs` uses actual generated HTML and existing Playwright
and Chrome tooling. It checks 1440px, 768px and 390px viewports: 54 history/theme
combinations and 54 exhibit/control combinations, plus full-cycle uniqueness,
both entry points, refresh, reset, rapid clicks, fresh-tab unlock, unchanged manual
visit progress, the current-only remainder, JavaScript-disabled histories and index
fallback, OEI/ECH Back/Forward, breadcrumbs, directory links, redirects, fragment
handling, reduced motion and runtime errors. Timeline rail/scrubber navigation and
Inglés Rebelde's language selector are exercised without changing their narratives.

Both empty and nonempty deployment-base builds are checked. Screenshots are kept
in the task's temporary QA directory, outside the production source. Representative
desktop, tablet and mobile screenshots are visually inspected. External fonts and
services are blocked during browser regression, so this verifies fallback
typography and local behavior rather than production network availability.

An inherited navigation-link color made light-theme breadcrumbs white; static
navigation now uses the theme foreground and the browser suite checks that
explicitly. This is a presentation correction required by the new navigation.

No deployment or live-production verification is part of these checks. Keyboard,
semantic markup and JavaScript-disabled reading are covered; an exhaustive screen
reader or third-party accessibility audit is not claimed. The existing unrelated
Inglés Rebelde page has repeated `que-hacemos` IDs across language sections; this
migration verifies unique IDs on the new histories/index and uniqueness of all
shared Rabbit Hole controls, without rewriting that existing exhibit.
