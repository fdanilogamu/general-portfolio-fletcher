# Portfolio PDF styling guide

Reference: the current `styles.css` 2026 visual refresh and subsequent overrides, with `index.html` and `_layouts/default.html`. Prepared 8 October 2026. Colors and font families below come from the source; page dimensions, point sizes, and spacing are recommended PDF adaptations.

## Character

Editorial, calm, personal, and practical: a field notebook with generous whitespace, oversized serif headings, readable sans-serif text, restrained green accents, thin rules, and flat panels. Keep text left aligned. Use color to orient the reader rather than decorate every element.

## Color tokens

| Role | Light / print-friendly | Dark / screen-first |
|---|---|---|
| Page background | #F4F1E9 | #171B1A |
| Primary text | #202522 | #EFEEE8 |
| Accent / links | #176B5B | #94CFBD |
| Secondary accent | #0F5549 | #B3E1D4 |
| Muted text | #68706C | #A9B0AC |
| Border / rules | #D7D7CF | #35403C |
| Panel / quote / table header | #FAF8F2 | #202623 |
| Alternate table row | #FAF8F2 | #202623 |

Secondary website cues: gold #E5B522 with text #242015 for a single navigation or next-step highlight; cyan #4DB8D4 with text #181818 for the knowledge-architect route. These are specialized cues, not replacements for the green palette. Do not use gold or cyan for small text on cream. Use #176B5B text on light pages and #94CFBD text on dark pages; swap all semantic tokens together when changing themes.

## Typography

- Headings: Georgia regular; Times New Roman fallback. The website uses weight 500, but Georgia regular is a practical PDF equivalent.
- Body: Inter if supplied and licensed for embedding; otherwise the website's system-font route, such as Segoe UI. The PDF specimen uses embedded Segoe UI and Georgia.
- Cover title: 40-48 pt, 1.05-1.12 line height. Keep each line short.
- Page title: 28-34 pt / 32-38 pt leading. Section heading: 20-24 pt / 24-28 pt leading.
- Body: 10.5-11 pt / 16-18 pt leading. Small headings: 11-12 pt semibold.
- Eyebrow: 8-9 pt uppercase with 0.6-0.8 pt tracking. Caption/footer: 8-9 pt / 11-13 pt leading.
- Avoid copying the site's tight hero line height into multiline PDF headings. Use regular serif headings, semibold sans-serif labels, and sparse bold emphasis.

## Page geometry

Use A4 portrait (210 x 297 mm) by default; US Letter is acceptable with recomposed content. Set margins to 18-22 mm (the specimen uses 20 mm). A single text column is the default. Use two columns only for short comparisons, swatches, or cards, with a 6-8 mm gutter. Keep prose around 55-80 characters per line. Use a 4 pt spacing unit: 8-12 pt between paragraphs, 16-24 pt between related blocks, and 28-40 pt between sections. Place a thin running-header rule and a quiet footer outside the content area. Avoid copying the website sidebar onto every page; use a contents page or running section label instead.

## Components

- Quotes/callouts: themed panel, 2-3 pt accent stripe on the left, 12-18 pt padding, Georgia text at 13-16 pt. Keep citation in the body font.
- Tables: flat themed panel for header, accent header text, 1 pt accent rule below header, 0.5 pt row separators, 8-10 pt cell padding, 9-10 pt body text. Repeat headers on continued pages. Do not encode meaning through color alone.
- Cards: square corners, 0.5 pt border, no shadow, 12-16 pt padding. Show a short sans-serif label and one concise paragraph.
- Links: green, underlined, and clickable in digital output. Include a readable URL or source note for print-critical references.
- Figures: neutral thin border when needed, caption below in muted sans-serif. Use circular crops only for a personal portrait; retain full frames for evidence and diagrams.
- Charts: use accent for primary series, muted text for labels, and border color for light grids; label series directly and add dash patterns when needed.
- Next step: one small gold-filled label with dark text if useful; avoid repeated button-like decoration.

## Recommended document recipe

Cover: eyebrow, large Georgia title, two-line description, one green rule, author/date. Content page: section label, serif title, introduction, one or two content blocks, and a restrained callout or table. Closing: short takeaway, sources, and one clear next step. Use a dark cover with light content pages for screen-first reports, or all-light pages for print.

## Export checks

Embed fonts; keep text selectable and links active. Use vector rules/charts and approximately 300 ppi raster images at placed size. Export in RGB for digital use; use a printer-provided CMYK profile only when required. A white-page print variant can replace #F4F1E9 with #FFFFFF while retaining text and green accents. Verify page breaks, repeated table headers, captions, footer placement, and absence of clipped text at 100% zoom. Keep headings with at least two lines of following text. Aim for 4.5:1 contrast for small text and 3:1 for large text. Inspect grayscale if printing. Tagged PDF accessibility requires a separate verified tagging workflow; visual polish alone does not ensure it.

## Reusable creation prompt

Create a PDF in the visual language of Fletcher Galeano's portfolio: warm cream #F4F1E9 pages, charcoal #202522 text, forest green #176B5B accents, muted #68706C captions, #D7D7CF rules, and #FAF8F2 panels. Use Georgia regular for large editorial headings and Inter or Segoe UI for body text. Use A4 portrait, 20 mm margins, 11 pt body with 17 pt leading, left alignment, generous whitespace, flat square cards, subtle rules, and occasional green-striped quotes. Keep gold #E5B522 limited to one next-step cue with dark #242015 text. Embed fonts and inspect every rendered page for clipping, overlap, and awkward breaks. Adapt the content to this system rather than reproducing website navigation.
