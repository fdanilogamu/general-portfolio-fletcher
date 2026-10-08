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

Porpoise AI's original standalone website lives in `porpoise/index.html` and is copied unchanged by Jekyll to `/porpoise/`, together with its six `stances/*.yaml` downloads and supporting PDF. Its portfolio case study lives at `/0-about/porpoise-ai-case-study.html` and uses the shared default layout. The `Porpoise AI/` folder retains authoring notes and editing scripts and is excluded from deployment.

Build with `bundle exec jekyll build`. Check the product site's anchors, stance versions, and HTTP downloads with `python verify-site.py` from `porpoise/`. GitHub Pages builds and deploys automatically on a push to `main` through `.github/workflows/pages.yml`. The product page uses external Google Fonts; it has system-font fallbacks.

Run `python porpoise/verify-integration.py` to check source routes, or add `--site _site` to verify built output. The deployment workflow runs this check after Jekyll builds and before uploading the site, including a byte-for-byte check that the product HTML was preserved.

---

## Philosophy

Most portfolios are museums.

This one is a workshop.

Some pages document finished work and others capture ideas while they're still evolving.

If something feels unfinished, that's probably because it is.

---

## Living Repository

This repository changes frequently. New essays, frameworks, experiments, and case studies are added as they're developed. Rather than presenting a frozen snapshot of my work, it documents an ongoing process of observation, invention, and refinement.
