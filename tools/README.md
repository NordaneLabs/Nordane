# tools

`build-de.mjs` builds the German page and the files crawlers and AI agents read, from `index.html` and the legal pages `impressum.html`, `datenschutz.html` and `agb.html`:
`de/index.html`, `index.md`, `de/index.md`, `impressum.md`, `datenschutz.md`, `agb.md`, `llms.txt`, `llms-full.txt`, `sitemap.xml`, `robots.txt`.

**Re-run after editing `index.html` or any legal page** (Node 24, no install):

```sh
node tools/build-de.mjs              # sitemap lastmod = today
node tools/build-de.mjs --date=2026-10-23
```

German text lives in the `var D = { en:{...}, de:{...} }` dictionary in `index.html`; never edit `de/index.html` by hand.
The legal pages share `/assets/legal.css` and `/assets/legal.js`. German is in their HTML; English is in the page's
`var D = { de:{}, en:{...} }` (impressum) or in a hidden `<div data-block="en">` next to `<div data-block="de">` (datenschutz, agb).
The script stops if the JSON-LD prices in `index.html` no longer match the price cards, or if German text has an em dash or "ß".
