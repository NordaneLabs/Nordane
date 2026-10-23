/* UI shell: icons, theme and palette, sidebar, topbar, command palette, dialogs, keyboard shortcuts. */
(function () {
  'use strict';
  var NBF = (window.NBF = window.NBF || {});
  var C = NBF.core, D = NBF.data, S = C.state, esc = C.esc;

  var P = {
    overview: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    orders: 'M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5zM9.5 8h5M9.5 12h5M9.5 16h3',
    menu: 'M4 5h16M4 12h16M4 19h10',
    staff: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M19 8a3 3 0 0 1 0 6M22 21v-2a4 4 0 0 0-3-3.8M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    reports: 'M4 20h17M7 16V9M12 16V4M17 16v-5',
    settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1',
    arrow: 'M5 12h14M13 6l6 6-6 6', back: 'M19 12H5M11 6l-6 6 6 6', chevron: 'M9 5l7 7-7 7', left: 'M15 5l-7 7 7 7',
    plus: 'M12 5v14M5 12h14', search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    moon: 'M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5',
    sun: 'M12 3V1M12 23v-2M3 12H1M23 12h-2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
    clock: 'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', check: 'M5 12l4 4L19 6', warning: 'M12 3L2 21h20zM12 9v5M12 17v1',
    download: 'M12 3v12M7 10l5 5 5-5M4 16v5h16v-5', calendar: 'M3 5h18v16H3zM3 10h18M7 3v4M17 3v4', close: 'M6 6l12 12M6 18L18 6',
    phone: 'M7 2h10v20H7zM10 18h4', edit: 'M16 3l5 5-12 12-6 1 1-6zM13 6l5 5', card: 'M2 5h20v14H2zM2 10h20M6 15h4',
    empty: 'M3 8l4-5h10l4 5v12H3zM3 8h6l2 4h2l2-4h6', hamburger: 'M4 6h16M4 12h16M4 18h16',
    help: 'M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3M12 17v1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    print: 'M6 9V2h12v7M6 18H2V9h20v9h-4M6 14h12v8H6z', save: 'M4 3h14l3 3v15H3V3zM7 3v6h10V3M7 21v-8h10v8',
    qr: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3zM6 6h1v1H6zM17 6h1v1h-1zM6 17h1v1H6z',
    store: 'M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3M10 20v-5h4v5',
    bike: 'M5.5 17.5a3 3 0 1 0 0-.01M18.5 17.5a3 3 0 1 0 0-.01M5.5 17.5L9 9h5l4.5 8.5M12 9l2-4h3',
    register: 'M4 10h16v11H4zM7 10V4h10v6M8 14h2M14 14h2M8 17h2M14 17h2',
    phonecall: 'M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2',
    send: 'M3 11l18-8-8 18-2-8z', grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    keyboard: 'M2 6h20v12H2zM6 10h1M10 10h1M14 10h1M18 10h1M7 14h10', palette: 'M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5S13 18 13 17s.7-1.5 1.5-1.5H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3M7.5 11h.01M10 7h.01M14 7h.01M17 10h.01',
    swap: 'M4 8h13l-3-3M20 16H7l3 3', beach: 'M3 20h18M12 20V9M4 9a8 8 0 0 1 16 0z', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21c1-4 4-6 8-6s7 2 8 6'
  };
  function icon(n, cls) { return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (P[n] || P.arrow) + '"/></svg>'; }

  /* ---------- theme + palette ---------- */
  var root = document.documentElement;
  function theme() { return root.dataset.theme === 'dark' ? 'dark' : 'light'; }
  function palette() { var p = root.dataset.palette; return p === 'a' || p === 'b' ? p : 'c'; }
  function setLook(t, p) {
    root.dataset.theme = t; root.dataset.palette = p;
    try { localStorage.setItem('nbf1-theme', t); localStorage.setItem('nbf1-palette', p); } catch (e) {}
    try { var u = new URL(location.href); u.searchParams.set('theme', t); u.searchParams.set('palette', p); history.replaceState(null, '', u.href); } catch (e) {}
  }

  /* Watermark: one faint outline of a peak with two soft contour echoes. No fill, no flag, no colour. */
  var LANDSCAPE = '<div class="landscape" aria-hidden="true"><svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax meet">' +
    '<path class="ls-ridge" d="M0 760L140 712L250 730L380 650L470 676L590 560L660 590L760 450L812 404L846 352L880 404L930 430L1010 520L1080 500L1180 600L1280 584L1400 660L1500 640L1600 690"/>' +
    '<path class="ls-echo" d="M120 820L300 770L440 790L590 700L700 726L790 610L846 520L900 600L1000 650L1120 700L1260 720L1420 770L1600 790"/>' +
    '<path class="ls-echo" d="M260 880L460 840L620 856L740 790L846 690L950 780L1100 820L1300 850L1520 880"/></svg></div>';
  function bg() { return root.dataset.bg === 'mountains' ? 'mountains' : 'glow'; }
  function setBg(b) { root.dataset.bg = b; try { localStorage.setItem('nbf1-bg', b); var u = new URL(location.href); u.searchParams.set('bg', b); history.replaceState(null, '', u.href); } catch (e) {} }
  /* ---------- routes ---------- */
  var ROUTES = {
    overview: { t: 'Übersicht', sec: 'overview' }, orders: { t: 'Bestellungen', sec: 'orders' }, order: { t: 'Bestelldetail', sec: 'orders' },
    menu: { t: 'Speisekarte', sec: 'menu' }, planning: { t: 'Wochenplan', sec: 'planning' }, day: { t: 'Tagesansicht', sec: 'planning' },
    team: { t: 'Team', sec: 'planning' }, profile: { t: 'Mitarbeiterprofil', sec: 'planning' }, requests: { t: 'Anfragen', sec: 'planning' },
    time: { t: 'Zeiterfassung', sec: 'planning' }, templates: { t: 'Vorlagen & Regeln', sec: 'planning' }, mobile: { t: 'Mitarbeiter-App', sec: 'mobile' },
    reports: { t: 'Finanzen', sec: 'reports' }, settings: { t: 'Einstellungen', sec: 'settings' }, components: { t: 'Komponenten', sec: 'components' },
    voice: { t: 'Sprache & Ton', sec: 'components' }
  };
  var ALIAS = { heute: 'overview', today: 'overview', plan: 'planning', system: 'components', money: 'reports', finanzen: 'reports', person: 'profile', rules: 'templates' };
  var qv = C.query.get('view');
  var view = ROUTES[qv] ? qv : ALIAS[qv] || 'overview';
  var NAV = [
    ['overview', '01', 'Übersicht', 'overview'], ['orders', '02', 'Bestellungen', 'orders'], ['menu', '03', 'Speisekarte', 'menu'],
    ['planning', '04', 'Team & Planung', 'staff'], ['reports', '05', 'Finanzen', 'reports'], ['settings', '06', 'Einstellungen', 'settings']
  ];
  var TEAM_TABS = [['planning', 'Wochenplan'], ['day', 'Tagesansicht'], ['team', 'Team'], ['requests', 'Anfragen'], ['time', 'Zeiterfassung'], ['templates', 'Vorlagen & Regeln']];

  function href(v, more) {
    var p = new URLSearchParams(Object.assign({ view: v }, more || {}));
    p.set('theme', theme()); p.set('palette', palette()); p.set('bg', bg());
    return '?' + p.toString();
  }
  function link(v, label, cls, more, attrs) { return '<a class="' + (cls || '') + '" href="' + href(v, more) + '" ' + (attrs || '') + '>' + label + '</a>'; }
  function button(text, action, kind, ico, extra) { return '<button type="button" class="button ' + (kind || '') + '" data-action="' + action + '" ' + (extra || '') + '>' + (ico ? icon(ico) : '') + text + '</button>'; }
  function badge(label, type) { return '<span class="badge ' + (type || '') + '">' + label + '</span>'; }
  function tag(t) { return '<span class="tag ' + t + '" title="' + ({ SL: 'Schichtleitung', SV: 'Service', BA: 'Bar', 'KÜ': 'Küche', AW: 'Abwasch' }[t] || '') + '">' + t + '</span>'; }
  function sectionTitle(n, title, extra) { return '<div class="section-head"><h2>' + (n ? '<span class="section-number">' + n + '</span>' : '') + title + '</h2>' + (extra || '') + '</div>'; }
  function field(label, input, help) { return '<label>' + label + input + (help ? '<span class="field-help">' + help + '</span>' : '') + '</label>'; }
  function pageHead(eyebrow, title, sub, actions) {
    return '<div class="page-head"><div><div class="eyebrow">' + eyebrow + '</div><h1>' + title + '</h1>' + (sub ? '<p class="subhead">' + sub + '</p>' : '') + '</div>' + (actions ? '<div class="page-actions">' + actions + '</div>' : '') + '</div>';
  }
  function teamTabs() {
    var open = C.state && NBF.ui ? NBF.ui.openRequests() : 0;
    return '<nav class="tabs" aria-label="Team und Planung">' + TEAM_TABS.map(function (t) {
      var active = t[0] === view || (t[0] === 'team' && view === 'profile');
      return link(t[0], t[1] + (t[0] === 'requests' && open ? '<span class="count">' + open + '</span>' : ''), 'tab' + (active ? ' active' : ''), null, active ? 'aria-current="page"' : '');
    }).join('') + '</nav>';
  }
  function openRequests() { return D.requests.filter(function (r) { return !S.requests[r.id]; }).length; }

  function shell(content) {
    var sec = ROUTES[view].sec;
    document.title = ROUTES[view].t + ' · Nordane Backoffice';
    var navHtml = NAV.map(function (n) {
      var active = sec === n[0];
      var count = n[0] === 'orders' ? C.needsAction().length : n[0] === 'planning' ? openRequests() : 0;
      var sub = '';
      if (n[0] === 'planning' && (active || sec === 'mobile')) {
        sub = '<div class="nav-sub">' + TEAM_TABS.concat([['mobile', 'Mitarbeiter-App']]).map(function (t) {
          var a = t[0] === view || (t[0] === 'team' && view === 'profile');
          return link(t[0], t[1], a ? 'active' : '', null, a ? 'aria-current="page"' : '');
        }).join('') + '</div>';
      }
      return '<a class="nav-link' + (active ? ' active' : '') + '" href="' + href(n[0]) + '"' + (active ? ' aria-current="true"' : '') + ' title="' + n[2] + ' (Taste ' + Number(n[1]) + ')">' + icon(n[3]) + '<span>' + n[2] + '</span>' + (count ? '<span class="nav-count" aria-label="' + count + ' offen">' + count + '</span>' : '') + '<span class="nav-num" aria-hidden="true">' + n[1] + '</span></a>' + sub;
    }).join('');
    var t = theme(), p = palette();
    var crumb = sec === 'planning' || sec === 'mobile' ? 'Team & Planung' : sec === 'components' ? 'Design' : null;
    document.getElementById('app').innerHTML =
      LANDSCAPE + '<div class="mobile-nav-shade" data-action="nav-close"></div><div class="app">' +
      '<div class="rail" id="rail"><aside class="sidebar" aria-label="Hauptnavigation">' +
        '<a class="brand" href="' + href('overview') + '" aria-label="Nordane, Übersicht"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>nordane</a>' +
        '<div class="venue"><strong>' + D.venue.name + '</strong>' + D.venue.city + ', ' + D.venue.country + '</div>' +
        '<div class="nav-label">Betrieb</div><nav class="nav">' + navHtml + '</nav>' +
        '<div class="nav-divider"></div><nav class="nav">' +
          '<a class="nav-link' + (view === 'mobile' ? ' active' : '') + '" href="' + href('mobile') + '">' + icon('phone') + '<span>Mitarbeiter-App</span></a>' +
          '<a class="nav-link' + (sec === 'components' ? ' active' : '') + '" href="' + href('components') + '">' + icon('grid') + '<span>Komponenten</span></a></nav>' +
        '<div class="sidebar-bottom"><button class="side-hint button text" data-action="shortcuts" style="color:var(--muted)">' + icon('keyboard') + 'Tastenkürzel <kbd>?</kbd></button>' +
        '<div class="user"><span class="avatar">LK</span><div>Lena Keller<small>Betriebsleitung</small></div></div></div>' +
      '</aside></div>' +
      '<div class="shell"><header class="topbar"><div class="crumb"><button class="icon-button mobile-menu" data-action="nav" aria-label="Navigation öffnen">' + icon('hamburger') + '</button>' +
        '<span class="desk">Backoffice</span><span class="desk">/</span>' + (crumb ? '<span class="desk">' + crumb + '</span><span class="desk">/</span>' : '') + '<strong>' + ROUTES[view].t + '</strong></div>' +
        '<div class="top-actions"><button class="jump" data-action="palette" aria-label="Springen zu (Befehl K)">' + icon('search') + '<span class="jump-label">Springen zu</span><kbd>⌘K</kbd></button>' +
        '<span class="live-label"><i class="live-dot"></i>Service läuft</span><span class="top-clock">' + D.venue.now + ' · ' + D.venue.time + '</span>' +
        '<div class="palette-switch" role="group" aria-label="Farbpalette"><span>Farben</span>' + [['c', 'C', 'Palette C, Glow: Eisblau für alles Bedienbare, Koralle nur als Licht im Hintergrund'], ['a', 'A', 'Palette A: Eisblau hell, Koralle dunkel'], ['b', 'B', 'Palette B: Koralle hell, Eisblau dunkel']].map(function (x) { return '<button data-palette="' + x[0] + '" aria-pressed="' + (p === x[0]) + '" title="' + x[2] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
        '<div class="palette-switch bg-switch" role="group" aria-label="Hintergrund"><span>Hintergrund</span><button data-bg="glow" aria-pressed="' + (bg() === 'glow') + '" title="Nur das Abendlicht">Glow</button><button data-bg="mountains" aria-pressed="' + (bg() === 'mountains') + '" title="Abendlicht mit Bergsilhouette">Berge</button></div>' +
        '<button class="top-button" data-action="theme" aria-label="' + (t === 'dark' ? 'Helles' : 'Dunkles') + ' Farbschema">' + icon(t === 'dark' ? 'sun' : 'moon') + '<span class="theme-label">' + (t === 'dark' ? 'Hell' : 'Dunkel') + '</span></button></div></header>' +
        '<main id="main" class="main view-' + view + '">' + content +
        '<footer class="footer"><span>' + D.venue.name + ', ' + D.venue.city + ' · Nordane Backoffice, lokaler Prototyp</span>' +
        '<span class="keys"><span><kbd>⌘K</kbd> Springen</span><span><kbd>1</kbd>-<kbd>6</kbd> Bereiche</span><span><kbd>N</kbd> Neu</span><span><kbd>J</kbd><kbd>K</kbd> Auswahl</span>' + link('components', 'Komponenten') + link('voice', 'Sprache & Ton') + '</span></footer></main></div></div>';
  }

  /* ---------- dialogs, toast ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function toast(msg) {
    var el = $('#toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('show'); }, 3800);
  }
  function modal(title, body, actions, desc) {
    var d = $('#dialog');
    d.innerHTML = '<div class="dialog-head"><div><h2 id="dialog-title">' + title + '</h2>' + (desc ? '<p class="dialog-desc">' + desc + '</p>' : '') + '</div><button class="icon-button" data-action="modal-close" aria-label="Dialog schliessen">' + icon('close') + '</button></div><div class="dialog-body">' + body + '</div><div class="dialog-actions">' + button('Abbrechen', 'modal-close') + (actions || '') + '</div>';
    if (!d.open) d.showModal();
    setTimeout(function () { var f = d.querySelector('.dialog-body input,.dialog-body select,.dialog-body textarea'); (f || d.querySelector('.dialog-actions .primary') || d).focus(); }, 30);
  }
  function closeModal() { var d = $('#dialog'); if (d.open) d.close(); }

  /* ---------- command palette ---------- */
  function palItems() {
    var items = [];
    NAV.forEach(function (n) { items.push({ g: 'Bereiche', t: n[2], ic: n[3], go: href(n[0]), k: n[1].slice(1) }); });
    TEAM_TABS.concat([['mobile', 'Mitarbeiter-App'], ['order', 'Bestelldetail #1048'], ['components', 'Komponenten'], ['voice', 'Sprache & Ton']]).forEach(function (t) { items.push({ g: 'Seiten', t: t[1], ic: t[0] === 'mobile' ? 'phone' : t[0] === 'components' ? 'grid' : 'arrow', go: href(t[0]) }); });
    [['Plan KW 43 veröffentlichen', 'send', href('planning', { publish: '1' })], ['Offene Schichten besetzen', 'calendar', href('planning') + '#offen'],
     ['Planungshinweise prüfen', 'warning', href('planning', { check: '1' })], ['Schicht hinzufügen', 'plus', href('planning', { add: '1' })],
     ['Bestellung #1049 bestätigen', 'qr', href('order', { id: '1049' })], ['Kurier für #1046 anrufen', 'phonecall', href('order', { id: '1046' })],
     ['Tagesabschluss vorbereiten', 'check', href('reports', { close: '1' })], ['Lohnexport Oktober', 'download', href('time', { export: '1' })],
     ['Farbschema wechseln', 'moon', '#theme'], ['Farbpalette wechseln (C, A, B)', 'palette', '#palette']].forEach(function (a) { items.push({ g: 'Aktionen', t: a[0], ic: a[1], go: a[2] }); });
    D.staff.forEach(function (p, i) { items.push({ g: 'Team', t: p.name, ic: 'user', go: href('profile', { person: String(i) }), k: p.title }); });
    C.orders().forEach(function (o) { items.push({ g: 'Bestellungen', t: '#' + o.id + ' ' + o.where, ic: 'orders', go: href('order', { id: String(o.id) }), k: C.STATUS[o.status][1] }); });
    return items;
  }
  function score(t, q) {
    if (!q) return 1; t = t.toLowerCase(); q = q.toLowerCase();
    if (t.indexOf(q) >= 0) return 100 - t.indexOf(q);
    var i = 0; for (var c = 0; c < t.length; c++) { if (t[c] === q[i]) i++; if (i === q.length) return 1; }
    return 0;
  }
  var pal;
  function renderPal(q) {
    var list = palItems().map(function (x) { return Object.assign(x, { s: score(x.t + ' ' + (x.k || ''), q) }); }).filter(function (x) { return x.s > 0; });
    if (!q) list = list.filter(function (x) { return x.g !== 'Bestellungen' && x.g !== 'Team'; });
    else list.sort(function (a, b) { return b.s - a.s; });
    var groups = {}, order = [];
    list.slice(0, 40).forEach(function (x) { if (!groups[x.g]) { groups[x.g] = []; order.push(x.g); } groups[x.g].push(x); });
    var html = '', n = 0;
    order.forEach(function (g) {
      html += '<li class="palette-group" role="presentation">' + g + '</li>';
      groups[g].forEach(function (x) { html += '<li class="palette-item" role="option" id="pi' + n + '" aria-selected="' + (n === 0) + '" data-go="' + esc(x.go) + '">' + icon(x.ic) + '<span>' + esc(x.t) + '</span>' + (x.k ? '<small>' + esc(x.k) + '</small>' : '') + '</li>'; n++; });
    });
    $('#palList').innerHTML = html || '<li class="palette-group">Nichts gefunden. Anders suchen oder Esc.</li>';
  }
  function openPal() {
    if (!pal) {
      pal = document.createElement('div'); pal.className = 'palette'; pal.setAttribute('role', 'dialog'); pal.setAttribute('aria-modal', 'true'); pal.setAttribute('aria-label', 'Springen zu');
      pal.innerHTML = '<div class="palette-box"><div class="palette-in">' + icon('search') + '<input id="palIn" placeholder="Springen zu: Seite, Person, Bestellung oder Aktion" aria-label="Springen zu" autocomplete="off" role="combobox" aria-controls="palList" aria-expanded="true"><kbd>Esc</kbd></div><ul class="palette-list" id="palList" role="listbox"></ul><div class="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> wählen</span><span><kbd>↵</kbd> öffnen</span><span><kbd>Esc</kbd> schliessen</span></div></div>';
      document.body.appendChild(pal);
      var inp = pal.querySelector('input');
      inp.addEventListener('input', function () { renderPal(inp.value); });
      inp.addEventListener('keydown', function (e) {
        var its = $$('.palette-item', pal), i = its.findIndex(function (x) { return x.getAttribute('aria-selected') === 'true'; });
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!its.length) return; i = (i + (e.key === 'ArrowDown' ? 1 : -1) + its.length) % its.length; its.forEach(function (x, j) { x.setAttribute('aria-selected', String(j === i)); }); its[i].scrollIntoView({ block: 'nearest' }); inp.setAttribute('aria-activedescendant', its[i].id); }
        if (e.key === 'Enter' && its[i]) go(its[i].dataset.go);
        if (e.key === 'Escape') closePal();
      });
      pal.addEventListener('click', function (e) { var li = e.target.closest('.palette-item'); if (li) go(li.dataset.go); else if (e.target === pal) closePal(); });
    }
    renderPal(''); pal.classList.add('on');
    var inp = pal.querySelector('input'); inp.value = ''; setTimeout(function () { inp.focus(); }, 20);
  }
  function closePal() { if (pal) pal.classList.remove('on'); }
  function go(target) {
    closePal();
    if (target === '#theme') { setLook(theme() === 'dark' ? 'light' : 'dark', palette()); NBF.ui.render(); return; }
    if (target === '#palette') { setLook(theme(), { c: 'a', a: 'b', b: 'c' }[palette()]); NBF.ui.render(); return; }
    location.href = target;
  }

  function shortcutsDialog() {
    var rows = [['⌘K oder Ctrl K', 'Springen zu: Seiten, Personen, Bestellungen, Aktionen'], ['1 bis 6', 'Bereiche 01 Übersicht bis 06 Einstellungen'], ['N', 'Neu: Bestellung, Schicht oder Artikel, je nach Seite'], ['J / K', 'Nächste oder vorherige Zeile in Listen'], ['Enter', 'Gewählte Zeile öffnen'], ['/', 'Suche auf der Seite'], ['?', 'Diese Übersicht']];
    modal('Tastenkürzel', '<div>' + rows.map(function (r) { return '<div class="summary-line"><span>' + r[1] + '</span><span class="row gap6">' + r[0].split(' oder ').map(function (k) { return '<kbd>' + k + '</kbd>'; }).join(' ') + '</span></div>'; }).join('') + '</div>', button('Fertig', 'modal-close', 'primary'));
  }

  NBF.ui = {
    icon: icon, href: href, link: link, button: button, badge: badge, tag: tag, sectionTitle: sectionTitle, field: field, pageHead: pageHead,
    teamTabs: teamTabs, shell: shell, toast: toast, modal: modal, closeModal: closeModal, openPal: openPal, closePal: closePal, palIsOpen: function () { return pal && pal.classList.contains('on'); },
    shortcutsDialog: shortcutsDialog, bg: bg, setBg: setBg, theme: theme, palette: palette, setLook: setLook, view: function () { return view; }, ROUTES: ROUTES, NAV: NAV,
    openRequests: openRequests, $: $, $$: $$
  };
})();
