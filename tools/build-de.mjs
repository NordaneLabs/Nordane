#!/usr/bin/env node
// Builds the files that crawlers and AI agents read, from index.html and the legal pages (impressum, datenschutz, agb).
// RE-RUN AFTER EDITING index.html, impressum.html, datenschutz.html OR agb.html:   node tools/build-de.mjs   (Node 24, no npm packages)
//
// Writes, next to index.html:
//   de/index.html     index.html with the German strings from its `var D = { en:{...}, de:{...} }` dictionary baked in,
//                     so the German page needs no JavaScript to be German (GitHub Pages has no server-side language switch)
//   index.md, de/index.md, impressum.md, datenschutz.md, agb.md
//                     Markdown copies of each page (<link rel="alternate" type="text/markdown">); the legal pages in German, then English
//   llms.txt, llms-full.txt               the llmstxt.org index and the whole site as one text
//   sitemap.xml, robots.txt
// Options: --date=YYYY-MM-DD sets the sitemap lastmod (default: today).
// It stops with an error if the HTML no longer has what it expects, or if the JSON-LD prices differ from the price cards.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://nordane.ch';
const DATE = (process.argv.find(a => a.startsWith('--date=')) || '').slice(7) || new Date().toLocaleDateString('sv-SE');
const read = f => readFileSync(join(ROOT, f), 'utf8');
const write = (f, s) => { mkdirSync(dirname(join(ROOT, f)), { recursive: true }); writeFileSync(join(ROOT, f), s); console.log(`wrote ${f} (${Buffer.byteLength(s)} bytes)`); };
const fail = msg => { console.error(`build-de: ${msg}`); process.exit(1); };

// ---------- a small HTML parser: elements with their source offsets, so edits keep the rest of the file byte for byte ----------
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style']);

function parse(html) {
  const root = { tag: '#root', attrs: {}, children: [], start: 0, openEnd: 0, closeStart: html.length, end: html.length };
  const stack = [root];
  let i = 0;
  const top = () => stack[stack.length - 1];
  const text = (a, b) => { if (b > a) top().children.push({ tag: '#text', start: a, end: b, text: html.slice(a, b) }); };
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt < 0) { text(i, html.length); break; }
    text(i, lt);
    if (html.startsWith('<!--', lt)) { const e = html.indexOf('-->', lt); if (e < 0) fail('unclosed comment'); i = e + 3; continue; }
    if (html[lt + 1] === '!' || html[lt + 1] === '?') { i = html.indexOf('>', lt) + 1; continue; }
    if (html[lt + 1] === '/') {
      const e = html.indexOf('>', lt);
      const name = html.slice(lt + 2, e).trim().toLowerCase();
      const el = top();
      if (el.tag !== name) fail(`</${name}> at offset ${lt} closes <${el.tag}> opened at ${el.start}`);
      el.closeStart = lt; el.end = e + 1; stack.pop(); i = e + 1; continue;
    }
    // open tag: read the name, then up to the next > that is not inside quotes
    const m = /^<([a-zA-Z][\w:-]*)/.exec(html.slice(lt, lt + 64));
    if (!m) { text(lt, lt + 1); i = lt + 1; continue; }
    let j = lt + m[0].length, q = null;
    for (; j < html.length; j++) { const c = html[j]; if (q) { if (c === q) q = null; } else if (c === '"' || c === "'") q = c; else if (c === '>') break; }
    const raw = html.slice(lt, j + 1), tag = m[1].toLowerCase();
    const el = { tag, raw, attrs: attrs(raw), start: lt, openEnd: j + 1, children: [], parent: top() };
    top().children.push(el);
    i = j + 1;
    if (VOID.has(tag) || raw.endsWith('/>')) { el.closeStart = el.end = el.openEnd; continue; }
    if (RAW.has(tag)) {
      const e = html.toLowerCase().indexOf(`</${tag}`, i);
      el.closeStart = e; el.end = html.indexOf('>', e) + 1;
      el.children.push({ tag: '#text', start: i, end: e, text: html.slice(i, e) });
      i = el.end; continue;
    }
    stack.push(el);
  }
  if (stack.length > 1) fail(`<${top().tag}> at offset ${top().start} is never closed`);
  return root;
}
function attrs(raw) {
  const out = {}, body = raw.replace(/^<[\w:-]+/, '').replace(/\/?>$/, '');
  for (const m of body.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  return out;
}
function* walk(n) { for (const c of n.children || []) { if (c.tag !== '#text') { yield c; yield* walk(c); } } }
const all = (root, test) => [...walk(root)].filter(test);
const one = (root, test, what) => { const r = all(root, test); if (r.length !== 1) fail(`expected one ${what}, found ${r.length}`); return r[0]; };
const hasClass = (el, c) => (` ${el.attrs?.class || ''} `).includes(` ${c} `);

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', shy: '' };
function decode(s) { return s.replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (m, d, h, n) => d ? String.fromCodePoint(+d) : h ? String.fromCodePoint(parseInt(h, 16)) : ENT[n.toLowerCase()] ?? m); }
const escText = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = s => escText(s).replace(/"/g, '&quot;');

// ---------- edits on the source: attribute changes on an open tag, or a new inner HTML ----------
function editor(html) {
  const tagEdits = new Map(), inner = [];
  return {
    attr(el, name, value) { if (!tagEdits.has(el)) tagEdits.set(el, {}); tagEdits.get(el)[name] = value; },
    inner(el, value) { inner.push({ start: el.openEnd, end: el.closeStart, text: value }); },
    apply() {
      const edits = [...inner];
      for (const [el, set] of tagEdits) {
        let raw = el.raw;
        for (const [name, value] of Object.entries(set)) {
          const re = new RegExp(`(\\s${name}=")[^"]*(")`);
          raw = re.test(raw) ? raw.replace(re, (_, a, b) => a + escAttr(value) + b) : raw.replace(/\s*\/?>$/, m => ` ${name}="${escAttr(value)}"${m}`);
        }
        edits.push({ start: el.start, end: el.openEnd, text: raw });
      }
      edits.sort((a, b) => b.start - a.start);
      for (let k = 1; k < edits.length; k++) if (edits[k].end > edits[k - 1].start) fail(`overlapping edits at offset ${edits[k].start}`);
      let out = html;
      for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
      return out;
    },
  };
}

// The `var D = {...};` dictionary from a page script, evaluated on its own (it is a plain object literal).
function dictionary(html, file) {
  const at = html.indexOf('var D = {');
  if (at < 0) fail(`${file}: no "var D = {" dictionary`);
  let i = html.indexOf('{', at), depth = 0, q = null;
  for (; i < html.length; i++) {
    const c = html[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === '`') q = c;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) break;
  }
  return vm.runInNewContext(`(${html.slice(html.indexOf('{', at), i + 1)})`, {}, { timeout: 1000 });
}

// Applies one language of the dictionary the way the page script does (data-i18n, -html, -aria, -content, -ph).
const KINDS = { 'data-i18n': 'text', 'data-i18n-html': 'html', 'data-i18n-aria': 'aria-label', 'data-i18n-content': 'content', 'data-i18n-ph': 'placeholder' };
function localise(html, tree, dict, ed, file) {
  const missing = new Set();
  for (const el of walk(tree)) for (const [attr, how] of Object.entries(KINDS)) {
    if (!(attr in el.attrs)) continue;
    const key = el.attrs[attr], v = dict[key];
    if (v == null) { missing.add(key); continue; }
    if (how === 'text') ed.inner(el, escText(v));
    else if (how === 'html') ed.inner(el, v);
    else ed.attr(el, how, v);
  }
  if (missing.size) console.warn(`${file}: no translation for ${[...missing].join(', ')} (the original text stays)`);
}

// ---------- Markdown from the page HTML: headings, paragraphs, lists and links; no nav, buttons, icons or demo chat ----------
const SKIP_TAG = new Set(['svg', 'script', 'style', 'img', 'dialog', 'button', 'input', 'form', 'nav', 'header', 'template', 'noscript']);
const SKIP_CLASS = ['core', 'ico', 'num', 'stat-ico', 'tl-node', 'tl-track', 'brand', 'okam-mark', 'lang', 'cta'];
const BLOCK = new Set(['div', 'section', 'main', 'footer', 'article', 'aside', 'p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'dl', 'dt', 'dd', 'fieldset', 'label', 'blockquote', 'figure']);
const BOLD_LISTS = { stats: ' ', 'live-steps': ': ' }; // each child: **first part** + rest
const PLAIN_LISTS = ['socials'];

const skipped = el => el.tag !== '#text' && (SKIP_TAG.has(el.tag) || SKIP_CLASS.some(c => hasClass(el, c)) || 'hidden' in el.attrs);
const tidy = s => s.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').replace(/\s*[→↗]\s*$/, '').trim();
const absolute = href => href.startsWith('/') ? SITE + href : href;

function inline(n) {
  if (n.tag === '#text') return decode(n.text).replace(/\s+/g, ' ');
  if (skipped(n)) return '';
  if (n.tag === 'br') return ', ';
  const inner = n.children.map(inline).join('');
  if (n.tag === 'a') {
    const href = n.attrs.href || '', label = tidy(inner) || n.attrs['aria-label'] || '';
    if (href.startsWith('#')) return hasClass(n, 'btn') ? '' : ` ${label} `;
    return ` [${label}](${absolute(href)}) `;
  }
  if (n.tag === 'b' || n.tag === 'strong') return ` **${tidy(inner)}** `;
  return ` ${inner} `; // spans and smalls: keep words apart ("from CHF 69 / month")
}

function blocks(n, out, shift) {
  let run = [];
  const flush = () => { const t = tidy(run.join('')); if (t) out.push(t); run = []; };
  for (const c of n.children) {
    if (c.tag === '#text' || (!BLOCK.has(c.tag) && !SKIP_TAG.has(c.tag))) { run.push(inline(c)); continue; }
    if (skipped(c)) continue;
    flush();
    const h = /^h([1-6])$/.exec(c.tag);
    const bold = Object.keys(BOLD_LISTS).find(k => hasClass(c, k));
    if (h) out.push(`${'#'.repeat(Math.min(6, +h[1] + shift))} ${tidy(inline(c))}`);
    else if (c.tag === 'p') { const t = tidy(inline(c)); if (t) out.push(t); }
    else if (c.tag === 'ul' || c.tag === 'ol') out.push(c.children.filter(li => li.tag === 'li').map(li => `- ${tidy(inline(li))}`).join('\n'));
    else if (c.tag === 'dl') {
      const items = [], kids = c.children.filter(k => k.tag === 'dt' || k.tag === 'dd');
      kids.forEach((k, i) => { if (k.tag === 'dt' && kids[i + 1]?.tag === 'dd') items.push(`- **${tidy(inline(k))}**: ${tidy(inline(kids[i + 1]))}`); });
      out.push(items.join('\n'));
    } else if (bold) {
      out.push(c.children.filter(k => k.tag !== '#text' && !skipped(k)).map(item => {
        const parts = item.children.filter(k => k.tag !== '#text' && !skipped(k)).map(k => tidy(inline(k))).filter(Boolean);
        return `- **${parts[0]}**${BOLD_LISTS[bold]}${parts.slice(1).join(' ')}`;
      }).join('\n'));
    } else if (PLAIN_LISTS.some(k => hasClass(c, k))) {
      out.push(c.children.filter(k => k.tag !== '#text' && !skipped(k)).map(k => `- ${tidy(inline(k))}`).join('\n'));
    } else blocks(c, out, shift);
  }
  flush();
  return out;
}

function markdown(html, { title, description, url, note, parts = ['main', 'footer'] }) {
  const tree = parse(html), out = [`# ${title}`, `> ${description}`, `Source: ${url}`, ...(note ? [note] : [])];
  for (const tag of parts) for (const el of all(tree, e => e.tag === tag)) { if (tag === 'footer') out.push('---'); blocks(el, out, 1); }
  return out.join('\n\n').replace(/\n{3,}/g, '\n\n') + '\n';
}
const meta = (tree, name) => one(tree, e => e.tag === 'meta' && e.attrs.name === name, `<meta name="${name}">`).attrs.content;
const titleOf = (html, tree) => decode(html.slice(...(t => [t.openEnd, t.closeStart])(one(tree, e => e.tag === 'title', '<title>')))).trim();

// ======================================================================================================================
const indexHtml = read('index.html');
const tree = parse(indexHtml);
const D = dictionary(indexHtml, 'index.html');
if (!D.de) fail('index.html: the dictionary has no "de"');

// The JSON-LD prices must match the price cards.
const ld = JSON.parse(indexHtml.slice(...(s => [s.openEnd, s.closeStart])(one(tree, e => e.tag === 'script' && e.attrs.type === 'application/ld+json', 'JSON-LD script'))));
const offers = ld['@graph'].find(g => g['@type'] === 'OfferCatalog')?.itemListElement || fail('JSON-LD: no OfferCatalog');
const cards = all(tree, e => 'data-plan' in e.attrs);
if (cards.length !== offers.length) fail(`JSON-LD has ${offers.length} offers, the page has ${cards.length} price cards`);
const plans = cards.map(c => {
  const n = one(c, e => hasClass(e, 'n'), 'price amount in a card'), h3 = one(c, e => e.tag === 'h3', 'card heading'), note = one(c, e => hasClass(e, 'note'), 'card note');
  const price = Number(decode(indexHtml.slice(n.openEnd, n.closeStart)).replace(/[^0-9.]/g, ''));
  const plan = { id: c.attrs['data-plan'], price, en: decode(indexHtml.slice(h3.openEnd, h3.closeStart)), de: D.de[h3.attrs['data-i18n']], noteEn: decode(indexHtml.slice(note.openEnd, note.closeStart)), noteDe: D.de[note.attrs['data-i18n']] };
  const offer = offers.find(o => o['@id'] === `${SITE}/#plan-${plan.id}`);
  if (!offer) fail(`JSON-LD: no offer ${SITE}/#plan-${plan.id}`);
  if (offer.price !== price || offer.priceSpecification?.price !== price || offer.priceSpecification?.minPrice !== price || offer.name !== plan.en) fail(`JSON-LD offer ${plan.id} says ${offer.name} CHF ${offer.price}, the card says ${plan.en} CHF ${price}`);
  return plan;
});

// ---------- de/index.html ----------
const ed = editor(indexHtml);
localise(indexHtml, tree, D.de, ed, 'index.html → de');
const find = (test, what) => one(tree, test, what);
ed.attr(find(e => e.tag === 'html', '<html>'), 'lang', 'de-CH');
ed.attr(find(e => e.tag === 'html', '<html>'), 'data-page-lang', 'de');
ed.inner(find(e => e.tag === 'title', '<title>'), escText(D.de.title));
ed.attr(find(e => e.tag === 'link' && e.attrs.rel === 'canonical', 'canonical link'), 'href', `${SITE}/de/`);
ed.attr(find(e => e.tag === 'link' && e.attrs.rel === 'alternate' && e.attrs.type === 'text/markdown', 'markdown link'), 'href', '/de/index.md');
ed.attr(find(e => e.tag === 'meta' && e.attrs.property === 'og:url', 'og:url'), 'content', `${SITE}/de/`);
ed.attr(find(e => e.tag === 'meta' && e.attrs.property === 'og:locale', 'og:locale'), 'content', 'de_CH');
ed.attr(find(e => e.tag === 'meta' && e.attrs.property === 'og:locale:alternate', 'og:locale:alternate'), 'content', 'en_US');
for (const b of all(tree, e => e.tag === 'button' && 'data-lang' in e.attrs)) ed.attr(b, 'aria-pressed', b.attrs['data-lang'] === 'de' ? 'true' : 'false');
for (const a of all(tree, e => e.tag === 'a' && (e.attrs.href || '').startsWith('https://okam.no'))) ed.attr(a, 'href', 'https://okam.no/de');
for (const a of all(tree, e => e.tag === 'a' && hasClass(e, 'brand'))) ed.attr(a, 'href', '/de/');
const deHtml = ed.apply().replace(/^<!DOCTYPE html>\n/i, m => `${m}<!-- Generated by tools/build-de.mjs from /index.html. Do not edit: edit index.html and re-run the script. -->\n`);
if (!deHtml.includes('Generated by tools/build-de.mjs')) fail('index.html no longer starts with <!DOCTYPE html>');
parse(deHtml); // still balanced

// Checks on the German page.
for (const k of ['hero.lede', 'build.h', 'price.light.p', 'price.fine', 'ct.title']) if (!deHtml.includes(escText(D.de[k]))) fail(`de/index.html is missing the German "${k}"`);
for (const [what, re] of [['em dash', /—/], ['sharp s (Swiss German uses ss)', /ß/]]) {
  const bad = Object.entries(D.de).filter(([, v]) => re.test(v)).map(([k]) => k);
  if (bad.length) fail(`German dictionary has an ${what} in: ${bad.join(', ')}`);
}
write('de/index.html', deHtml);

// ---------- Markdown ----------
const deTree = parse(deHtml);
const enMd = markdown(indexHtml, { title: titleOf(indexHtml, tree) + ', Swiss AI studio', description: meta(tree, 'description'), url: `${SITE}/`, note: `Deutsch: ${SITE}/de/ (Markdown: ${SITE}/de/index.md)` });
const deMd = markdown(deHtml, { title: titleOf(deHtml, deTree) + ', Schweizer KI-Studio', description: meta(deTree, 'description'), url: `${SITE}/de/`, note: `English: ${SITE}/ (Markdown: ${SITE}/index.md)` });
write('index.md', enMd);
write('de/index.md', deMd);

// ---------- the legal pages: German in the HTML, English either in the page's D.en dictionary (impressum) or in a
// <div data-block="en" hidden> next to <div data-block="de"> (datenschutz, agb). Markdown: German, then English. ----------
function legal(file) {
  const html = read(file), tree = parse(html), D = dictionary(html, file);
  const main = one(tree, e => e.tag === 'main', `${file}: <main>`);
  for (const [what, re] of [['em dash', /—/], ['sharp s (Swiss German uses ss)', /ß/]]) if (re.test(html)) fail(`${file} contains an ${what}`);
  if (!D.en?.title || !D.en?.['meta.desc']) fail(`${file}: the dictionary needs en.title and en['meta.desc']`);
  const ed = editor(html), blocksDe = all(main, e => e.attrs['data-block'] === 'de'), blocksEn = all(main, e => e.attrs['data-block'] === 'en');
  if (blocksDe.length || blocksEn.length) {
    if (blocksDe.length !== 1 || blocksEn.length !== 1 || !('hidden' in blocksEn[0].attrs) || 'hidden' in blocksDe[0].attrs) fail(`${file}: expected one visible data-block="de" and one hidden data-block="en"`);
    ed.attr(blocksDe[0], 'hidden', 'hidden');
    ed.attr(blocksEn[0], 'data-block', 'en-shown');
  } else localise(html, main, D.en, ed, `${file} → en`);
  let enHtml = ed.apply();
  if (blocksEn.length) enHtml = enHtml.replace(/(<div data-block="en-shown"[^>]*?)\s+hidden(?:="")?/, '$1');
  const url = `${SITE}/${file}`, enMain = one(parse(enHtml), e => e.tag === 'main', `${file} (en): <main>`);
  const md = markdown(html, { title: titleOf(html, tree), description: meta(tree, 'description'), url, parts: ['main'] })
    + `\n---\n\n# ${D.en.title}\n\n> ${D.en['meta.desc']}\n\nEnglish (the page has an EN switch):\n\n`
    + blocks(enMain, [], 1).join('\n\n') + '\n';
  if (blocksEn.length && !md.includes(tidy(decode(html.slice(...(h => [h.openEnd, h.closeStart])(one(blocksEn[0], e => e.tag === 'h1', `${file}: English <h1>`))))))) fail(`${file}.md is missing the English text`);
  return { file, url, md, tree, title: titleOf(html, tree), description: meta(tree, 'description'), en: D.en };
}
const imp = legal('impressum.html'), priv = legal('datenschutz.html'), terms = legal('agb.html');
const impTree = imp.tree, impMd = imp.md;
for (const page of [imp, priv, terms]) write(page.file.replace(/\.html$/, '.md'), page.md);

// ---------- llms.txt, llms-full.txt ----------
const desc = meta(tree, 'description');
const llms = [
  '# Nordane', '',
  `> ${desc}`, '',
  'Nordane GmbH (UID CHE-311.699.374) is a Swiss company in Lustmühle, Appenzell Ausserrhoden. It designs, builds and runs native apps, platforms, AI agents and the infrastructure underneath, for its own products and for other companies. Its flagship is Okam, the operating system for restaurants, in daily service in Norway. Prices on this site are in Swiss francs (CHF).', '',
  'The site is one page in English at / and the same page in German (Swiss German spelling) at /de/. Die Website gibt es auch auf Deutsch: https://nordane.ch/de/', '',
  '## Pages',
  `- [Nordane (English)](${SITE}/): ${desc} Markdown: ${SITE}/index.md`,
  `- [Nordane (Deutsch)](${SITE}/de/): ${D.de['meta.desc']} Markdown: ${SITE}/de/index.md`,
  `- [Impressum / Legal notice](${SITE}/impressum.html): ${meta(impTree, 'description')} Markdown: ${SITE}/impressum.md`,
  `- [Datenschutzerklärung / Privacy notice](${SITE}/datenschutz.html): ${priv.en['meta.desc']} Markdown: ${SITE}/datenschutz.md`,
  `- [AGB / Terms and conditions](${SITE}/agb.html): ${terms.en['meta.desc']} Markdown: ${SITE}/agb.md`, '',
  '## Prices for restaurants (Okam, per location per month, cancel any month)',
  ...plans.map(p => `- ${p.en} (${p.de}): from CHF ${p.price} per month. ${p.noteEn}`),
  '- Companies: apps, AI agents and infrastructure, with a fixed written quote in CHF before any work starts.', '',
  '## Contact',
  '- E-mail: info@nordane.ch (the contact form on the site opens an e-mail to this address; nothing is sent by the site itself)',
  '- Nordane GmbH, Stäheli 851, 9062 Lustmühle, Switzerland',
  '- LinkedIn: https://www.linkedin.com/company/nordane/',
  '- X: https://x.com/Nordane_ch',
  '- Facebook: https://www.facebook.com/profile.php?id=61595439659661', '',
  '## Related',
  '- [Okam](https://okam.no/en): the restaurant operating system Nordane builds (German: https://okam.no/de)', '',
  '## Optional',
  `- [Full text of the site](${SITE}/llms-full.txt): both languages, the legal notice, the privacy notice and the terms in one file`, '',
].join('\n');
write('llms.txt', llms);
write('llms-full.txt', [`# Nordane`, '', `> ${desc}`, '', `The whole site, page by page. Index: ${SITE}/llms.txt`, '', '---', '', enMd, '---', '', deMd, '---', '', impMd, '---', '', priv.md, '---', '', terms.md].join('\n'));

// ---------- sitemap.xml, robots.txt ----------
const alt = ['en', `${SITE}/`], altDe = ['de', `${SITE}/de/`], altX = ['x-default', `${SITE}/`];
const url = (loc, alts = []) => `  <url><loc>${loc}</loc><lastmod>${DATE}</lastmod>${alts.map(([l, h]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${h}"/>`).join('')}</url>`;
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${url(`${SITE}/`, [alt, altDe, altX])}
${url(`${SITE}/de/`, [alt, altDe, altX])}
${url(`${SITE}/impressum.html`)}
${url(`${SITE}/datenschutz.html`)}
${url(`${SITE}/agb.html`)}
</urlset>
`);
write('robots.txt', `# Search engines and AI search
User-agent: Googlebot
User-agent: Bingbot
User-agent: Applebot
User-agent: DuckDuckBot
User-agent: OAI-SearchBot
User-agent: Claude-SearchBot
User-agent: PerplexityBot
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /

# Fetches a person asked an AI assistant for
User-agent: ChatGPT-User
User-agent: Claude-User
User-agent: Perplexity-User
User-agent: MistralAI-User
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /

# AI training
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: CCBot
User-agent: Meta-ExternalAgent
User-agent: Amazonbot
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /

# Everyone else
User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /

Sitemap: ${SITE}/sitemap.xml
`);

// Final sweep: no em dashes anywhere we wrote; no sharp s in German output.
for (const [f, s] of [['de/index.html', deHtml], ['index.md', enMd], ['de/index.md', deMd], ['impressum.md', impMd], ['datenschutz.md', priv.md], ['agb.md', terms.md], ['llms.txt', llms]]) {
  if (s.includes('—')) fail(`${f} contains an em dash`);
}
if ([deMd, impMd, priv.md, terms.md].some(m => /ß/.test(m))) fail('German Markdown contains ß');
console.log(`done: ${plans.length} plans checked against JSON-LD, lastmod ${DATE}`);
