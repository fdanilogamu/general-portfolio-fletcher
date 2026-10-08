# Curated Rabbit Hole V2

`_data/rabbit_hole.json` is the only destination registry. JSON is native Jekyll
structured data, so neither the build nor the Node checks need a YAML dependency.
Each entry has a stable `id`, `title`, canonical `url`, `status`, and optional
`category`. Valid statuses are `approved`, `draft`, and `retired`. Only approved
entries ship in `_includes/rabbit-hole.html`'s destination manifest.

The currently approved tour has 18 destinations: nine invention histories and
nine other exhibits. Adding a page, a history record, or page metadata never adds
it to the tour. Editorial approval is required before adding an approved registry
entry; update the explicit membership expectations in the regression tests as
part of an approved membership change. IDs must remain stable when URLs change.
Do not reuse retired IDs for unrelated exhibits.

The Resident Inventor index, Porpoise case study, older OEI page, pricing
calculator, playlists, orientation pages, statistics and supporting downloads
remain accessible but are excluded from the tour. History and product/library
pages are distinct exhibits where explicitly approved.

## Session behavior

Permanent unlock uses `rabbit-hole-unlocked` in localStorage. Version 2 state in
`rabbit-hole-session` sessionStorage contains `visited` stable IDs, `previous`,
and an optional `pending: {destination, visited}` reservation. Only Rabbit Hole
selections count; manual browsing does not modify visited progress.

A selection draws uniformly from approved, unvisited exhibits except the current
page. After exhaustion, or when the sole remaining unselected exhibit is current,
a new cycle starts. Current and previous selections are avoided across cycle
boundaries when alternatives exist. Cryptographic rejection sampling avoids
modulo bias; Math.random is the fallback.

The selection is reserved before location.assign and committed only on successful
arrival. Repeated clicks are suppressed. Failed navigation and arrivals elsewhere
discard the reservation without changing the old cycle. pageshow handles cached
Back/Forward. Blocked storage falls back to memory; progress cannot persist across
full page loads without sessionStorage.

Recognized old URL-based visited/previous/pending entries migrate to stable IDs.
Old `resident-inventor.html?history=<id>` entries resolve to their history ID;
canonical URL aliases deduplicate and removed/unapproved destinations are pruned.
The index compatibility adapter preserves a pending old-history reservation
through its location.replace redirect before the canonical page commits it.

## Verification

- `node --test tests/rabbit-hole.test.cjs`
- `bundle exec jekyll build`
- `python tests/verify-resident-inventor.py --site _site`
- `python porpoise/verify-integration.py --site _site`
- `node tests/rabbit-hole-browser.cjs`

Generated-output checks are mandatory before CI uploads the Pages artifact.
Browser QA requires an existing Playwright installation and Chromium. Set
PLAYWRIGHT_MODULE, BROWSER_EXECUTABLE, SITE_DIR and QA_ARTIFACTS to use existing
local runtimes and a temporary generated site. No source-preview approximation is
used for the static-history audit.
