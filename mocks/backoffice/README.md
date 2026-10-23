# Nordane Backoffice, final direction

One merged back-office design for restaurants (the till and kitchen display keep their own design). Demo: Wirtschaft zur Linde, St. Gallen, Friday 23.10.2026, 19:42, CHF, VAT 8.1 % / 2.6 %, 14 staff under L-GAV. German (de-CH) only: LINIE had no language switch, so none was added; English reference copy lives on `?view=voice`, and the venue language is a setting.

## How to open

- As a file: double-click `index.html`.
- Over a local server: `python3 -m http.server 5491 --bind 127.0.0.1 --directory /Users/svendaneel/Desktop/Nordane/artifacts/backoffice-final`, then open `http://127.0.0.1:5491/index.html`.
- URL parameters: `?view=…`, `?theme=light|dark`, `?palette=c|a|b`, `?bg=glow|mountains`. All three are remembered locally.

## Routes

| `?view=` | Page |
| --- | --- |
| `overview` | Übersicht: key figures, Als Nächstes (orders with next step + team issues), revenue chart, Jetzt im Dienst, current orders, payments with daily target |
| `orders` | Bestellungen: status tabs with counts, search, channel filter, positions, payment, next step, action rows highlighted, J/K/Enter |
| `order&id=1048` | Bestelldetail for any order id 1031 to 1049: items, VAT split, history, payment, next step |
| `menu` | Speisekarte with side editor (name, category, price, allergens, VAT, availability) |
| `planning` | Wochenplan: 14 people × 7 days, 4 key figures, pre-publish banner, per-day sales and labour cost, half-hour coverage strip, hours vs target, role tags, open shifts row, area filter, publish flow |
| `day&day=4` | Tagesansicht for any weekday: coverage strip, guests vs staffing, shift timeline |
| `team`, `profile&person=4` | Team list, profile for any of the 14 people |
| `requests` | Anfragen (swap, holiday, sick note) |
| `time` | Zeiterfassung, month close, bexio/Abacus CSV export |
| `templates` | Vorlagen & Regeln (rest time = rule violation, hours and availability = warnings) |
| `mobile` | Mitarbeiter-App (390 px): clock in/out, next shifts, claim open shift, request |
| `reports` | Finanzen: Z-Bericht, payment methods (own terminal, TWINT, cash, invoice), VAT, payouts, cash |
| `settings` | Einstellungen: business data, language, payments, devices |
| `components` | Komponenten sheet: type, colour tokens, controls, rota parts, states |
| `voice` | Sprache & Ton (LINIE's DE/EN microcopy reference) |

Keyboard: `⌘K` / `Ctrl K` Springen zu, `1` to `6` sections, `N` new (order, shift, item, person), `J`/`K` + `Enter` in orders, `/` search, `?` shortcut list.

## What came from where

- **LINIE (Astra, D, version in `backoffice-swiss/d-astra/v1/`)**: the look and voice, logo mark, numbered sidebar sections, Space Grotesk + JetBrains Mono, headings, rota sheet with 4 key figures, pre-publish banner, hourly needed-vs-planned chart, holiday hint, all demo data, publish/assign/requests/time/finance flows.
- **Linear variant (`backoffice-saas/v1-linear/`)**: orders table (positions, channel icons, payment incl. "noch offen", next-step buttons, status pills, action-row highlight, search + channel segments + status tabs with counts); rota additions (sales and labour cost per day, half-hour coverage strip, hours vs target, SL/SV/BA/KÜ/AW tags, Offene Schichten row, separate violation and warning counts, area filter); ⌘K palette, J/K/N/1 to 6 shortcuts with visible hints; live service cards on the overview.
- **v3-blend**: the "Braucht dich" style action list with the next step named on each item (now "Als Nächstes").

## Fixes against LINIE

- Blank page over http: LINIE's newer `index.html` loads `icons.js` + `data.js` + `app.js`; a browser that still has the older cached `app.js` (which declares `const icons` itself) throws `Identifier 'icons' has already been declared` and renders nothing. Reproduced by pairing the two files. Fixed by versioned asset URLs (`?v=final-7`), all code inside closures on one `window.NBF` namespace, validated local storage, and a visible error message instead of a blank page.
- Sidebar now sits in a full-height rail column with a sticky inner sidebar, so its background runs the whole page.
- The date appears once (top bar). No repeated date in the orders toolbar or footer.
- Rota labels: 12 to 12.5 px times, 11 to 12 px role and warning text, AA contrast; at 1024 px times switch to a short form ("16-24") instead of shrinking.
- No en or em dashes in copy (ranges use "-" or "bis").

## Colour and background

Default is **Palette C** (top bar "C A B", `?palette=c|a|b`, remembered locally):
- **Light mode = the palette A look** (owner reference, `?view=orders&theme=light&palette=a`): white and near-white surfaces, ice blue for everything interactive, LINIE's status colours. The only addition in C is the aura below.
- **Dark mode:** near-black neutral surfaces (#05080d, #0c0d0f, #16181b), ice blue for everything interactive (buttons #2a74b0 with white text, links and active states #8cc8f0), calm warnings (neutral panels with an amber icon, muted red only for true rule violations and coverage gaps), counts neutral or blue. No coral on buttons, active states, pills or text.
- **Glow (`?bg=glow`, default):** two to three very blurred radial blobs (coral plus a touch of ice blue) behind the middle of the content, about 3 to 5 % in dark and 2 to 3 % in light, dithered with fine noise against banding, drifting over 96 s (off with reduced motion). The header stays clean. You should only notice it if you look for it.
- **Berge (`?bg=mountains`):** a watermark, not an illustration: one faint outline of a peak with two soft contour echoes, low in the middle behind the content, 3.5 % line opacity, no fill, no flag, mostly hidden by panels.
- A (ice blue light, coral dark) and B (coral light, ice blue dark) remain for comparison; glow and mountains only render in C.

Compare in `shots/`: `overview-1440-dark-viewport.png` against `overview-1440-dark-mountains-viewport.png`, and the same pairs for `planning` and for `light`.

## Verification

`node tools/qa.mjs --base=http://127.0.0.1:5491/index.html` writes `shots/` and `shots/qa-report.json`: every route at 1440 and 1024 in light and dark (palette C), 390 for overview, orders, planning and the staff app, palettes A and B for overview, orders, planning and components, and `bg=mountains` for overview and planning (full page plus `-viewport` shots). 92 combinations, 0 findings for horizontal overflow, text under 11 px, WCAG AA text contrast, clipped text, dashes and console errors. All routes also load over `file://`. Flow shots: `flow-palette`, `flow-publish`, `flow-menu-editor`, `flow-shortcuts`. Chart SVG text and the background layers are excluded from the automated contrast check; text over the glow and the mountains was reviewed visually.
