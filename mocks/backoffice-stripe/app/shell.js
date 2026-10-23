/* Variante 2 "Stripe-like" shell: theme, sidebar with restaurant switcher, top bar, command palette,
   dialog, drawer, toast and small SVG chart helpers. Exposes window.UI. */
(function () {
  const KEY = 'nbs-v2-theme';
  const q = new URLSearchParams(location.search);
  let theme = q.get('theme');
  if (theme) { try { localStorage.setItem(KEY, theme); } catch (e) {} }
  else { try { theme = localStorage.getItem(KEY); } catch (e) {} }
  document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Hand-drawn 20 px stroke icons.
  const P = {
    home: '<path d="M3.5 9 10 3.8 16.5 9v7a1 1 0 0 1-1 1h-3.5v-5h-4v5H4.5a1 1 0 0 1-1-1z"/>',
    receipt: '<path d="M5 2.8h10v14.4l-2-1.2-1.7 1.2-1.3-1.2-1.3 1.2L7 16l-2 1.2z"/><path d="M7.5 7h5M7.5 10h5M7.5 13h3"/>',
    book: '<path d="M4 4.2c2-.9 4-.9 6 .6 2-1.5 4-1.5 6-.6v11.6c-2-.9-4-.9-6 .6-2-1.5-4-1.5-6-.6z"/><path d="M10 4.8v11.6"/>',
    users: '<circle cx="7.5" cy="7" r="2.8"/><path d="M2.5 16.5c.4-2.9 2.4-4.5 5-4.5s4.6 1.6 5 4.5"/><path d="M13 4.6a2.6 2.6 0 0 1 0 5M14.6 12.3c1.7.5 2.7 1.9 2.9 4.2"/>',
    calendar: '<rect x="3" y="4.5" width="14" height="12.5" rx="2"/><path d="M3 8.5h14M7 2.8v3.2M13 2.8v3.2"/>',
    day: '<rect x="3" y="4.5" width="14" height="12.5" rx="2"/><path d="M3 8.5h14M7 2.8v3.2M13 2.8v3.2M6.5 12h4"/>',
    clock: '<circle cx="10" cy="10" r="7"/><path d="M10 6v4.2l2.8 1.8"/>',
    inbox: '<path d="M3 11.5 5.2 4.5h9.6L17 11.5V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 11.5h4l1 2h4l1-2h4"/>',
    sliders: '<path d="M4 5.5h7M15 5.5h1M4 10h2M10 10h6M4 14.5h8M16 14.5h0"/><circle cx="13" cy="5.5" r="1.8"/><circle cx="8" cy="10" r="1.8"/><circle cx="14" cy="14.5" r="1.8"/>',
    bank: '<path d="M3 8 10 3.5 17 8z"/><path d="M4.5 8.5v6M8 8.5v6M12 8.5v6M15.5 8.5v6M3 16.5h14"/>',
    gear: '<circle cx="10" cy="10" r="2.6"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4"/>',
    grid: '<rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="11" y="3" width="6" height="6" rx="1.5"/><rect x="3" y="11" width="6" height="6" rx="1.5"/><rect x="11" y="11" width="6" height="6" rx="1.5"/>',
    search: '<circle cx="9" cy="9" r="5.5"/><path d="m13.2 13.2 3.6 3.6"/>',
    help: '<circle cx="10" cy="10" r="7"/><path d="M7.9 7.8a2.2 2.2 0 0 1 4.2.8c0 1.5-2.1 1.8-2.1 3.1M10 14.2v.1"/>',
    bell: '<path d="M5 13.5V9a5 5 0 0 1 10 0v4.5l1.5 1.5h-13z"/><path d="M8.3 17a1.8 1.8 0 0 0 3.4 0"/>',
    chev: '<path d="m7 8 3 3 3-3"/>',
    updown: '<path d="m7 7.5 3-3 3 3M7 12.5l3 3 3-3"/>',
    right: '<path d="m8 5 5 5-5 5"/>',
    left: '<path d="m12 5-5 5 5 5"/>',
    plus: '<path d="M10 4.5v11M4.5 10h11"/>',
    check: '<path d="m4.5 10.5 3.5 3.5 7.5-8"/>',
    x: '<path d="m5.5 5.5 9 9M14.5 5.5l-9 9"/>',
    alert: '<path d="M10 3.2 17.5 16H2.5z"/><path d="M10 8.2v3.6M10 13.9v.1"/>',
    info: '<circle cx="10" cy="10" r="7"/><path d="M10 9v4.5M10 6.6v.1"/>',
    sun: '<circle cx="10" cy="10" r="3.2"/><path d="M10 2.5v1.8M10 15.7v1.8M2.5 10h1.8M15.7 10h1.8M4.7 4.7 6 6M14 14l1.3 1.3M4.7 15.3 6 14M14 6l1.3-1.3"/>',
    moon: '<path d="M15.8 12.3A6.5 6.5 0 0 1 7.7 4.2a6.5 6.5 0 1 0 8.1 8.1z"/>',
    download: '<path d="M10 3.5v9M6.2 9 10 12.8 13.8 9M4 16.5h12"/>',
    copy: '<rect x="6.5" y="6.5" width="10" height="10" rx="2"/><path d="M13.5 6.5V4.5a1 1 0 0 0-1-1h-8a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2"/>',
    more: '<circle cx="5" cy="10" r=".9"/><circle cx="10" cy="10" r=".9"/><circle cx="15" cy="10" r=".9"/>',
    up: '<path d="M10 15V5M5.8 9.2 10 5l4.2 4.2"/>',
    down: '<path d="M10 5v10M5.8 10.8 10 15l4.2-4.2"/>',
    send: '<path d="M3 10 17 3.5 13.5 17l-3.2-5.3z"/><path d="m10.3 11.7 6.7-8.2"/>',
    phone: '<rect x="5.5" y="2.5" width="9" height="15" rx="2"/><path d="M9 14.8h2"/>',
    file: '<path d="M5 2.8h6.5L15 6.3v10.9H5z"/><path d="M11.5 2.8v3.5H15"/>',
    menu: '<path d="M3.5 6h13M3.5 10h13M3.5 14h13"/>',
    drag: '<circle cx="7.5" cy="5.5" r=".9"/><circle cx="12.5" cy="5.5" r=".9"/><circle cx="7.5" cy="10" r=".9"/><circle cx="12.5" cy="10" r=".9"/><circle cx="7.5" cy="14.5" r=".9"/><circle cx="12.5" cy="14.5" r=".9"/>',
    swap: '<path d="M4 7h11.5M12.5 4l3 3-3 3M16 13H4.5M7.5 10l-3 3 3 3"/>',
    sick: '<rect x="3" y="5.5" width="14" height="11" rx="2"/><path d="M7.5 5.5V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5M10 8.5v5M7.5 11h5"/>',
    plane: '<path d="M17 5.2c-.5-.9-1.6-.9-2.4-.3L11.8 7 5.3 5.4 4 6.7l5 2.8-2.4 2.2-2-.4-1 1 2.6 1.3 1.3 2.6 1-1-.4-2 2.2-2.4 2.8 5 1.3-1.3-1.6-6.5 2.1-2.8c.6-.8.6-1.9-.3-2.4"/>',
    hand: '<path d="M7 10V4.8a1.2 1.2 0 0 1 2.4 0V9M9.4 9V3.8a1.2 1.2 0 0 1 2.4 0V9M11.8 9V4.8a1.2 1.2 0 0 1 2.4 0v6.4c0 3.2-2 5.3-5 5.3-2.2 0-3.4-1-4.6-3L3 9.9a1.2 1.2 0 0 1 2-1.3L7 11"/>',
    pin: '<path d="M10 17s5-4.6 5-8.6A5 5 0 0 0 5 8.4C5 12.4 10 17 10 17z"/><circle cx="10" cy="8.5" r="1.8"/>',
    chat: '<path d="M3.5 5a1.5 1.5 0 0 1 1.5-1.5h10A1.5 1.5 0 0 1 16.5 5v7a1.5 1.5 0 0 1-1.5 1.5H8l-3.5 3v-3H5A1.5 1.5 0 0 1 3.5 12z"/>',
    spark: '<path d="M10 2.8 11.6 8.4 17.2 10l-5.6 1.6L10 17.2l-1.6-5.6L2.8 10l5.6-1.6z"/>',
    edit: '<path d="M4 16h3.2L16 7.2 12.8 4 4 12.8z"/><path d="m11.3 5.5 3.2 3.2"/>',
    trash: '<path d="M4 5.5h12M8 5.5V3.8h4v1.7M5.5 5.5l.7 11h7.6l.7-11"/>',
    refresh: '<path d="M16 10a6 6 0 1 1-1.8-4.3"/><path d="M16.3 3.5v3.3H13"/>',
    filter: '<path d="M3.5 5h13M6 10h8M8.5 15h3"/>',
    lock: '<rect x="4.5" y="9" width="11" height="8" rx="1.8"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/>',
    wand: '<path d="m4 16 8.5-8.5M11 4.5v2M15.5 9h-2M14.3 5.7l-1.4 1.4M12.5 2.5"/>',
    out: '<path d="M8 4H4.5v12H8M12 6.5 15.5 10 12 13.5M15.5 10H7.5"/>',
  };
  const icon = (n, s = 18, sw = 1.6) => `<svg width="${s}" height="${s}" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

  // Navigation model
  const NAV = [
    { id: 'today', label: 'Übersicht', href: 'today.html', ic: 'home' },
    { id: 'orders', label: 'Bestellungen', href: 'orders.html', ic: 'receipt', cnt: () => (window.NORDANE ? NORDANE.needsAction.length : 0) },
    { id: 'menu', label: 'Speisekarte', href: 'menu.html', ic: 'book' },
    { grp: 'Personal' },
    { id: 'plan', label: 'Wochenplan', href: 'plan.html', ic: 'calendar' },
    { id: 'plan-day', label: 'Tagesansicht', href: 'plan-day.html', ic: 'day' },
    { id: 'person', label: 'Team', href: 'person.html?id=mz', ic: 'users' },
    { id: 'requests', label: 'Anfragen', href: 'requests.html', ic: 'inbox', cnt: () => (window.DP ? DP.requests.filter((r) => r.state === 'offen').length : 0) },
    { id: 'time', label: 'Zeiterfassung', href: 'time.html', ic: 'clock' },
    { id: 'rules', label: 'Vorlagen und Regeln', href: 'rules.html', ic: 'sliders' },
    { grp: 'Betrieb' },
    { id: 'money', label: 'Geld und Berichte', href: 'money.html', ic: 'bank' },
    { id: 'settings', label: 'Einstellungen', href: 'settings.html', ic: 'gear' },
    { id: 'components', label: 'Komponenten', href: 'components.html', ic: 'grid' },
  ];
  const STORES = [['Wirtschaft zur Linde', 'St. Gallen', 'L'], ['Gasthaus Hoher Kasten', 'Brülisau AI', 'H'], ['Linde Bistro am Bahnhof', 'St. Gallen', 'B']];

  function sidebar(page) {
    const n = (it) => {
      if (it.grp) return `<li class="grp">${esc(it.grp)}</li><li class="grp-sep" aria-hidden="true"></li>`;
      const c = it.cnt ? it.cnt() : 0;
      return `<li><a href="${it.href}" ${it.id === page ? 'aria-current="page"' : ''} title="${esc(it.label)}">${icon(it.ic)}<span class="lbl">${esc(it.label)}</span>${c ? `<span class="cnt" aria-label="${c} offen">${c}</span>` : ''}</a></li>`;
    };
    return `
      <button class="ws" id="ws" aria-expanded="false" aria-controls="ws-menu" title="Betrieb wechseln">
        <span class="logo">L</span><span class="wn"><b>Wirtschaft zur Linde</b><span>St. Gallen · Nordane</span></span>${icon('updown', 16)}
      </button>
      <div class="ws-menu" id="ws-menu" role="menu">
        ${STORES.map((s, i) => `<button role="menuitem" ${i === 0 ? 'aria-current="true"' : ''}><span class="logo" ${i === 0 ? 'style="background:#22659c"' : ''}>${s[2]}</span><span>${esc(s[0])}<small>${esc(s[1])}</small></span></button>`).join('')}
        <button role="menuitem">${icon('plus', 16)}<span>Betrieb hinzufügen</span></button>
      </div>
      <ul class="nav">${NAV.map(n).join('')}</ul>
      <div class="side-foot">
        <div class="side-card"><b>Woche 44 bereit?</b>Noch 4 offene Schichten und 3 Regelverstösse.<div class="bar"><i style="width:72%"></i></div><a href="plan.html">Zum Wochenplan</a></div>
      </div>`;
  }

  function topbar() {
    const t = document.documentElement.dataset.theme;
    return `
      <button class="icon-btn menu-btn" id="menu-btn" aria-label="Menü öffnen" aria-expanded="false">${icon('menu')}</button>
      <button class="search" id="search-btn" aria-label="Suchen oder springen, Tastenkürzel Befehl K">${icon('search', 16)}<span>Suchen oder springen zu …</span><kbd>⌘K</kbd></button>
      <div class="sp"></div>
      <div class="theme-sw" role="group" aria-label="Darstellung"><button data-t="light" aria-pressed="${t === 'light'}" aria-label="Hell">${icon('sun', 16)}</button><button data-t="dark" aria-pressed="${t === 'dark'}" aria-label="Dunkel">${icon('moon', 16)}</button></div>
      <button class="icon-btn help" aria-label="Hilfe" title="Hilfe">${icon('help')}</button>
      <button class="icon-btn" aria-label="Mitteilungen" title="Mitteilungen">${icon('bell')}</button>
      <span class="avatar" title="Corina Fässler, Geschäftsführung">CF</span>`;
  }

  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem(KEY, t); } catch (e) {}
    document.querySelectorAll('.theme-sw button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
    const u = new URL(location.href); u.searchParams.set('theme', t); history.replaceState(null, '', u);
    document.dispatchEvent(new CustomEvent('themechange'));
  }

  // ---------- Toast, dialog, drawer ----------
  let tt;
  function toast(msg) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.innerHTML = icon('check', 16, 2) + `<span>${esc(msg)}</span>`;
    t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 3800);
  }
  function confirmDlg({ title, body, rows, ok, cancel, danger, extra }) {
    return new Promise((res) => {
      const d = document.createElement('dialog');
      d.className = 'dlg'; d.setAttribute('aria-labelledby', 'dlg-t');
      d.innerHTML = `<form method="dialog"><div class="in"><h2 id="dlg-t">${esc(title)}</h2>${body ? `<p>${body}</p>` : ''}
        ${rows ? `<div class="rows">${rows.map((r) => `<div><span>${esc(r[0])}</span><b>${r[2] ? r[1] : esc(r[1])}</b></div>`).join('')}</div>` : ''}${extra || ''}</div>
        <div class="act"><button class="btn" value="no">${esc(cancel || 'Abbrechen')}</button><button class="btn ${danger ? 'danger solid' : 'primary'}" value="yes" autofocus>${esc(ok)}</button></div></form>`;
      document.body.appendChild(d);
      d.addEventListener('close', () => { res(d.returnValue === 'yes'); d.remove(); });
      d.showModal();
    });
  }
  let scrim, drawer;
  function openDrawer({ title, sub, body, foot, onOpen }) {
    if (!drawer) {
      scrim = document.createElement('div'); scrim.className = 'scrim';
      drawer = document.createElement('aside'); drawer.className = 'drawer'; drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true'); drawer.setAttribute('aria-labelledby', 'dr-t');
      document.body.append(scrim, drawer);
      scrim.addEventListener('click', closeDrawer);
    }
    drawer.innerHTML = `<div class="d-h"><div><h2 id="dr-t">${esc(title)}</h2>${sub ? `<p>${sub}</p>` : ''}</div><button class="icon-btn" data-close aria-label="Schliessen">${icon('x')}</button></div>
      <div class="d-b">${body}</div>${foot ? `<div class="d-f">${foot}</div>` : ''}`;
    drawer.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeDrawer));
    requestAnimationFrame(() => { scrim.classList.add('on'); drawer.classList.add('on'); const f = drawer.querySelector('input,select,textarea,button:not([data-close])'); if (f) f.focus(); });
    if (onOpen) onOpen(drawer);
    return drawer;
  }
  function closeDrawer() { if (drawer) { drawer.classList.remove('on'); scrim.classList.remove('on'); } }

  // ---------- Command palette ----------
  function paletteItems() {
    const items = [];
    NAV.filter((n) => !n.grp).forEach((n) => items.push({ g: 'Seiten', ic: n.ic, t: n.label, href: n.href }));
    items.push({ g: 'Aktionen', ic: 'send', t: 'Wochenplan KW 44 veröffentlichen', href: 'plan.html#publish' });
    items.push({ g: 'Aktionen', ic: 'plus', t: 'Offene Schicht erstellen', href: 'plan.html#new' });
    items.push({ g: 'Aktionen', ic: 'download', t: 'Lohnexport Oktober für bexio', href: 'time.html#close' });
    items.push({ g: 'Aktionen', ic: 'inbox', t: 'Ferienanfrage von Lara Manser prüfen', href: 'requests.html' });
    items.push({ g: 'Aktionen', ic: 'receipt', t: 'Bestellung 1287 öffnen', href: 'order.html?id=1287' });
    items.push({ g: 'Aktionen', ic: 'moon', t: 'Dunkle Darstellung', run: () => setTheme('dark') });
    items.push({ g: 'Aktionen', ic: 'sun', t: 'Helle Darstellung', run: () => setTheme('light') });
    if (window.DP) DP.staff.forEach((p) => items.push({ g: 'Team', ic: 'users', t: p.name, x: p.title, href: `person.html?id=${p.id}` }));
    if (window.NORDANE) NORDANE.menu.forEach((c) => c.items.forEach((m) => items.push({ g: 'Speisekarte', ic: 'book', t: m.name, x: 'CHF ' + NORDANE.chf(m.price), href: 'menu.html' })));
    return items;
  }
  const fuzzy = (q, s) => { q = q.toLowerCase(); s = s.toLowerCase(); if (s.includes(q)) return 2; let i = 0; for (const ch of s) if (ch === q[i]) i++; return i === q.length ? 1 : 0; };
  let pal, palSel = 0, palList = [];
  function openPalette() {
    if (!pal) {
      pal = document.createElement('div'); pal.className = 'pal-wrap';
      pal.innerHTML = `<div class="pal" role="dialog" aria-modal="true" aria-label="Befehlspalette"><div class="p-in">${icon('search')}<input id="pal-q" placeholder="Seite, Person, Gericht oder Aktion suchen" autocomplete="off" role="combobox" aria-expanded="true" aria-controls="pal-l"></div><ul id="pal-l" role="listbox"></ul><div class="p-f"><span><kbd>↑</kbd> <kbd>↓</kbd> wählen</span><span><kbd>↵</kbd> öffnen</span><span><kbd>esc</kbd> schliessen</span></div></div>`;
      document.body.appendChild(pal);
      pal.addEventListener('click', (e) => { if (e.target === pal) closePalette(); const li = e.target.closest('li.it'); if (li) runItem(palList[+li.dataset.i]); });
      const inp = pal.querySelector('input');
      inp.addEventListener('input', () => { palSel = 0; renderPal(inp.value); });
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { palSel = Math.min(palList.length - 1, palSel + 1); renderPal(inp.value, true); e.preventDefault(); }
        if (e.key === 'ArrowUp') { palSel = Math.max(0, palSel - 1); renderPal(inp.value, true); e.preventDefault(); }
        if (e.key === 'Enter' && palList[palSel]) runItem(palList[palSel]);
        if (e.key === 'Escape') closePalette();
      });
    }
    pal.classList.add('on'); const inp = pal.querySelector('input'); inp.value = ''; palSel = 0; renderPal(''); inp.focus();
  }
  function renderPal(qv, keep) {
    const all = paletteItems();
    palList = qv ? all.map((it) => ({ it, s: fuzzy(qv, it.t + ' ' + (it.x || '')) })).filter((r) => r.s).sort((a, b) => b.s - a.s).map((r) => r.it).slice(0, 14) : all.filter((i) => i.g !== 'Speisekarte' && i.g !== 'Team').concat(all.filter((i) => i.g === 'Team').slice(0, 4));
    const ul = pal.querySelector('ul');
    if (!palList.length) { ul.innerHTML = `<li class="empty-p">Nichts gefunden für «${esc(qv)}». Versuchen Sie einen Namen oder «Plan».</li>`; return; }
    let g = '', h = '';
    palList.forEach((it, i) => { if (it.g !== g) { g = it.g; h += `<li class="g" role="presentation">${esc(g)}</li>`; } h += `<li class="it" role="option" data-i="${i}" aria-selected="${i === palSel}">${icon(it.ic, 16)}<span>${esc(it.t)}</span>${it.x ? `<span class="x">${esc(it.x)}</span>` : ''}</li>`; });
    ul.innerHTML = h;
    const sel = ul.querySelector('[aria-selected="true"]'); if (sel && keep) sel.scrollIntoView({ block: 'nearest' });
  }
  function runItem(it) { closePalette(); if (it.run) it.run(); else location.href = it.href; }
  function closePalette() { if (pal) pal.classList.remove('on'); }

  // ---------- Charts ----------
  // Smooth path via monotone-ish cubic.
  function path(pts) {
    if (!pts.length) return '';
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const cx = (x0 + x1) / 2;
      d += ` C${cx.toFixed(1)},${y0.toFixed(1)} ${cx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
    }
    return d;
  }
  let gid = 0;
  function spark(vals, { w = 200, h = 36, color = 'var(--primary-line)', ref } = {}) {
    const v = vals.filter((x) => x != null); const all = ref ? v.concat(ref.filter((x) => x != null)) : v;
    const mx = Math.max(...all, 1), mn = Math.min(...all, 0);
    const X = (i, n) => (i / (n - 1)) * w, Y = (x) => h - 3 - ((x - mn) / (mx - mn || 1)) * (h - 6);
    const pts = vals.map((x, i) => (x == null ? null : [X(i, vals.length), Y(x)])).filter(Boolean);
    const id = 'sg' + (++gid);
    const refP = ref ? `<path d="${path(ref.map((x, i) => [X(i, ref.length), Y(x)]))}" fill="none" stroke="var(--chart-2)" stroke-width="1.3" stroke-dasharray="3 3"/>` : '';
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".22"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>${refP}
      <path d="${path(pts)} L${pts[pts.length - 1][0]},${h} L${pts[0][0]},${h} Z" fill="url(#${id})"/><path d="${path(pts)}" fill="none" stroke="${color}" stroke-width="1.8" vector-effect="non-scaling-stroke" stroke-linecap="round"/></svg>`;
  }
  // Area chart with comparison series and hover tooltip. series: [{name, vals, kind:'area'|'dash'|'line'|'step', color}]
  function area(el, { labels, series, h = 240, fmt = (v) => v, yTicks = 4, unit = '', markIdx }) {
    const W = Math.max(300, Math.round(el.clientWidth || 800)), padL = 48, padR = 12, padT = 12, padB = 26;
    const all = series.flatMap((s) => s.vals.filter((v) => v != null));
    let mx = Math.max(...all, 1); const step = Math.pow(10, Math.floor(Math.log10(mx))) / 2; mx = Math.ceil(mx / step) * step;
    const n = labels.length;
    const X = (i) => padL + (i / (n - 1)) * (W - padL - padR), Y = (v) => padT + (1 - v / mx) * (h - padT - padB);
    let g = '';
    for (let i = 0; i <= yTicks; i++) { const v = mx * i / yTicks; g += `<line class="grid-l" x1="${padL}" x2="${W - padR}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${padL - 8}" y="${Y(v) + 4}" text-anchor="end">${fmt(v)}</text>`; }
    labels.forEach((l, i) => { if (l !== '') g += `<text x="${X(i)}" y="${h - 6}" text-anchor="middle">${esc(l)}</text>`; });
    let body = '';
    series.forEach((s, si) => {
      const pts = s.vals.map((v, i) => (v == null ? null : [X(i), Y(v)])).filter(Boolean);
      if (!pts.length) return;
      const col = s.color || 'var(--primary-line)';
      if (s.kind === 'area') {
        const id = 'ag' + (++gid);
        body += `<defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".24"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
          <path d="${path(pts)} L${pts[pts.length - 1][0]},${Y(0)} L${pts[0][0]},${Y(0)} Z" fill="url(#${id})"/><path d="${path(pts)}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linecap="round"/>`;
      } else if (s.kind === 'step') {
        let d = ''; s.vals.forEach((v, i) => { if (v == null) return; const x0 = X(i), x1 = i < n - 1 ? X(i + 1) : X(i); d += (d ? ` L${x0},${Y(v)}` : `M${x0},${Y(v)}`) + ` L${x1},${Y(v)}`; });
        body += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${s.dash ? 1.6 : 2}" ${s.dash ? 'stroke-dasharray="5 4"' : ''} stroke-linejoin="round"/>`;
      } else if (s.kind === 'bars') {
        const bw = (W - padL - padR) / n * 0.55;
        s.vals.forEach((v, i) => { if (v == null) return; body += `<rect x="${X(i) - bw / 2}" y="${Y(v)}" width="${bw}" height="${Y(0) - Y(v)}" rx="3" fill="${col}" opacity="${s.op || 1}"/>`; });
      } else {
        body += `<path d="${path(pts)}" fill="none" stroke="${s.kind === 'dash' ? 'var(--chart-2)' : col}" stroke-width="1.7" ${s.kind === 'dash' ? 'stroke-dasharray="4 4"' : ''}/>`;
      }
    });
    if (markIdx != null) body += `<line x1="${X(markIdx)}" x2="${X(markIdx)}" y1="${padT}" y2="${Y(0)}" stroke="var(--coral)" stroke-width="1.2" stroke-dasharray="2 3"/><circle cx="${X(markIdx)}" cy="${padT}" r="3" fill="var(--coral)"/>`;
    el.classList.add('chart');
    el.innerHTML = `<svg viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(series.map((s) => s.name).join(' und '))}"><g class="axis">${g}</g>${body}<line class="hl" id="hl" x1="0" x2="0" y1="${padT}" y2="${Y(0)}" style="opacity:0"/><g id="dots"></g></svg><div class="tip" aria-hidden="true"></div>`;
    const svg = el.querySelector('svg'), tip = el.querySelector('.tip'), hl = el.querySelector('#hl'), dots = el.querySelector('#dots');
    svg.addEventListener('mousemove', (e) => {
      const r = svg.getBoundingClientRect(); const sx = (e.clientX - r.left) / r.width * W;
      const i = Math.max(0, Math.min(n - 1, Math.round((sx - padL) / (W - padL - padR) * (n - 1))));
      hl.setAttribute('x1', X(i)); hl.setAttribute('x2', X(i)); hl.style.opacity = 1;
      dots.innerHTML = series.filter((s) => s.kind !== 'bars' && s.vals[i] != null).map((s) => `<circle cx="${X(i)}" cy="${Y(s.vals[i])}" r="4" fill="var(--card)" stroke="${s.kind === 'dash' ? 'var(--chart-2)' : (s.color || 'var(--primary-line)')}" stroke-width="2"/>`).join('');
      tip.innerHTML = `<b>${esc(labels[i] || '')}${unit}</b>` + series.map((s) => `<div class="r"><span><i style="background:${s.kind === 'dash' ? 'var(--chart-2)' : (s.color || 'var(--primary-line)')}"></i>${esc(s.name)}</span><b style="margin:0">${s.vals[i] == null ? 'offen' : fmt(s.vals[i], true)}</b></div>`).join('');
      const px = X(i) / W * r.width; tip.style.left = Math.min(r.width - 170, Math.max(0, px + 12)) + 'px'; tip.style.top = '8px'; tip.classList.add('on');
    });
    svg.addEventListener('mouseleave', () => { tip.classList.remove('on'); hl.style.opacity = 0; dots.innerHTML = ''; });
  }

  const roleClass = (r) => 'r-' + r;
  const avClass = (p) => 'a-' + ({ Service: (p.skills[0] === 'lead' ? 'lead' : 'service'), Bar: 'bar', Küche: 'kitchen', Abwasch: 'dish' }[p.area] || 'service');
  const pill = (t, tone, nodot) => `<span class="pill ${tone || ''} ${nodot ? 'nodot' : ''}">${esc(t)}</span>`;

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    if (document.body.dataset.bare != null) { bindKeys(); return; }
    const app = document.querySelector('.app');
    const side = document.createElement('nav'); side.className = 'side'; side.id = 'side'; side.setAttribute('aria-label', 'Hauptnavigation');
    side.innerHTML = sidebar(page); app.prepend(side);
    const top = document.createElement('header'); top.className = 'top'; top.innerHTML = topbar();
    document.querySelector('.main').prepend(top);
    top.querySelectorAll('.theme-sw button').forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.t)));
    top.querySelector('#search-btn').addEventListener('click', openPalette);
    const mb = top.querySelector('#menu-btn');
    mb.addEventListener('click', () => { const on = side.classList.toggle('on'); mb.setAttribute('aria-expanded', String(on)); });
    const ws = side.querySelector('#ws'), wm = side.querySelector('#ws-menu');
    ws.addEventListener('click', () => { const on = wm.classList.toggle('on'); ws.setAttribute('aria-expanded', String(on)); });
    wm.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => { wm.classList.remove('on'); ws.setAttribute('aria-expanded', 'false'); if (i) toast(i === 3 ? 'Neuer Betrieb: wir melden uns für die Einrichtung.' : 'Demo: nur die Linde ist mit Daten gefüllt.'); }));
    window.addEventListener('scroll', () => top.classList.toggle('scrolled', scrollY > 4), { passive: true });
    bindKeys();
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]'); if (!a || a.target || a.getAttribute('href').startsWith('#')) return;
      const u = new URL(a.href, location.href);
      if (u.protocol === location.protocol && u.pathname.endsWith('.html')) { u.searchParams.set('theme', document.documentElement.dataset.theme); a.href = u.href; }
    });
  });
  function bindKeys() {
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
      if (e.key === 'Escape') { closeDrawer(); closePalette(); }
    });
  }

  window.UI = { esc, icon, toast, confirm: confirmDlg, drawer: openDrawer, closeDrawer, spark, area, path, setTheme, q, roleClass, avClass, pill, openPalette };
})();
