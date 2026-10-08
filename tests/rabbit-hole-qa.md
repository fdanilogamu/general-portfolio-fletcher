# Rabbit Hole integration QA

## Causes and corrections

The initial edit was applied twice. This duplicated the TL;DR entry markup, the
layout navigation button, and the shared script include. The repeated script
registered click, pageshow and storage handlers twice. The extra markup/include
were removed at their source; the random navigation module is unchanged.

The same repeated edit created two front matter blocks in Inglés Rebelde,
its calculator and Porpoise. Jekyll consumes only the first block, leaving the
second in visible content. The five other project pages repeated the eligibility
key inside a single block. Every project now has one first-position front matter
block and one eligibility key. All eight remain eligible.

Inglés Rebelde's language selector used fixed top/right positioning, independent
of the new shared row. The shared include now accepts page-specific controls;
the existing language button is in that wrapping flex row with its original
visual styling and language handler. Shared button styling is scoped to portfolio
shortcuts so it does not override the language button's appearance.

The calculator's horizontal body flex layout placed the shared row beside the
calculator and squeezed the card. A vertical flex layout now puts the full-width
row above the card without fixed offsets or stacking workarounds.

The playlist HTML included a Markdown page with its own front matter. The
include now strips the front matter and uses markdownify. The Markdown source
is published:false so it cannot generate a competing copy of spotify.html.
Its content is unchanged and the HTML destination remains eligible.

## Verification performed

`node --test tests/rabbit-hole.test.cjs`: 10 passing, one skipped (actual Jekyll
output unavailable locally). Tests cover exact markup/script/handler counts,
metadata boundaries and duplicate keys, language control composition, calculator
layout, playlist include safety, all 17 pool entries, crypto rejection sampling,
exclusion/repeat rules and persistence.

The existing GitHub Pages workflow runs this suite after its Jekyll build. The
rendered-output test now checks exact controls and absence of visible metadata
on project outputs and shared controls on the history page. CI was not dispatched
or observed during this task; no deployment was performed.

`tests/rabbit-hole-browser.cjs --source-preview` passed 54 checks in Chrome:
TL;DR plus all 17 destinations at 1440x900, 768x900 and 390x900. Screenshots were
captured for every combination and inspected as contact sheets; the updated
calculator and language row were also inspected individually. Checks exercised
keyboard entry/navigation, the initially hidden shortcut, unlock and refresh
persistence, control bounding boxes, direct history selections, history back and
forward, language changes and their refresh persistence, and a calculator slider.

Project pages checked: LemonlessTMS case study, Porpoise case study, OEI, Prison
Planet, playlist index, Porpoise, Inglés Rebelde, and its calculator.
History IDs checked: lemonade-economy, oei, dream-machine, anchorpoint,
way-they-see-it, ech, porpoise, cyoa, inventors-lab.

The browser preview composes the source templates with a small test helper. It
uses the real CSS/JS but is not Jekyll/Liquid/Kramdown. It substitutes the project
manifest and approximates the short playlist Markdown rendering. Production
rendering, external font availability and the deployed site remain unverified.
Page-specific checks were focused on the language selector and calculator input;
this was not an exhaustive retest of every project's features or download APIs.

`git diff --check` passed. No dependency, destination-pool or random-selection
changes were made.

## Changed files

- `_layouts/default.html`, `0-about/ideas.html`: duplicate controls/include.
- `_includes/rabbit-hole-standalone.html`: wrapping shared row and controls slot.
- `0-things-i-do-for-fun/inglesrebelde.html`: metadata and language control flow.
- `0-things-i-do-for-fun/ircalc.html`: metadata and calculator control layout.
- `porpoise/index.html`: metadata.
- `0-about/lemonless-tms-case-study.html`, `0-about/porpoise-ai-case-study.html`,
  `0-resources/oei.html`, `0-things-i-do-for-fun/prison-planet.html`,
  `0-things-i-do-for-fun/spotify/spotify.html`: duplicate eligibility keys.
- `0-things-i-do-for-fun/spotify/spotify.html` and `spotify.md`: safe include rendering.
- `tests/rabbit-hole.test.cjs`, `tests/rabbit-hole-source.cjs`,
  `tests/rabbit-hole-browser.cjs`: regression checks and browser QA.
- This report; screenshots under `tests/.qa` (excluded from the site by the
  existing tests exclusion).

Optional browser check against actual Jekyll output: run the browser script
without --source-preview after building _site. PLAYWRIGHT_MODULE and
BROWSER_EXECUTABLE can point to existing runtime paths; no installation is needed
when those are available.
