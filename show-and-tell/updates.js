/*
  Add new entries anywhere in this array. The feed prints the newest date first.

  Required: id, date, project, title
  Optional: time, body, url, linkLabel, mark, markImage, markColor, isExample

  Project-wide stamp names and colors live in NOOK_PROJECTS. An entry-level
  `mark` is used only when its project has no configured short name.
  `markImage` can later point to a project logo, and `markColor` can override
  its project's color when needed.
  Use an ISO date (YYYY-MM-DD) and 24-hour time (HH:MM) when a time is included.
*/
/*
  The register display defaults to PROCESSING. To announce something specific,
  use: { mode: "queued", project: "Project name", text: "Short description" }
*/
window.NOOK_NEXT = { mode: "queued", project: "The Lemonade Economy", text: "PENDING" };

window.NOOK_PROJECTS = {
  "OEI Institute": { shortName: "OEI", stampColor: "#3D5368" },
  "Operational Entropy Index": { shortName: "OEI", stampColor: "#3D5368" },
  "Entropy Compatible Hiring": { shortName: "ECH", stampColor: "#112638" },
  "The Stuff I Have Online": { shortName: "TSHO", stampColor: "#171b1a" },
  "Inglés Rebelde": { shortName: "IR", stampColor: "#39ff14" },
  "Swipet": { shortName: "SWP", stampColor: "#2B3B8C" },
  "Fletcher Lite": { shortName: "FL", stampColor: "#d4a574" },
  "Invisible Load": { shortName: "IL", stampColor: "#708090" },
  "Resident Inventor": { shortName: "RI" },
  "Show & Tell Nook": { shortName: "STN" }
};

window.NOOK_UPDATES = [
  {
    id: "oei-commercial-pathways-capability-intervention",
    date: "2026-09-25",
    project: "OEI Institute",
    title: "Reframed OEI’s commercial pathways around capability and intervention",
    body: "Services and pricing now explain engagement choices through who develops and applies OEI capability, and whether an AI intervention is warranted. AI Enablement is optional, not an OEI pillar, while the broader practitioner and commercial structure continues to develop.",
    url: "https://operationalentropy.com",
    linkLabel: "Explore the OEI services and pricing"
  },
  {
    id: "oei-focused-investigations-pricing-update",
    date: "2026-09-24",
    project: "Operational Entropy Index",
    title: "Revised pricing for Focused Operational Investigations",
    body: "The published typical investment is now $1,000–$4,000 USD. The updated range appears across the investigation overview, individual investigation pages, and OEI information packets.",
    url: "https://operationalentropy.com",
    linkLabel: "Explore Focused Operational Investigations"
  },
  {
    id: "oei-institute-public-identity",
    date: "2026-09-06",
    project: "OEI Institute",
    title: "Applied the OEI Institute identity across the public site",
    body: "The site adopted the OEI Institute logo, favicon, and Institute-level imagery while keeping the established OEI visual language. Operational Forensics for Growing Teams now serves as the Institute’s disciplinary positioning.",
    url: "https://operationalentropy.com",
    linkLabel: "Visit the OEI website"
  },
  {
    id: "oei-institute-methodology-governance",
    date: "2026-09-06",
    project: "OEI Institute",
    title: "Established the Institute as the home of the OEI methodology",
    body: "The OEI Institute now governs the Operational Entropy Index methodology, maintains its practice standards, and develops practitioner capability. The Index remains the methodology, with its own educational journey beneath the Institute identity.",
    url: "https://operationalentropy.com",
    linkLabel: "Explore the OEI website"
  },
  {
    id: "oei-institute-website-rebuild",
    date: "2026-09-06",
    project: "Operational Entropy Index",
    title: "Started rebuilding the website around the new OEI",
    body: "Moved the public site away from treating OEI, the methodology, and the consulting business as the same thing. The Institute now sits above the Index, while unresolved services and pricing are explicitly transitional.",
    url: "https://operationalentropy.com",
    linkLabel: "Visit the OEI website"
  },
  {
    id: "oei-institute-identity-system",
    date: "2026-09-06",
    project: "Operational Entropy Index",
    title: "Rebuilt the OEI identity around the Institute",
    body: "Evolved the existing OEI mark into an Institute identity system, keeping the entropy-to-structure visual language while making Operational Forensics for Growing Teams the disciplinary positioning.",
    url: "https://operationalentropy.com",
    linkLabel: "Explore the OEI website"
  },
  {
    id: "oei-institute-definition",
    date: "2026-09-06",
    project: "Operational Entropy Index",
    title: "Defined what OEI Institute actually is",
    body: "Landed on the missing institutional definition: OEI Institute is the governing institution for the Operational Entropy Index methodology, responsible for maintaining its canon and standards and developing the infrastructure for competent practice.",
    url: "https://operationalentropy.com",
    linkLabel: "Explore the OEI website"
  },
  {
    id: "oei-knowledge-base-curator",
    date: "2026-09-06",
    project: "Operational Entropy Index",
    title: "Gave the knowledge base a curator",
    body: "Built a weekly AI-assisted curation system that detects changes, refreshes safe classifications, quarantines ambiguity, preserves provenance, and sends semantic changes that could rewrite institutional meaning back for human review.",
    url: "https://operationalentropy.com",
    linkLabel: "Explore the OEI website"
  },
  {
    id: "oei-institutional-knowledge-architecture",
    date: "2026-09-06",
    project: "Operational Entropy Index",
    title: "Gave OEI its own knowledge architecture",
    body: "Turned the existing methodology, training, certification, delivery, governance, product, and historical material into a structured institutional knowledge layer without replacing the original sources.",
    url: "https://operationalentropy.com",
    linkLabel: "Explore the OEI website"
  },
  {
    id: "oei-institution-over-consultancy-scale",
    date: "2026-09-02",
    project: "Operational Entropy Index",
    title: "Chose institution over consultancy scale",
    body: "Stopped pursuing a collaboration built around scaling OEI as a replicable consulting offer and kept the useful question underneath it: what if OEI itself becomes the institution instead?",
    url: "https://operationalentropy.com",
    linkLabel: "Explore the OEI website"
  },
  {
    id: "oei-institutional-direction",
    date: "2026-09-01",
    project: "Operational Entropy Index",
    title: "Started treating OEI like an institution",
    body: "Began restructuring OEI around something bigger than founder-delivered consulting: an institution that can maintain the methodology, develop practitioners, assess competence, and preserve standards as the practice spreads.",
    url: "https://operationalentropy.com",
    linkLabel: "Explore the OEI website"
  },
  {
    id: "oei-practitioner-assessment",
    date: "2026-09-01",
    project: "Operational Entropy Index",
    title: "Built an assessment for OEI practitioners",
    body: "Turned practitioner certification into a full investigation environment where candidates scope cases, request and evaluate evidence, test explanations, reach findings, and leave an auditable reasoning trail for assessors.",
    url: "https://operationalentropy.com",
    linkLabel: "Explore the OEI website"
  },
  {
    id: "invisible-load-desktop-app",
    date: "2026-08-30",
    project: "Invisible Load",
    title: "Packaged Invisible Load as a Windows desktop app",
    body: "Added a standalone Windows executable that opens in its own desktop window and stores history locally between sessions.",
    url: "https://github.com/fdanilogamu/Invisible-Load/commit/72963fd90c05788ea1e8733b2162420fe68dd997",
    linkLabel: "See the desktop packaging commit"
  },
  {
    id: "oei-practitioner-certification-environment",
    date: "2026-08-29",
    project: "Operational Entropy Index",
    title: "Moved OEI certification from method to practice",
    body: "Turned Case 001 into an interactive local environment where candidates investigate evidence and assessors reconstruct and review their work.",
    url: "https://github.com/fdanilogamu/OEI-staff/tree/main/OEI%20Practitioner%20Certification%20Environment",
    linkLabel: "Explore the practitioner certification environment"
  },
  {
    id: "ech-existing-employee-contribution-mapping",
    date: "2026-08-28",
    project: "Entropy Compatible Hiring",
    title: "Expanded ECH to existing employees",
    body: "ECH now pairs its candidate hiring instruments with an exploratory module for mapping how existing employees may help reduce operational entropy.",
    url: "https://operationalentropy.com/entropy-compatible-hiring/",
    linkLabel: "Explore Entropy Compatible Hiring"
  },
  {
    id: "invisible-load-visual-language",
    date: "2026-08-28",
    project: "Invisible Load",
    title: "Gave the two loads their own visual language",
    body: "Added a blue and rust system that makes operational load, personal load, and their balance visible throughout the calculator.",
    url: "https://github.com/fdanilogamu/Invisible-Load/commit/c6567e8a973ff8783befdc651c66387be83597ef",
    linkLabel: "See the visual identity commit"
  },
  {
    id: "invisible-load-local-app",
    date: "2026-08-28",
    project: "Invisible Load",
    title: "Moved Invisible Load out of the spreadsheet",
    body: "Turned the calculator into a local browser app with live scoring, persistent SQLite history, workbook imports, trend visualization, and tested parity with the original spreadsheet.",
    url: "https://github.com/fdanilogamu/Invisible-Load/tree/a01581d90763058405ad101c0868c628a3d6dab9",
    linkLabel: "See the spreadsheet migration snapshot"
  },
  {
    id: "portfolio-operations-leadership",
    date: "2025-11-16",
    project: "The Stuff I Have Online",
    title: "Rebuilt the portfolio around operations leadership",
    body: "Moved beyond the earlier soft-skill portfolio and positioned my work around operations leadership, systems building, founder support, measurable impact, and a concrete COO offer.",
    url: "/",
    linkLabel: "Visit The Stuff I Have Online",
    mark: "OPS"
  },
  {
    id: "portfolio-playlist-archive",
    date: "2025-07-20",
    project: "The Stuff I Have Online",
    title: "Made room for my never-ending playlist quest",
    body: "Added the site's first Things I Do for Fun section and built a branching archive for playlist categories, individual mixes, notes, artwork, and listening links.",
    url: "/0-things-i-do-for-fun/spotify/spotify.html",
    linkLabel: "Explore the playlist archive",
    mark: "MIX"
  },
  {
    id: "portfolio-ideas-and-inventions",
    date: "2025-05-08",
    project: "The Stuff I Have Online",
    title: "Made room for ideas and inventions",
    body: "Expanded the professional portfolio with a public page for systems, shipped work, physical concepts, and ideas that had not yet become projects.",
    url: "/0-about/ideas.html",
    linkLabel: "See how the ideas page evolved",
    mark: "IDEA"
  },
  {
    id: "fletcher-lite-knowledge-architect",
    date: "2026-08-21",
    project: "Fletcher Lite",
    title: "Made Knowledge Architect the focus of Fletcher Lite",
    body: "Repositioned the site as a specialized companion to The Stuff I Have Online, changed the visible professional identity from Documentation Engineer to Knowledge Architect, and added a direct call-booking path.",
    url: "/fletcherlite/",
    linkLabel: "Visit Fletcher Lite",
    mark: "FL"
  },
  {
    id: "fletcher-lite-knowledge-preservation",
    date: "2026-06-28",
    project: "Fletcher Lite",
    title: "Focused Fletch Lite on preserving organizational knowledge",
    body: "Reframed the portfolio around documentation, knowledge management, organizational learning, institutional memory, and expertise transfer. Added real writing samples and a downloadable résumé.",
    url: "/fletcherlite/",
    linkLabel: "Visit Fletcher Lite",
    mark: "FL"
  },
  {
    id: "fletcher-lite-first-recorded-version",
    date: "2026-06-28",
    project: "Fletcher Lite",
    title: "Built the first recorded version of Fletch Lite",
    body: "Created a responsive multi-page portfolio presenting Fletcher as a Documentation Engineer, with professional experience, writing, contact information, and light and dark themes.",
    url: "/fletcherlite/",
    linkLabel: "Visit Fletcher Lite",
    mark: "FL"
  },
  {
    id: "swipet-adoption-inquiries",
    date: "2026-08-13",
    project: "Swipet",
    title: "Built the handoff from compatible matches to shelters",
    body: "Added location-aware discovery and a structured adoption inquiry that sends readiness, consent, contact details, compatibility results, and match reasons into an administrative queue.",
    mark: "SWP"
  },
  {
    id: "swipet-operator-platform",
    date: "2026-06-13",
    project: "Swipet",
    title: "Made Swipet bilingual and operator-managed",
    body: "Added Spanish and English interfaces, persistent pet and user records, photo uploads, an administrative workspace, and a manual premium-activation workflow.",
    mark: "SWP"
  },
  {
    id: "swipet-product-identity",
    date: "2026-05-15",
    project: "Swipet",
    title: "Turned a generic scaffold into Swipet",
    body: "Built a branded mobile pet-adoption experience with lifestyle onboarding, explainable compatibility scoring, swipe discovery, saved matches, pet profiles, and a navy visual identity.",
    mark: "SWP"
  },
  {
    id: "oei-identity-governance",
    date: "2026-08-21",
    project: "Operational Entropy Index",
    title: "Added a system for governing OEI's identity",
    body: "Created structured identity records, a propagation map, an internal consistency dashboard, and publishing tools for keeping project decisions synchronized.",
    url: "https://operationalentropy.com",
    linkLabel: "Visit the Operational Entropy Index",
    mark: "OEI"
  },
  {
    id: "oei-practitioner-workspace",
    date: "2026-08-21",
    project: "Operational Entropy Index",
    title: "Built a practitioner workspace for OEI diagnoses",
    body: "Added an internal browser application for structured intake, evidence collection, scoring, recommendations, checkpoints, and client-safe report exports.",
    url: "https://operationalentropy.com",
    linkLabel: "Visit the Operational Entropy Index",
    mark: "OEI"
  },
  {
    id: "ech-desktop-beta",
    date: "2026-08-20",
    project: "Entropy Compatible Hiring",
    title: "Presented Entropy Compatible Hiring as a desktop-software beta",
    body: "Repositioned the Hiring Archetype Map as a separately purchasable Windows product with ten OEI-derived assessment instruments, versioning, beta pricing, and documented limitations.",
    url: "https://operationalentropy.com/entropy-compatible-hiring/",
    linkLabel: "Explore Entropy Compatible Hiring",
    mark: "ECH"
  },
  {
    id: "oei-modular-engagements",
    date: "2026-08-12",
    project: "Operational Entropy Index",
    title: "Made OEI's engagement architecture modular",
    body: "Separated known-issue investigations from broad diagnostic work and added a 15-day audit alongside the existing 30-day option.",
    url: "https://operationalentropy.com",
    linkLabel: "Visit the Operational Entropy Index",
    mark: "OEI"
  },
  {
    id: "oei-focused-investigations",
    date: "2026-06-27",
    project: "Operational Entropy Index",
    title: "Added five focused operational investigations",
    body: "Created targeted investigations for organizations that already knew where their operational problem was, providing an alternative to a comprehensive diagnosis.",
    url: "https://operationalentropy.com",
    linkLabel: "Visit the Operational Entropy Index",
    mark: "OEI"
  },
  {
    id: "oei-methodology-library",
    date: "2026-06-25",
    project: "Operational Entropy Index",
    title: "Turned the OEI site into a methodology library",
    body: "Added information packets, downloadable resources, conceptual models, and detailed explanations of OEI's five dimensions.",
    url: "https://operationalentropy.com",
    linkLabel: "Visit the Operational Entropy Index",
    mark: "OEI"
  },
  {
    id: "oei-engagement-assessment",
    date: "2026-06-22",
    project: "Operational Entropy Index",
    title: "Let visitors find their own OEI engagement path",
    body: "Added a browser-based assessment that used operational friction and primary pain to recommend an engagement before requiring contact information.",
    url: "https://operationalentropy.com",
    linkLabel: "Visit the Operational Entropy Index",
    mark: "OEI"
  },
  {
    id: "oei-hiring-archetype-map",
    date: "2026-06-20",
    project: "Operational Entropy Index",
    title: "Extended OEI into hiring",
    body: "Introduced the Hiring Archetype Map, a reusable deliverable translating OEI findings into the contribution patterns needed from future hires.",
    url: "https://operationalentropy.com",
    linkLabel: "Visit the Operational Entropy Index",
    mark: "OEI"
  },
  {
    id: "oei-public-diagnostic",
    date: "2026-05-30",
    project: "Operational Entropy Index",
    title: "Put OEI online as a complete diagnostic system",
    body: "Launched the public OEI methodology with five diagnostic dimensions, a staged intervention model, pricing, contact paths, and its own visual identity.",
    url: "https://operationalentropy.com",
    linkLabel: "Visit the Operational Entropy Index",
    mark: "OEI"
  },
  {
    id: "show-and-tell-nook-launch",
    date: "2026-08-23",
    project: "Show & Tell Nook",
    title: "Added a continuously printing record of what I'm making",
    body: "Created this nook so launches, fixes, experiments, and other meaningful changes can exist without becoming full case studies.",
    url: "/show-and-tell/",
    linkLabel: "You are looking at it",
    mark: "S&T"
  },
  {
    id: "resident-inventor-model",
    date: "2026-08-18",
    project: "Resident Inventor",
    title: "Made Resident Inventor into an interactive model",
    body: "Defined the Field, Collision, Ding, Form, Reality, Field cycle and added an interactive companion showing how AI participates in the process.",
    url: "/0-about/resident-inventor.html",
    linkLabel: "Explore the Resident Inventor model",
    mark: "RI"
  },
  {
    id: "job-search-case-record",
    date: "2026-08-15",
    project: "The Stuff I Have Online",
    title: "Published my job search as a public case record",
    body: "Added an interactive account of the positioning changes, applications, conversations, tools, and lessons behind a ten-month transition.",
    url: "/0-about/job-search-timeline.html",
    linkLabel: "Open the job search case record",
    mark: "CASE"
  },
  {
    id: "the-stuff-i-have-online-v1",
    date: "2026-08-16",
    project: "The Stuff I Have Online",
    title: "Named the whole thing The Stuff I Have Online",
    body: "Introduced the dark-first editorial system, reorganized the site, moved it to thestuffihave.online, and marked it as version 1.0.",
    url: "/",
    linkLabel: "Visit The Stuff I Have Online",
    mark: "v1.0"
  },
  {
    id: "portfolio-living-workshop",
    date: "2026-07-22",
    project: "The Stuff I Have Online",
    title: "Turned the portfolio into a living workshop",
    body: "Reframed the site as a place for frameworks, experiments, observations, unfinished products, and ongoing refinement. Resident Inventor became the homepage identity.",
    url: "/",
    linkLabel: "Visit the living workshop",
    mark: "LAB"
  },
  {
    id: "ingles-rebelde-site",
    date: "2026-05-18",
    project: "Inglés Rebelde",
    title: "Gave Inglés Rebelde its own corner of the site",
    body: "Added a separately branded educational offering with its own teaching philosophy, instructors, course levels, contact flow, and pricing calculator.",
    url: "/0-things-i-do-for-fun/inglesrebelde.html",
    linkLabel: "Visit Inglés Rebelde",
    mark: "IR"
  },
  {
    id: "oei-led-practice",
    date: "2026-05-31",
    project: "Operational Entropy Index",
    title: "Made OEI the center of my professional practice",
    body: "The portfolio shifted from a conventional operations résumé site toward a diagnostic-led practice built around operational entropy and the Operational Entropy Index.",
    url: "https://operationalentropy.com",
    linkLabel: "Visit the Operational Entropy Index",
    mark: "OEI"
  }
];
