## What this repository is

This isn't a traditional portfolio with a few polished case studies.

It's closer to a living knowledge base.

Some pages document professional work, while some document original frameworks.
Others are experiments that may eventually become products.

---

## Themes

This repository repeatedly explores:

- operations
- documentation
- knowledge management
- organizational design
- AI collaboration
- language creation
- education
- systems thinking

---

## Why GitHub?

GitHub isn't just hosting this site.

I like writing in plain text, versioning ideas, tracking revisions, and treating knowledge as something that evolves over time.

Many of the frameworks here have changed dozens of times before reaching their current form.

---

## Current Major Projects

- Operational Entropy Index
- Entropy-Compatible Hiring
- What It's Like to Work With Me
- Inglés Rebelde
- Playlist Project
- Morgan's Encyclopedia
- Porpoise

---

## Tech Stack

```
Jekyll
HTML
CSS
GitHub Pages
```
Intentionally lightweight.

Porpoise's standalone page source lives in `0-porpoise/index.html`. Jekyll processes its shared includes and publishes it at `/porpoise/`. Its case study source is `0-porpoise/case-study.html`, published at `/0-about/porpoise-ai-case-study.html` with the shared default layout. The six YAML downloads, PDF, and browser scripts remain in `porpoise/` at their established public paths. The `Porpoise AI/` folder retains authoring notes and editing scripts and is excluded from deployment.

Build with `bundle exec jekyll build`. Check the product site's anchors, stance versions, and HTTP downloads with `python verify-site.py` from `porpoise/`. GitHub Pages builds and deploys automatically on a push to `main` through `.github/workflows/pages.yml`. The product page uses external Google Fonts; it has system-font fallbacks.

Resident Inventor histories are rendered from one structured dataset into nine ordinary Jekyll pages; see [RESIDENT-INVENTOR.md](RESIDENT-INVENTOR.md). Rabbit Hole membership is explicitly curated in `_data/rabbit_hole.json`; see [RABBIT-HOLE.md](RABBIT-HOLE.md). Run `node --test tests/rabbit-hole.test.cjs` and, after building, `python tests/verify-resident-inventor.py --site _site`. Both regression and generated-output validation are required before CI deploys.

Run `python porpoise/verify-integration.py` to check source routes, or add `--site _site` to verify built output. Source checks resolve explicit permalinks; generated-output checks use the actual published files. The deployment workflow runs this check after Jekyll builds and before uploading the site. It verifies product links, anchors, HTTP downloads, and asset bytes; templated source HTML is not compared directly to generated HTML.

The independent download-counting API lives in `porpoise-api/`, excluded from Jekyll. Deploy it as a separate Vercel project with **Root Directory `porpoise-api`**; see [API setup instructions](porpoise-api/README.md). The frontend configuration in `porpoise/api-config.js` enables the verified production API. Original static YAML URLs remain available, with fallback on normal download clicks if the API fails. Aggregate statistics are available at `/porpoise/statistics.html` without a navigation link.

## Finding page sources

The `0-` prefix intentionally groups visitor-facing page directories at the top of the file explorer. These directories follow the current navigation subjects. Source paths do not define public URLs: pages declare explicit Jekyll permalinks, including legacy `/0-about/` and `/0-things-i-do-for-fun/` routes.

| Page directory | Contents |
| --- | --- |
| `0-about/` | TL;DR, introduction, working style, testimonials, hiring page |
| `0-experience/` | Professional experience, earlier jobs, job-search pages, release notes |
| `0-inventions-and-frameworks/` | Local framework pages, including the older OEI page |
| `0-resident-inventor/` | Introduction, brand guidelines, nine history route pages |
| `0-software-and-ai/` | Custom Software Builder, AI collaboration, LemonlessTMS case study |
| `0-porpoise/` | Product, case study, statistics page |
| `0-teaching-and-learning/` | Inglés Rebelde and its calculator |
| `0-writing-and-publications/` | Technical-writing sample page |
| `0-music-and-mischief/` | Playlist pages and Prison Planet |
| `0-show-and-tell/` | Show & Tell page |

The home and navigation-directory sources remain at root as `index.html` and `site-navigation.html`. External navigation destinations do not need empty local sections. Rabbit Hole is shared infrastructure spanning these pages, not a separate page directory.

### Intentional asset-location exceptions

Existing static files stay at established source paths so ordinary Jekyll builds publish their original URLs. There is no custom asset-copying step.

- `porpoise/`: authoritative `stances/*.yaml`, supporting PDF, browser scripts, verification scripts. The API still reads this stance directory.
- `show-and-tell/`: `updates.js` feed data and `assets/` renderer/styles. Its moved page still publishes at `/show-and-tell/`, so relative references work unchanged.
- `0-about/js/`: AI collaboration and Resident Inventor scripts.
- `0-resources/`: résumé and technical-writing PDFs. This is now an asset-only compatibility directory.
- `images/`, `static/`, root CSS files, and `favicon.ico`: existing public images, shared runtime assets, and styles.

Keep shared structured content in `_data`, reusable fragments in `_includes`, and page shells in `_layouts`. The API, tests, `.github/workflows`, and other development material remain outside the page grouping. Generated `_site`, `build`, `output`, dependencies, historical authoring material, and existing QA artifacts were not reorganized or cleaned up in the page migration.

### HTML and Markdown companions

Keep HTML wrappers and their Markdown companions together. A clean pre-migration Jekyll build showed 18 pairs competing for the same destination, with Markdown supplying the final HTML in every case. Those Markdown files remain the publishers; retained HTML wrappers declare `published: false`. The Spotify index is the existing exception: its HTML wrapper publishes and `spotify.md` remains unpublished. This preserves rendered content while removing output collisions. Do not switch a pair's publisher without comparing real generated HTML.

The source checks in `tests/rabbit-hole-source.cjs` and `tests/site_sources.py` resolve pages through their declared permalinks. Their route lookup is test infrastructure only; Jekyll remains the sole publisher. Keep public-route assertions unchanged when relocating source files.

---

## Philosophy

Most portfolios are museums.

This one is a workshop.

Some pages document finished work and others capture ideas while they're still evolving.

If something feels unfinished, that's probably because it is.

---

## Living Repository

This repository changes frequently. New essays, frameworks, experiments, and case studies are added as they're developed. Rather than presenting a frozen snapshot of my work, it documents an ongoing process of observation, invention, and refinement.
