# Resident Inventor static histories

`_data/resident_inventor.json` is the sole editable content source: one base model
and nine histories. Thin ordinary Jekyll pages under `0-resident-inventor/histories/`
identify records through `history_id`, declare approved permalinks, and use the
shared `resident-inventor-history` layout and `resident-inventor` includes.
`history_order` preserves the former explorer's latest-updated ordering, followed
by the original order of undated histories. This is navigation order, not event
chronology. When updating a history's updatedAt, review its directory order.

The source `0-resident-inventor/index.html` retains the public permalink
`/0-about/resident-inventor.html`. It is the introduction, linked history
directory, static base diagram and five explanatory articles. Every history page
contains its complete HTML sequences without JavaScript. Desktop sequences scroll
horizontally; mobile sequences flow vertically. JavaScript updates overflow hints
only. OEI's branch is an ordinary ECH link, and its suppressed implicit returns,
custom labels, overlapping causal threads and featured caption remain intact.

To add a future history, add its structured record and one thin page. The shared
directory discovers the page. This does not add it to Rabbit Hole; that requires
separate editorial approval and an explicit registry entry.

Old index `?history=` URLs use a generated page-to-ID map and location.replace to
reach canonical histories. Only matching, in-range loop fragments survive.
Without JavaScript, the index and all history links remain readable.

The immutable migration fixtures in `tests/fixtures/resident-inventor/` capture the
original nested data, index, and renderer. Do not edit them alongside current
content to make tests pass. Deliberate future historical updates should explicitly
review/update the preservation expectation rather than silently changing history.
The only migration text adjustment is “ECH tab” → “ECH history.”

Run `python tests/verify-resident-inventor.py --site _site` after a real Jekyll
build. It checks exact nested parity, per-node article HTML, branch/return/caption
behavior, metadata, headings, links, model annotations, introduction and five
articles, plus every approved Rabbit Hole manifest/control. Use --baseurl for a
build made with a nonempty deployment base path.
