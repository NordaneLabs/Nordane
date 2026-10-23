/* Page views. Each returns an HTML string; app.js wraps it in the shell. */
(function () {
  'use strict';
  var NBF = window.NBF, C = NBF.core, U = NBF.ui, D = NBF.data, S = C.state;
  var icon = U.icon, link = U.link, button = U.button, badge = U.badge, tag = U.tag, sectionTitle = U.sectionTitle, field = U.field, pageHead = U.pageHead, esc = C.esc;
  var chf = C.chf, num = C.num, hl = C.hl, hm = C.hm;
  var CH_ICON = { 'Kasse': 'register', 'Tisch-QR': 'qr', 'Abholung': 'store', 'Lieferung': 'bike' };
  var ACTION_ICON = { 'Bestätigen': 'check', 'Kurier anrufen': 'phonecall', 'Rechnung senden': 'send', 'Abholung bestätigen': 'store' };

  function pill(o) { var s = C.STATUS[o.status]; return badge(s[1], s[0]); }
  function payCell(o) { return o.pay ? esc(o.pay) : '<span class="pay-open">noch offen</span>'; }
  function positions(o) { return o.items.map(function (it) { return it[1] + '× ' + C.menuById[it[0]].name; }).join(', '); }
  function nextAction(o, small) { return o.action ? '<button class="next-action" data-order-action="' + o.id + '">' + icon(ACTION_ICON[o.action] || 'arrow') + o.action + '</button>' : (small ? '' : '<span class="muted">-</span>'); }

  /* ================= OVERVIEW ================= */
  function revenueChart() {
    return '<div class="chart-wrap"><svg class="revenue-chart" viewBox="0 0 630 230" role="img" aria-label="Umsatz heute: CHF 6\'694 um 19:42, über dem Vergleichsfreitag">' +
      '<path class="chart-grid" d="M46 20H620M46 66H620M46 112H620M46 158H620M46 200H620"/>' +
      [['8\'000', 24], ['6\'000', 70], ['4\'000', 116], ['2\'000', 162]].map(function (l) { return '<text class="chart-label" x="0" y="' + l[1] + '">' + l[0] + '</text>'; }).join('') +
      '<path class="chart-area" d="M47 200L96 195L145 181L194 155L243 143L292 138L341 136L390 125L439 99L468 71L501 53V200H47Z"/>' +
      '<path class="chart-prev" d="M47 200L96 197L145 184L194 167L243 159L292 155L341 150L390 142L439 126L488 94L537 82L586 63L620 54"/>' +
      '<path class="chart-line" d="M47 200L96 195L145 181L194 155L243 143L292 138L341 136L390 125L439 99L468 71L501 53"/>' +
      '<circle cx="501" cy="53" r="4.5" fill="var(--signal)"/><path d="M501 60V200" stroke="var(--signal)" stroke-dasharray="2 5" opacity=".6"/>' +
      '<text class="chart-label" x="34" y="223">11:00</text><text class="chart-label" x="182" y="223">14:00</text><text class="chart-label" x="331" y="223">17:00</text><text class="chart-label" x="482" y="223">20:00</text><text class="chart-label" x="584" y="223">22:00</text></svg></div>';
  }
  function overview() {
    var na = C.needsAction(), run = C.orders().filter(function (o) { return C.RUNNING.indexOf(o.status) >= 0; }).length;
    var friCost = C.dayCost(4), friQuote = friCost / D.forecast[4] * 100, wc = C.warnCounts(), open = C.openLeft();
    var actions = na.map(function (o, i) {
      return '<div class="action-item"><span class="action-index">' + String(i + 1).padStart(2, '0') + '</span><div class="grow"><h3>' + link('order', esc(o.where), '', { id: String(o.id) }) + ' <span class="muted mono">#' + o.id + '</span></h3><p>' + esc(o.why || o.guest) + '</p></div>' + nextAction(o, true) + '</div>';
    }).join('');
    var team = [
      ['Luca Baumann noch nicht eingestempelt', 'Geplant ab 18:00, verfügbar erst ab 19:00', 'Anrufen', 'call-luca'],
      open.length ? [open.length + ' offene Schicht' + (open.length > 1 ? 'en' : '') + ' am Wochenende', open.map(function (o) { return D.dayNames[o.day] + ' ' + o.title + ', ' + C.range([o.start, o.end]); }).join(' · '), 'Besetzen', 'go-open'] : null,
      wc.all.length ? [wc.bad + ' Regelverstoss, ' + wc.warn + ' Warnungen im Wochenplan', wc.all.map(function (w) { return w.summary; }).slice(0, 2).join(' · '), 'Prüfen', 'go-check'] : null
    ].filter(Boolean).map(function (t, i) {
      return '<div class="action-item"><span class="action-index">' + String(na.length + i + 1).padStart(2, '0') + '</span><div class="grow"><h3>' + t[0] + '</h3><p>' + t[1] + '</p></div><button class="next-action" data-action="' + t[3] + '">' + t[2] + '</button></div>';
    }).join('');
    var duty = D.clock.slice().sort(function (a, b) { return a.in < b.in ? 1 : -1; }).slice(0, 6).map(function (c) {
      var p = D.staff[c.p], s = C.shiftOf(c.p, 4);
      return '<div class="duty-row"><span class="avatar">' + p.ini + '</span><div>' + link('profile', p.name, '', { person: String(c.p) }) + '<small>' + tag(p.tag) + 'Plan ' + (C.isWork(s) ? C.range(s) : 'frei') + '</small></div><span class="mono">seit ' + c.in + '</span></div>';
    }).join('');
    var recent = C.orders().slice(0, 6);
    var goalPct = D.day.gross / D.forecast[4] * 100;
    return pageHead('01 / Betriebsübersicht', 'Ein guter Abend.', 'Abendservice seit 17:30. 31 Gäste sitzen, 6 Bons sind in der Küche.', link('reports', icon('download') + 'Tagesbericht', 'button')) +
      '<div class="metric-strip">' +
        '<div class="metric"><div class="metric-label">Umsatz heute, brutto</div><div class="metric-value"><span class="currency">CHF</span>6\'694<span class="unit">.00</span></div><div class="metric-foot"><span class="positive">+12.4 %</span> zum letzten Freitag um diese Zeit</div></div>' +
        '<div class="metric"><div class="metric-label">Bestellungen</div><div class="metric-value">' + D.day.orders + '</div><div class="metric-foot">' + run + ' laufend · <span class="accent">' + na.length + ' brauchen Aktion</span></div></div>' +
        '<div class="metric"><div class="metric-label">Gäste heute</div><div class="metric-value">' + D.day.guests + '</div><div class="metric-foot">' + chf(D.day.gross / D.day.guests) + ' pro Gast</div></div>' +
        '<div class="metric"><div class="metric-label">Personalkostenquote heute</div><div class="metric-value">' + num(friQuote, 1) + '<span class="unit">%</span></div><div class="metric-foot">Ziel 27 bis 30 % · ' + chf(friCost, 0) + ' geplant</div></div>' +
      '</div>' +
      '<section class="surface next-panel">' + sectionTitle('01', 'Als Nächstes', badge((na.length + (team ? team.split('action-item').length - 1 : 0)) + ' offen', 'accent')) +
        '<div class="next-cols"><div><div class="action-kind">Bestellungen</div>' + actions + '</div><div><div class="action-kind">Team und Plan</div>' + team + '</div></div></section>' +
      '<div class="overview-grid"><section class="surface">' + sectionTitle('02', 'Der Tag in Zahlen', badge('Live', 'good dot')) +
        '<div class="legend"><span class="legend-item"><i class="legend-line"></i>Heute</span><span class="legend-item"><i class="legend-line dashed"></i>Letzter Freitag</span><span style="margin-left:auto">Bruttoumsatz in CHF</span></div>' + revenueChart() +
        '<div class="service-band"><div><strong>18 <span class="muted small">/ 24</span></strong><small>Tische belegt</small></div><div><strong>7 <span class="muted small">Min.</span></strong><small>bis zum ersten Gang</small></div><div><strong>6 <span class="muted small">Bons</span></strong><small>in der Küche, Ø 14 Min.</small></div><div><strong>10 <span class="muted small">/ 11</span></strong><small>Team eingestempelt</small></div></div></section>' +
        '<section class="surface">' + sectionTitle('03', 'Jetzt im Dienst', link('time', 'Zeiterfassung', 'view-all-link')) + duty + '<p class="legal-note">Lea Steiner ist krank gemeldet. Noah Weber übernimmt die Bar.</p></section></div>' +
      '<div class="overview-grid">' +
        '<section class="plain-surface"><div class="surface-title">' + sectionTitle('04', 'Aktuelle Bestellungen', link('orders', 'Alle ansehen ' + icon('arrow'), 'view-all-link')) + '</div><div class="table-wrap"><table class="order-table"><thead><tr><th>Nr.</th><th>Tisch oder Gast</th><th class="hide-sm">Kanal</th><th>Status</th><th class="hide-sm">Zahlung</th><th class="num">CHF</th></tr></thead><tbody>' +
          recent.map(function (o) { return '<tr class="' + (o.action ? 'needs' : '') + '" data-href="' + U.href('order', { id: String(o.id) }) + '"><td><span class="order-id">#' + o.id + '</span></td><td>' + esc(o.where) + '<span class="table-secondary">' + o.time + '</span></td><td class="hide-sm"><span class="channel">' + icon(CH_ICON[o.channel]) + o.channel + '</span></td><td>' + pill(o) + '</td><td class="hide-sm">' + payCell(o) + '</td><td class="num mono">' + num(o.total) + '</td></tr>'; }).join('') +
        '</tbody></table></div></section>' +
        '<section class="surface">' + sectionTitle('05', 'Zahlungseingänge', link('reports', icon('arrow'), 'view-all-link', null, 'aria-label="Finanzen öffnen"')) +
          '<div class="between small"><span class="muted">Tagesziel ' + chf(D.forecast[4], 0) + '</span><strong class="mono">' + num(goalPct, 0) + ' %</strong></div><div class="goal-track"><i style="width:' + goalPct + '%"></i></div>' +
          tenderBar() + D.tenders.map(function (t, i) { return '<div class="summary-line"><span><i class="tender-dot t' + (i + 1) + '"></i>' + t.label + '</span><strong class="mono">' + chf(t.amount) + '</strong></div>'; }).join('') +
          '<p class="legal-note">Abgeschlossene Zahlungen. Offene Bestellungen sind noch nicht enthalten.</p></section>' +
      '</div>';
  }
  function tenderBar() { return '<div class="tender-bar" aria-hidden="true">' + D.tenders.map(function (t) { return '<i style="width:' + (t.amount / D.day.gross * 100) + '%"></i>'; }).join('') + '</div>'; }

  /* ================= ORDERS ================= */
  var TABS = [
    ['all', 'Alle', function () { return true; }], ['act', 'Braucht Aktion', function (o) { return !!o.action; }],
    ['run', 'Laufend', function (o) { return C.RUNNING.indexOf(o.status) >= 0; }], ['paid', 'Bezahlt', function (o) { return o.status === 'bezahlt'; }],
    ['void', 'Storniert und erstattet', function (o) { return o.status === 'storniert' || o.status === 'erstattet'; }]
  ];
  function orderRows() {
    var f = (TABS.filter(function (t) { return t[0] === S.orderTab; })[0] || TABS[0])[2], q = S.orderQuery.toLowerCase();
    return C.orders().filter(f).filter(function (o) { return S.orderChannel === 'Alle' || o.channel === S.orderChannel; }).filter(function (o) {
      return !q || ('#' + o.id + ' ' + o.where + ' ' + o.guest + ' ' + o.channel + ' ' + (o.pay || '') + ' ' + positions(o)).toLowerCase().indexOf(q) >= 0;
    });
  }
  function ordersTable() {
    var rows = orderRows(); if (S.orderSel >= rows.length) S.orderSel = Math.max(0, rows.length - 1);
    var sum = rows.reduce(function (t, o) { return t + o.total; }, 0);
    return '<div class="table-wrap"><table class="order-table" aria-label="Bestellungen heute"><thead><tr><th>Nr.</th><th>Zeit</th><th class="hide-sm">Kanal</th><th>Tisch oder Gast</th><th class="hide-md">Positionen</th><th>Status</th><th class="hide-sm">Zahlung</th><th class="hide-sm">Nächster Schritt</th><th class="num">Betrag CHF</th></tr></thead><tbody>' +
      rows.map(function (o, i) {
        return '<tr class="' + (o.action ? 'needs ' : '') + (i === S.orderSel ? 'sel' : '') + '" data-href="' + U.href('order', { id: String(o.id) }) + '" data-row="' + i + '"><td><span class="order-id">#' + o.id + '</span></td><td class="mono">' + o.time + '</td><td class="hide-sm"><span class="channel">' + icon(CH_ICON[o.channel]) + o.channel + '</span></td><td>' + esc(o.where) + '<span class="table-secondary">' + esc(o.guest) + '</span></td><td class="hide-md"><span class="positions" title="' + esc(positions(o)) + '">' + esc(positions(o)) + '</span></td><td>' + pill(o) + '</td><td class="hide-sm">' + payCell(o) + '</td><td class="hide-sm">' + nextAction(o) + '</td><td class="num mono">' + num(o.total) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      (rows.length ? '' : '<div class="empty-result">' + icon('search', '') + '<p style="margin:10px 0 14px">Keine Bestellung für diese Auswahl.</p>' + button('Filter zurücksetzen', 'orders-reset', 'small') + '</div>') + '</div>' +
      '<div class="table-foot"><span>' + rows.length + ' Bestellungen · Summe <strong class="mono" style="color:var(--ink)">' + chf(sum) + '</strong></span><span>Inkl. MWST 8.1 % im Haus und 2.6 % Take-away · neueste ' + D.orders.length + ' von ' + D.day.orders + ' heute</span></div>';
  }
  function ordersTabs() {
    var all = C.orders();
    return TABS.map(function (t) { return '<button class="tab' + (S.orderTab === t[0] ? ' active' : '') + '" role="tab" aria-selected="' + (S.orderTab === t[0]) + '" data-order-tab="' + t[0] + '">' + t[1] + '<span class="count">' + all.filter(t[2]).length + '</span></button>'; }).join('');
  }
  function orders() {
    return pageHead('02 / Verkauf', 'Bestellungen', 'Alles, was heute über den Pass geht.', button('Exportieren', 'orders-export', '', 'download') + button('Neue Bestellung <kbd>N</kbd>', 'new-order', 'primary', 'plus')) +
      '<nav class="tabs" role="tablist" id="order-tabs" aria-label="Status">' + ordersTabs() + '</nav>' +
      '<div class="toolbar"><div class="control-group"><label class="search">' + icon('search') + '<input id="order-search" aria-label="Bestellungen durchsuchen" placeholder="Nummer, Tisch oder Gericht" value="' + esc(S.orderQuery) + '"><kbd>/</kbd></label>' +
        '<div class="seg" role="group" aria-label="Kanal">' + ['Alle', 'Kasse', 'Tisch-QR', 'Abholung', 'Lieferung'].map(function (c) { return '<button aria-pressed="' + (S.orderChannel === c) + '" data-channel="' + c + '">' + (CH_ICON[c] ? icon(CH_ICON[c]) : '') + c + '</button>'; }).join('') + '</div></div>' +
        '<span class="row gap6 small muted hide-sm"><kbd>J</kbd><kbd>K</kbd> wählen <kbd>↵</kbd> öffnen</span></div>' +
      '<section class="plain-surface" id="orders-region">' + ordersTable() + '</section>';
  }

  /* ================= ORDER DETAIL ================= */
  function order() {
    var id = Number(C.query.get('id')) || 1048, raw = D.orders.filter(function (o) { return o.id === id; })[0] || D.orders[1], o = C.orderOf(raw), v = C.vatOf(o);
    var lines = o.items.map(function (it) { var m = C.menuById[it[0]]; return '<div class="receipt-item"><span class="quantity">' + it[1] + '×</span><div><h3>' + m.name + '</h3><p>' + m.note + ' · ' + m.allergens + '</p></div><span class="mono">' + chf(m.price * it[1]) + '</span></div>'; }).join('');
    var steps = [['Bestellung aufgenommen', o.time + ' · ' + (o.by || o.channel), true], ['In der Küche', 'Bons an Küche und Bar gesendet', o.status !== 'neu' && o.status !== 'storniert'], [o.takeaway ? 'Bereit zur Übergabe' : 'Serviert', o.takeaway ? 'Am Pass' : 'Alle Gänge am Tisch', ['bereit', 'serviert', 'unterwegs', 'bezahlt', 'fakturiert', 'erstattet'].indexOf(o.status) >= 0], ['Bezahlt', o.pay ? o.pay : 'Noch keine Zahlung', o.status === 'bezahlt' || o.status === 'erstattet']];
    var paid = o.status === 'bezahlt' || o.status === 'erstattet';
    return pageHead('02 / Bestellungen / #' + o.id, esc(o.where), 'Bestellung #' + o.id + ' · ' + o.time + ' · ' + o.channel + ' · ' + esc(o.guest), link('orders', icon('back') + 'Bestellungen', 'button')) +
      (o.action ? '<div class="notice warn page-notice">' + icon('warning') + '<div><strong>Nächster Schritt: ' + o.action + '</strong><small>' + esc(o.why || '') + '</small></div><div class="notice-actions">' + '<button class="button primary small" data-order-action="' + o.id + '">' + icon(ACTION_ICON[o.action]) + o.action + '</button></div></div>' : '') +
      '<div class="two-col"><section class="plain-surface"><div class="surface-title between"><div><h2>' + o.items.reduce(function (t, it) { return t + it[1]; }, 0) + ' Positionen</h2><p class="small muted" style="margin-top:4px">' + (o.by ? 'Aufgenommen von ' + o.by : 'Eingang über ' + o.channel) + '</p></div>' + pill(o) + '</div><div style="padding:4px 22px 20px">' + lines +
        '<div class="summary-line" style="padding-top:20px"><span class="muted">Nettobetrag</span><span class="mono">' + chf(o.total - v.v81 - v.v26) + '</span></div>' +
        (v.g81 ? '<div class="summary-line"><span class="muted">MWST 8.1 % auf ' + chf(v.g81) + '</span><span class="mono">' + chf(v.v81) + '</span></div>' : '') +
        (v.g26 ? '<div class="summary-line"><span class="muted">MWST 2.6 % auf ' + chf(v.g26) + ' (Take-away)</span><span class="mono">' + chf(v.v26) + '</span></div>' : '') +
        '<div class="between" style="padding-top:18px"><h2>Total</h2><strong class="mono" style="font-size:26px">' + chf(o.total) + '</strong></div></div></section>' +
      '<div class="stack"><section class="surface">' + sectionTitle('01', 'Verlauf') + '<div class="timeline">' + steps.map(function (s) { return '<div class="' + (s[2] ? 'done' : '') + '"><strong>' + s[0] + '</strong><small>' + s[1] + '</small></div>'; }).join('') + '</div></section>' +
        '<section class="surface">' + sectionTitle('02', 'Zahlung') + '<div class="summary-line"><span>Zahlungsart</span><strong>' + (o.pay || 'noch offen') + '</strong></div><div class="summary-line"><span>Status</span>' + (paid ? badge(o.status === 'erstattet' ? 'Rückerstattet' : 'Bezahlt', o.status === 'erstattet' ? 'warn' : 'good') : badge('Offen', 'outline')) + '</div>' +
          '<div class="row wrap" style="margin-top:14px">' + (paid || o.status === 'storniert' ? '' : button('Zahlung erfassen', 'payment', 'primary', 'card', 'data-id="' + o.id + '"')) + button('Beleg drucken', 'print', 'text', 'print') + '</div></section>' +
        '<div class="notice">' + icon('help') + '<div>Änderungen werden im Verlauf festgehalten.<small>Korrekturen nach dem Abschluss erscheinen als separate Buchung.</small></div></div></div></div>';
  }

  /* ================= MENU ================= */
  var CATS = ['Alle', 'Vorspeisen', 'Hauptgerichte', 'Desserts', 'Getränke'];
  function menuRows() {
    var q = S.menuQuery.toLowerCase();
    return D.menu.map(function (m) { return C.menuItem(m.id); }).filter(function (m) { return (S.menuCat === 'Alle' || m.cat === S.menuCat) && (!q || (m.name + ' ' + m.note + ' ' + m.allergens).toLowerCase().indexOf(q) >= 0); });
  }
  function menuTable() {
    var rows = menuRows();
    return '<table aria-label="Artikel"><thead><tr><th>Artikel</th><th class="hide-md">Allergene</th><th class="num">Preis</th><th class="hide-sm">MWST Haus / Take-away</th><th class="num hide-sm">Heute</th><th class="num">Verfügbar</th></tr></thead><tbody>' +
      rows.map(function (m) {
        var so = !!S.soldout[m.id];
        return '<tr class="' + (S.menuSel === m.id ? 'selected ' : '') + (so ? 'soldout' : '') + '"><td><a href="#" class="item-title" data-menu-edit="' + m.id + '">' + esc(m.name) + '</a><span class="table-secondary">' + m.cat + ' · ' + esc(m.note) + '</span></td><td class="hide-md small muted">' + esc(m.allergens) + '</td><td class="num mono nowrap">' + chf(m.price) + '</td><td class="hide-sm mono">' + (m.vat === 'alcohol' ? '8.1 / 8.1 %' : '8.1 / 2.6 %') + '</td><td class="num mono hide-sm">' + m.sold + '</td><td class="num"><button class="switch" role="switch" aria-label="' + esc(m.name) + ' verfügbar" aria-checked="' + !so + '" data-soldout="' + m.id + '"></button></td></tr>';
      }).join('') + '</tbody></table>' + (rows.length ? '' : '<div class="empty-result">Keine Artikel gefunden.</div>');
  }
  function editor() {
    var m = S.menuSel ? C.menuItem(S.menuSel) : null;
    if (!m) return '<section class="plain-surface editor"><div class="editor-head"><div><h2>Artikel bearbeiten</h2><p class="small muted" style="margin-top:4px">Einen Artikel in der Liste wählen oder neu anlegen.</p></div></div><div class="editor-body"><div class="state" style="border:0;min-height:200px">' + icon('menu') + '<h3>Nichts gewählt.</h3><p>Preise, Allergene und MWST werden hier gepflegt.</p>' + button('Artikel hinzufügen', 'add-menu', 'small', 'plus') + '</div></div></section>';
    var allergens = ['Gluten', 'Milch', 'Ei', 'Fisch', 'Schalenfrüchte', 'Sellerie', 'Senf', 'Sulfite'];
    return '<form class="plain-surface editor" id="menu-form"><div class="editor-head"><div><div class="eyebrow" style="margin-bottom:6px">Artikel bearbeiten</div><h2>' + esc(m.name) + '</h2></div><button type="button" class="icon-button" data-action="menu-close" aria-label="Editor schliessen">' + icon('close') + '</button></div>' +
      '<div class="editor-body">' + field('Name', '<input id="item-name" value="' + esc(m.name) + '" required>') +
      '<div class="form-grid">' + field('Kategorie', '<select id="item-category">' + CATS.slice(1).map(function (c) { return '<option ' + (c === m.cat ? 'selected' : '') + '>' + c + '</option>'; }).join('') + '</select>') + field('Preis in CHF', '<input id="item-price" type="number" min="0" step="0.05" value="' + m.price.toFixed(2) + '">') + '</div>' +
      field('Beschreibung', '<input id="item-note" value="' + esc(m.note) + '">') +
      '<div><div class="small" style="margin-bottom:7px">Allergene</div><div class="chips">' + allergens.map(function (a) { return '<button type="button" class="chip" data-chip aria-pressed="' + (m.allergens.indexOf(a) >= 0) + '">' + a + '</button>'; }).join('') + '</div></div>' +
      field('MWST', '<select id="item-vat"><option value="food" ' + (m.vat === 'food' ? 'selected' : '') + '>Speisen und alkoholfrei: Haus 8.1 %, Take-away 2.6 %</option><option value="alcohol" ' + (m.vat === 'alcohol' ? 'selected' : '') + '>Alkohol: immer 8.1 %</option></select>') +
      '<label class="checkbox"><input type="checkbox" id="item-avail" ' + (S.soldout[m.id] ? '' : 'checked') + '>Heute verfügbar</label></div>' +
      '<div class="editor-foot">' + button('Abbrechen', 'menu-close') + button('Speichern', 'save-menu', 'primary', 'check') + '</div></form>';
  }
  function menu() {
    var counts = { 'Alle': D.menu.length };
    D.menu.forEach(function (m) { counts[m.cat] = (counts[m.cat] || 0) + 1; });
    return pageHead('03 / Angebot', 'Speisekarte', 'Herbstkarte 2026, gilt für Service, Tisch-QR und Take-away.', button('Artikel hinzufügen <kbd>N</kbd>', 'add-menu', 'primary', 'plus')) +
      '<div class="toolbar"><label class="search">' + icon('search') + '<input id="menu-search" placeholder="Artikel suchen" aria-label="Artikel suchen" value="' + esc(S.menuQuery) + '"></label><span class="small muted">' + Object.keys(S.soldout).filter(function (k) { return S.soldout[k]; }).length + ' ausverkauft · ' + D.menu.length + ' Artikel in dieser Vorschau</span></div>' +
      '<div class="category-strip">' + CATS.map(function (c) { return '<button class="' + (c === S.menuCat ? 'active' : '') + '" data-menu-cat="' + c + '">' + c + '<span>' + (counts[c] || 0) + '</span></button>'; }).join('') + '</div>' +
      '<div class="menu-layout"><section class="plain-surface" id="menu-table">' + menuTable() + '</section><div class="stack">' + editor() +
      '<section class="surface">' + sectionTitle('01', 'Optionen') + '<div class="summary-line"><div>Beilage wählen<span class="table-secondary">Rösti, Pommes frites, Saisongemüse</span></div>' + badge('1 Pflicht', 'outline') + '</div><div class="summary-line"><div>Zum Risotto<span class="table-secondary">Ohne Parmesan, extra Pilze CHF 4.00</span></div>' + badge('Optional', 'outline') + '</div></section></div></div>';
  }

  /* ================= PLANNING ================= */
  var AREAS = ['Alle', 'Service', 'Bar', 'Küche', 'Abwasch'];
  var AREA_CLS = { Service: 'service', Bar: 'bar', 'Küche': 'kitchen', Abwasch: 'dish' };
  var weekStart = function () { return 19 + S.week * 7; };
  function dateOf(d) { return new Date(2026, 9, weekStart() + d); }
  function weekLabel() {
    var a = dateOf(0), b = dateOf(6), mo = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return a.getMonth() === b.getMonth() ? a.getDate() + '. bis ' + b.getDate() + '. ' + mo[a.getMonth()] + ' 2026' : a.getDate() + '. ' + mo[a.getMonth()] + ' bis ' + b.getDate() + '. ' + mo[b.getMonth()] + ' 2026';
  }
  function holiday(d) { var x = dateOf(d); return x.getMonth() === 10 && x.getDate() === 1 ? 'Allerheiligen (SG)' : ''; }
  function shiftBtn(i, d, compactRole) {
    var s = C.shiftOf(i, d), p = D.staff[i], w = C.warnings().filter(function (x) { return x.person === i && x.day === d; })[0];
    var label = p.name + ', ' + D.dayLong[d];
    if (s === 'F') return '<button class="shift absent" data-shift="' + i + '-' + d + '" aria-label="' + label + ', Ferien">Ferien</button>';
    if (!C.isWork(s)) return '<button class="shift off" data-shift="' + i + '-' + d + '" aria-label="' + label + ', frei. Schicht hinzufügen"><span>frei</span></button>';
    var cls = AREA_CLS[p.area] + (w ? ' ' + w.kind : '') + (C.changed(i, d) ? ' changed' : '');
    var open = D.openShifts.filter(function (o) { return S.assigned[o.key] === i && o.day === d; })[0];
    return '<button class="shift ' + cls + '" data-shift="' + i + '-' + d + '" aria-label="' + label + ', ' + C.range(s) + (w ? ', Hinweis: ' + w.short : '') + '"><span class="t"><span class="long">' + C.range(s) + '</span><span class="short">' + C.rangeShort(s) + '</span></span><span class="r">' +
      (w ? (w.kind === 'bad' ? '! ' : '') + w.short : tag(p.tag) + '<span class="rl">' + (open ? 'Übernommen' : C.changed(i, d) ? 'Geändert' : C.hl(C.net(s))) + '</span>') + '</span></button>';
  }
  function personCell(i) {
    var p = D.staff[i], h = C.personHours(i), pct = Math.min(100, h / p.target * 100), over = h > p.target + 0.01, under = h < p.target * 0.6;
    return '<div class="person"><span class="avatar">' + p.ini + '</span>' + link('profile', p.name, '', { person: String(i) }) + '<span class="meta">' + tag(p.tag) + p.pensum + '</span>' +
      '<div class="hours" title="' + hl(h) + ' geplant, Soll ' + hl(p.target) + '"><div class="hours-bar"><i class="' + (over ? 'over' : under ? 'under' : '') + '" style="width:' + pct + '%"></i></div><span class="' + (over ? 'over' : '') + '">' + num(h, 1) + ' / ' + num(p.target, 1) + '</span></div></div>';
  }
  function strip(d, withNote) {
    var cv = C.coverage(d);
    var html = '<div class="strip" role="img" aria-label="Abdeckung ' + D.dayLong[d] + ': ' + (cv.gaps.length ? cv.gaps.map(function (g) { return 'Lücke ' + C.range(g); }).join(', ') : 'abgedeckt') + '">' + cv.slots.map(function (s) { return '<i class="' + s.st + '" title="' + hm(s.t) + ': ' + s.have + ' geplant, ' + s.need + ' benötigt"></i>'; }).join('') + '</div>';
    if (withNote) html += '<span class="strip-note ' + (cv.gaps.length ? 'gap' : '') + '">' + (cv.gaps.length ? cv.gaps.length + ' Lücke ' + cv.gaps.map(C.rangeShort).join(', ') : 'Abgedeckt') + '</span>';
    return html;
  }
  function rotaGrid() {
    var order = [];
    AREAS.slice(1).forEach(function (a) { D.staff.forEach(function (p, i) { if (p.area === a) order.push(i); }); });
    var show = function (area) { return S.area === 'Alle' || S.area === area; };
    var head = '<div class="rota-grid rota-head"><div><strong style="color:var(--ink);font-size:13px">Team</strong><span>Umsatz CHF</span><span>Personal CHF · Quote</span></div>' + D.dayNames.map(function (n, d) {
      var cost = C.dayCost(d), q = cost / D.forecast[d] * 100, today = S.week === 0 && d === 4, hol = holiday(d);
      return '<div class="' + (today ? 'today' : '') + '"><a class="day-link" href="' + U.href('day', { day: String(d) }) + '">' + n + ' <strong>' + dateOf(d).getDate() + '</strong>' + (today ? '<span class="small">Heute</span>' : '') + '</a>' +
        '<span class="money" title="Umsatzprognose CHF ' + num(D.forecast[d], 0) + '"><b>' + num(D.forecast[d], 0) + '</b></span><span class="money" title="Personalkosten CHF ' + num(cost, 0) + ', Quote ' + num(q, 1) + ' %">' + num(cost, 0) + ' · <b class="' + (q > 32 ? 'warn-text' : '') + '">' + num(q, 0) + '%</b></span>' + (hol ? '<span class="holiday">' + hol + '</span>' : '') + '</div>';
    }).join('') + '</div>';
    var cover = '<div class="rota-grid rota-cover"><div><strong>Abdeckung</strong><small>je halbe Stunde, 9 bis 24 Uhr</small></div>' + D.dayNames.map(function (_, d) { return '<div>' + strip(d, true) + '</div>'; }).join('') + '</div>';
    var openShown = D.openShifts.filter(function (o) { return show(o.area); });
    var openRow = '<div class="rota-grid rota-row open-row" id="offen"><div class="person" style="grid-template-columns:1fr"><strong style="font-size:13px">Offene Schichten</strong><span class="meta" style="white-space:normal">' + C.openLeft().length + ' ausgeschrieben, das Team kann sie in der App übernehmen</span></div>' + D.dayNames.map(function (_, d) {
      var here = openShown.filter(function (o) { return o.day === d; });
      return '<div class="cell">' + here.map(function (o) {
        var taken = S.assigned[o.key] !== undefined;
        return '<button class="shift open' + (taken ? ' claimed' : '') + '" data-open="' + o.key + '" aria-label="Offene Schicht ' + D.dayLong[d] + ' ' + C.range([o.start, o.end]) + ', ' + o.area + '"><span class="t"><span class="long">' + C.range([o.start, o.end]) + '</span><span class="short">' + C.rangeShort([o.start, o.end]) + '</span></span><span class="r">' + tag(o.tag) + '<span>' + (taken ? C.first(S.assigned[o.key]) : 'Offen') + '</span></span></button>';
      }).join('') + '</div>';
    }).join('') + '</div>';
    var body = '';
    AREAS.slice(1).forEach(function (a) {
      var ids = order.filter(function (i) { return D.staff[i].area === a; });
      if (!show(a)) return;
      var hrs = ids.reduce(function (t, i) { return t + C.personHours(i); }, 0);
      body += '<div class="rota-group"><strong>' + a + '</strong><span>' + ids.length + (ids.length === 1 ? ' Person' : ' Personen') + ' · ' + hl(hrs) + '</span></div>';
      ids.forEach(function (i) { body += '<div class="rota-grid rota-row">' + personCell(i) + D.dayNames.map(function (_, d) { return '<div class="cell' + (S.week === 0 && d === 4 ? ' today' : '') + '">' + shiftBtn(i, d) + '</div>'; }).join('') + '</div>'; });
    });
    var total = '<div class="rota-grid rota-total"><div>Netto, 30 Min. Pause</div>' + D.dayNames.map(function (_, d) { return '<div>' + hl(C.dayHours(d)) + '<small>' + C.dayCount(d) + ' Personen</small></div>'; }).join('') + '</div>';
    return '<div class="rota" role="region" aria-label="Wochenplan, 14 Personen mal 7 Tage">' + head + cover + openRow + body + total + '</div>';
  }
  function rotaMobile() {
    var d = S.mobDay;
    return '<div class="rota-mobile"><div class="mob-days" role="tablist">' + D.dayNames.map(function (n, i) { return '<button class="' + (i === d ? 'active' : '') + '" data-mobday="' + i + '" role="tab" aria-selected="' + (i === d) + '">' + n + '<strong>' + dateOf(i).getDate() + '</strong></button>'; }).join('') + '</div>' +
      '<div class="mob-row" style="display:block">' + strip(d, true) + '</div>' +
      D.staff.map(function (p, i) { return '<div class="mob-row"><span class="avatar">' + p.ini + '</span>' + link('profile', p.name + '<small>' + p.area + ' · ' + p.pensum + '</small>', '', { person: String(i) }) + shiftBtn(i, d) + '</div>'; }).join('') + '</div>';
  }
  function planningBanner() {
    var wc = C.warnCounts();
    if (!wc.all.length) return '<div class="notice good">' + icon('check') + '<div><strong>Keine Regelverstösse und keine Warnungen.</strong><small>Ruhezeit, Wochenstunden und Verfügbarkeit sind geprüft.</small></div></div>';
    return '<div class="notice ' + (wc.bad ? 'bad' : 'warn') + '" id="plan-banner">' + icon('warning') + '<div><strong>Vor dem Veröffentlichen: ' + wc.bad + (wc.bad === 1 ? ' Regelverstoss' : ' Regelverstösse') + ', ' + wc.warn + ' Warnung' + (wc.warn === 1 ? '' : 'en') + '</strong><small>' + wc.all.map(function (w) { return w.summary; }).join(' · ') + '</small></div><div class="notice-actions">' + button('Prüfen', 'conflicts', 'small') + '</div></div>';
  }
  function coverageMini() {
    var planned = [], needed = [];
    for (var h = 15; h <= 22; h++) { planned.push(Math.round((C.coverage(4).slots[(h - C.SLOT0) * 2].have))); needed.push(Math.max(C.coverage(4).slots[(h - C.SLOT0) * 2].need, 0)); }
    var max = 14;
    return '<div class="coverage-mini" role="img" aria-label="Freitag, Personen pro Stunde, benötigt und geplant">' + planned.map(function (n, i) { var gap = n < needed[i]; return '<div class="coverage-col ' + (gap ? 'gap' : '') + '"><i style="height:' + (needed[i] / max * 100) + '%"></i><i style="height:' + (n / max * 100) + '%"></i><small>' + (15 + i) + '</small></div>'; }).join('') + '</div>' +
      '<div class="legend"><span class="legend-item"><i class="legend-box" style="background:var(--neutral-fill)"></i>Benötigt</span><span class="legend-item"><i class="legend-box" style="background:var(--signal)"></i>Geplant</span><span>Personen pro Stunde</span></div>';
  }
  function planning() {
    var wc = C.warnCounts(), wk = 43 + S.week, left = C.openLeft();
    var cost = C.weekCost(), fc = C.weekForecast(), q = cost / fc * 100;
    return pageHead('04 / Team & Planung', 'Zusammen geplant.', '14 Menschen. Ein verlässlicher Service.', button('Schicht hinzufügen <kbd>N</kbd>', 'add-shift', '', 'plus') + button(S.published ? 'Veröffentlicht' : 'Plan veröffentlichen', 'publish', 'primary', S.published ? 'check' : 'send')) +
      U.teamTabs() +
      '<div class="toolbar"><div class="week-nav"><button class="icon-button" data-action="week-prev" aria-label="Vorherige Woche">' + icon('left') + '</button><strong>' + weekLabel() + '</strong><button class="icon-button" data-action="week-next" aria-label="Nächste Woche">' + icon('chevron') + '</button><span class="mono small muted">KW ' + wk + '</span></div>' +
        '<div class="row gap6">' + badge(S.published ? 'Veröffentlicht' : 'Entwurf', S.published ? 'good' : 'outline') + (C.changeCount() ? badge(C.changeCount() + ' Änderungen seit Veröffentlichung', 'warn dot') : '') + button('Heute', 'week-today', 'small') + '</div></div>' +
      '<div class="planning-stats">' +
        '<div class="planning-stat"><div class="label">Geplante Personalkosten</div><div class="value">' + chf(cost, 0) + '<span>/ Woche</span></div><div class="note">' + hl(C.weekHours()) + ' netto, inkl. Arbeitgeberkosten</div></div>' +
        '<div class="planning-stat"><div class="label">Erwarteter Umsatz</div><div class="value">' + chf(fc, 0) + '</div><div class="note">Vergleichswochen und Reservationen</div></div>' +
        '<div class="planning-stat"><div class="label">Personalkostenquote</div><div class="value">' + num(q, 1) + '<span>%</span></div><div class="note">' + (q >= 27 && q <= 30 ? '<span class="positive">Im Zielkorridor</span>' : '<span class="warn-text">Ausserhalb Ziel</span>') + ' · 27 bis 30 %</div></div>' +
        '<div class="planning-stat"><div class="label">Regeln und Lücken</div><div class="value">' + wc.bad + '<span>Verstoss</span> ' + wc.warn + '<span>Warnungen</span></div><div class="counts">' + badge(left.length + (left.length === 1 ? ' offene Schicht' : ' offene Schichten'), left.length ? 'accent' : 'good') + badge(D.dayNames.reduce(function (t, _, d) { return t + C.coverage(d).gaps.length; }, 0) + ' Lücke' + (D.dayNames.reduce(function (t, _, d) { return t + C.coverage(d).gaps.length; }, 0) === 1 ? '' : 'n'), 'outline') + '</div></div>' +
      '</div>' + planningBanner() +
      '<div class="rota-tools"><div class="seg" role="group" aria-label="Bereich filtern">' + AREAS.map(function (a) { return '<button aria-pressed="' + (S.area === a) + '" data-area="' + a + '">' + a + '</button>'; }).join('') + '</div>' +
        '<div class="rota-legend"><span>' + tag('SL') + 'Schichtleitung</span><span>' + tag('SV') + 'Service</span><span>' + tag('BA') + 'Bar</span><span>' + tag('KÜ') + 'Küche</span><span>' + tag('AW') + 'Abwasch</span><span><i class="legend-box" style="background:var(--good-fill)"></i>gedeckt</span><span><i class="legend-box" style="background:var(--bad-fill)"></i>Lücke</span></div></div>' +
      rotaGrid() + rotaMobile() +
      '<p class="legal-note">Klick auf eine Schicht zum Bearbeiten, auf einen leeren Tag zum Hinzufügen. Gestrichelte Kante: geändert seit der letzten Veröffentlichung.</p>' +
      '<div class="planning-bottom"><section class="surface">' + sectionTitle('01', 'Freitag im Stundenverlauf', link('day', 'Tagesansicht ' + icon('arrow'), 'view-all-link', { day: '4' })) + coverageMini() +
        (C.coverage(4).gaps.length ? '<div class="notice warn" style="margin-top:22px">' + icon('warning') + '<div><strong>' + C.coverage(4).gaps.map(C.range).join(', ') + ' fehlt eine Person im Service.</strong><small>Für 54 erwartete Gäste sind 6 Personen nötig, geplant sind 5.</small></div></div>' : '') + '</section>' +
        '<section class="surface">' + sectionTitle('02', 'Zusätzliche Schichten', badge(left.length + ' offen', left.length ? 'outline' : 'good')) +
          D.openShifts.map(function (o) { var t = S.assigned[o.key]; return '<div class="open-shift"><div class="date-tile">' + D.dayNames[o.day].toUpperCase() + '<strong>' + dateOf(o.day).getDate() + '</strong></div><div><h3>' + o.title + '</h3><p>' + C.range([o.start, o.end]) + ' · ' + (o.end - o.start) + ' h · ' + o.where + '</p>' + (t !== undefined ? '<p class="positive">' + D.staff[t].name + ', zugewiesen</p>' : '') + '</div>' + button(t !== undefined ? 'Ändern' : 'Besetzen', 'assign', 'small', '', 'data-key="' + o.key + '"') + '</div>'; }).join('') +
          '<div class="notice" style="margin-top:14px">' + icon('calendar') + '<div>Nächster Feiertag in St. Gallen<small>Allerheiligen, Sonntag, 1. November 2026</small></div></div></section></div>';
  }

  /* ================= DAY ================= */
  function day() {
    var d = Math.min(6, Math.max(0, Number(C.query.get('day') || 4))), cv = C.coverage(d), cost = C.dayCost(d), scale = D.forecast[d] / 8600;
    var guests = [12, 18, 26, 20, 8, 10, 26, 42, 54, 46, 24, 12, 6, 0].map(function (g, i) { return cv.slots[Math.min(29, (2 + i) * 2)].have ? Math.round(g * scale) : 0; });
    var rows = D.staff.map(function (p, i) { return { p: p, i: i, s: C.shiftOf(i, d) }; }).filter(function (r) { return C.isWork(r.s); });
    var hours = []; for (var h = 9; h < 24; h++) hours.push(h);
    var maxG = 60;
    var chart = '<div class="coverage-chart"><svg viewBox="0 0 1000 255" role="img" aria-label="Gäste im Haus und Personen im Einsatz pro Stunde">' +
      [0, 20, 40, 60].map(function (n) { return '<path class="chart-grid" d="M50 ' + (215 - n * 3) + 'H951"/><text class="chart-label" x="12" y="' + (219 - n * 3) + '">' + n + '</text>'; }).join('') +
      guests.map(function (g, i) { return '<rect x="' + (57 + i * 66) + '" y="' + (215 - g * 3) + '" width="36" height="' + (g * 3) + '" fill="var(--tint-strong)"/><text class="chart-label" x="' + (60 + i * 66) + '" y="240">' + (11 + i) + ':00</text>'; }).join('') +
      '<path class="chart-prev" d="' + guests.map(function (_, i) { return (i ? 'L' : 'M') + (75 + i * 66) + ' ' + (215 - cv.slots[Math.min(29, (11 + i - 9) * 2)].need * 180 / 15); }).join('') + '"/>' +
      '<path class="chart-line" d="' + guests.map(function (_, i) { return (i ? 'L' : 'M') + (75 + i * 66) + ' ' + (215 - cv.slots[Math.min(29, (11 + i - 9) * 2)].have * 180 / 15); }).join('') + '"/>' +
      [0, 5, 10, 15].map(function (n) { return '<text class="chart-label" x="962" y="' + (219 - n * 12) + '">' + n + '</text>'; }).join('') + '<text class="chart-label" x="12" y="12">GÄSTE IM HAUS</text><text class="chart-label" x="826" y="12">PERSONEN, RECHTS</text></svg></div>';
    return pageHead('04 / Team & Planung', D.dayLong[d] + ' im Detail.', dateOf(d).getDate() + '. ' + (dateOf(d).getMonth() === 9 ? 'Oktober' : 'November') + ', ' + num(D.forecast[d] / 51.2, 0) + ' erwartete Gäste', button('Schicht hinzufügen <kbd>N</kbd>', 'add-shift', 'primary', 'plus', 'data-day="' + d + '"')) + U.teamTabs() +
      '<div class="toolbar"><div class="seg" role="group" aria-label="Tag wählen">' + D.dayNames.map(function (n, i) { return '<a href="' + U.href('day', { day: String(i) }) + '" aria-pressed="' + (i === d) + '"' + (i === d ? ' aria-current="page"' : '') + '>' + n + ' ' + dateOf(i).getDate() + '</a>'; }).join('') + '</div></div>' +
      '<div class="planning-stats"><div class="planning-stat"><div class="label">Umsatzprognose</div><div class="value">' + chf(D.forecast[d], 0) + '</div><div class="note">Reservationen und Vergleichstage</div></div>' +
        '<div class="planning-stat"><div class="label">Geplante Stunden</div><div class="value">' + hl(C.dayHours(d)) + '</div><div class="note">' + C.dayCount(d) + ' Personen im Tagesverlauf</div></div>' +
        '<div class="planning-stat"><div class="label">Personalkosten</div><div class="value">' + chf(cost, 0) + '</div><div class="note">' + num(cost / D.forecast[d] * 100, 1) + ' % vom Umsatz</div></div>' +
        '<div class="planning-stat"><div class="label">Unterdeckung</div><div class="value ' + (cv.gaps.length ? 'negative' : 'positive') + '">' + cv.gaps.length + '<span>' + (cv.gaps.length ? cv.gaps.map(C.rangeShort).join(', ') + ' Uhr' : 'Lücken') + '</span></div><div class="note">Halbstündlich, alle Bereiche</div></div></div>' +
      '<section class="surface" style="margin-bottom:20px">' + sectionTitle('01', 'Abdeckung je halbe Stunde', badge(cv.gaps.length ? cv.gaps.length + ' Lücke' : 'Abgedeckt', cv.gaps.length ? 'bad dot' : 'good dot')) + '<div class="day-strip"><span class="muted">Alle Bereiche</span><div>' + strip(d) + '<div class="strip-axis"><span>09:00</span><span>12:00</span><span>15:00</span><span>18:00</span><span>21:00</span><span>24:00</span></div></div></div></section>' +
      '<section class="surface">' + sectionTitle('02', 'Gäste und Besetzung', badge('Prognose', 'outline')) + '<div class="legend"><span class="legend-item"><i class="legend-box" style="background:var(--tint-strong)"></i>Gleichzeitige Gäste</span><span class="legend-item"><i class="legend-line"></i>Geplant</span><span class="legend-item"><i class="legend-line dashed"></i>Benötigt</span></div>' + chart + '</section>' +
      (cv.gaps.length ? '<div class="notice warn" style="margin:20px 0">' + icon('warning') + '<div><strong>' + cv.gaps.map(C.range).join(', ') + ': eine Person zu wenig</strong><small>Offene Schicht ausschreiben oder eine bestehende Schicht verlängern.</small></div><div class="notice-actions">' + button('Offene Schicht erstellen', 'add-shift', 'small', '', 'data-day="' + d + '"') + '</div></div>' : '<div style="height:20px"></div>') +
      '<section class="plain-surface"><div class="surface-title">' + sectionTitle('03', 'Alle Schichten am ' + D.dayLong[d], link('planning', 'Zum Wochenplan ' + icon('arrow'), 'view-all-link')) + '</div><div class="table-wrap"><div class="timeline-roster" style="min-width:760px"><div class="muted tl-name">Team</div>' + hours.map(function (h) { return '<div class="hour">' + String(h).padStart(2, '0') + ':00</div>'; }).join('') +
        rows.map(function (r) { return '<div class="tl-name" style="grid-column:1">' + tag(r.p.tag) + r.p.name + '</div><div class="period ' + AREA_CLS[r.p.area] + '" style="grid-column:' + (Math.floor(r.s[0]) - 7) + '/' + (Math.ceil(r.s[1]) - 7) + '">' + C.range(r.s) + '</div>'; }).join('') + '</div></div></section>';
  }

  /* ================= TEAM + PROFILE ================= */
  function team() {
    return pageHead('04 / Team & Planung', 'Menschen im Mittelpunkt.', '14 Mitarbeitende, Verträge nach L-GAV.', button('Person einladen', 'invite', 'primary', 'plus')) + U.teamTabs() +
      '<section class="plain-surface"><div class="table-wrap"><table><thead><tr><th>Name</th><th>Bereich</th><th class="hide-sm">Pensum</th><th class="hide-md">Lohnklasse</th><th>Woche / Soll</th><th class="hide-sm">App</th><th></th></tr></thead><tbody>' +
      D.staff.map(function (p, i) { var h = C.personHours(i), over = h > p.target + 0.01; return '<tr><td><div class="row" style="gap:10px"><span class="avatar">' + p.ini + '</span><div>' + link('profile', p.name, 'table-link', { person: String(i) }) + '<span class="table-secondary">' + p.title + '</span></div></div></td><td><span class="row gap6">' + tag(p.tag) + p.area + '</span></td><td class="hide-sm">' + p.pensum + '</td><td class="hide-md">' + p.cls + '</td><td style="min-width:170px"><div class="hours" style="grid-template-columns:90px auto"><div class="hours-bar"><i class="' + (over ? 'over' : '') + '" style="width:' + Math.min(100, h / p.target * 100) + '%"></i></div><span class="' + (over ? 'over' : '') + '">' + num(h, 1) + ' / ' + num(p.target, 1) + ' h</span></div></td><td class="hide-sm">' + (i === 7 || i === 12 ? badge('Eingeladen', 'outline') : badge('Aktiv', 'good')) + '</td><td class="num">' + link('profile', icon('chevron'), 'table-link', { person: String(i) }, 'aria-label="Profil ' + p.name + '"') + '</td></tr>'; }).join('') +
      '</tbody></table></div></section>';
  }
  var AVAIL_DEFAULT = ['11 bis 24', '11 bis 24', '11 bis 24', '11 bis 24', '11 bis 24', '9 bis 24', '9 bis 22'];
  function profile() {
    var i = Math.min(13, Math.max(0, Number(C.query.get('person') || 4))), p = D.staff[i], h = C.personHours(i);
    var pct = parseFloat(p.pensum) || null, wage = pct ? 4528 * pct / 100 : null;
    var avail = D.dayNames.map(function (n, d) { var k = i + '-' + d; if (k in D.availability) { var a = D.availability[k]; return [n, a ? 'ab ' + a[0] : 'frei', !!a]; } return [n, AVAIL_DEFAULT[d], true]; });
    var w = C.warnings().filter(function (x) { return x.person === i; });
    return pageHead('04 / Team / ' + p.name, p.name, p.title + ' · Personalnummer ' + String(i + 1).padStart(3, '0'), link('team', icon('back') + 'Team', 'button') + button('Profil bearbeiten', 'edit-profile', 'primary', 'edit')) + U.teamTabs() +
      '<div class="two-col"><div class="stack"><section class="plain-surface"><div class="profile-hero"><div class="profile-avatar">' + p.ini + '</div><div><h2>' + p.name + '</h2><p>' + p.area + ' · seit ' + p.since + '</p><div class="row gap6" style="margin-top:10px">' + badge('Aktiv', 'good') + badge(p.pensum, 'accent') + tag(p.tag) + '</div></div></div>' +
        '<dl class="definition-grid"><div><dt>Vertrag</dt><dd>' + (pct ? 'Unbefristet, Monatslohn' : 'Stundenlohn, Semester max. 24 h') + '</dd></div><div><dt>Sollstunden</dt><dd>' + hl(p.target) + ' pro Woche</dd></div><div><dt>Lohnklasse</dt><dd>' + p.cls + '</dd></div><div><dt>L-GAV Mindestlohn 2026, anteilig</dt><dd class="mono">' + (wage ? chf(wage) + ' bei ' + p.pensum : 'Stundenlohn nach Klasse') + '</dd></div><div><dt>E-Mail</dt><dd>' + p.name.toLowerCase().replace(' ', '.').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue') + '@linde.example.ch</dd></div><div><dt>Telefon</dt><dd class="mono">+41 79 000 00 ' + String(i + 1).padStart(2, '0') + '</dd></div></dl></section>' +
        '<section class="surface">' + sectionTitle('01', 'Verfügbarkeit', button('Anpassen', 'availability', 'text', 'edit')) + '<p class="small muted">Regelmässig, gültig ab 01.10.2026</p><div class="availability">' + avail.map(function (a) { return '<div class="' + (a[2] ? 'available' : '') + '"><strong>' + a[0] + '</strong>' + a[1] + '</div>'; }).join('') + '</div></section>' +
        '<section class="surface">' + sectionTitle('02', 'Diese Woche') + D.dayNames.map(function (n, d) { var s = C.shiftOf(i, d); return '<div class="summary-line"><span>' + D.dayLong[d] + ' ' + dateOf(d).getDate() + '.</span><span class="mono">' + (C.isWork(s) ? C.range(s) + ' · ' + hl(C.net(s)) : s === 'F' ? 'Ferien' : 'frei') + '</span></div>'; }).join('') + '</section></div>' +
      '<div class="stack"><section class="surface">' + sectionTitle('03', 'Stundenkonto') + '<div class="balance">' + (i === 4 ? '+6<span style="font-size:28px"> h 30</span>' : '+0<span style="font-size:28px"> h 00</span>') + '</div><p class="small muted">Saldo per 22.10.2026</p><div class="summary-line" style="margin-top:12px"><span>Diese Woche geplant</span><span class="mono">' + hl(h) + '</span></div><div class="summary-line"><span>Soll diese Woche</span><span class="mono">' + hl(p.target) + '</span></div>' + link('time', 'Zeiterfassung ansehen ' + icon('arrow'), 'view-all-link') + '</section>' +
        (w.length ? w.map(function (x) { return '<div class="notice ' + x.kind + '">' + icon('warning') + '<div><strong>' + x.title + '</strong><small>' + x.body + '</small>' + link('planning', 'Schicht anpassen ' + icon('arrow'), 'view-all-link') + '</div></div>'; }).join('') : '<div class="notice good">' + icon('check') + '<div><strong>Keine Planungshinweise</strong><small>Ruhezeit, Wochenstunden und Verfügbarkeit sind in dieser Woche eingehalten.</small></div></div>') +
        '<section class="surface">' + sectionTitle('04', 'Absenzen', button('Absenz erfassen', 'leave', 'text', 'plus')) + (i === 4 ? '<div class="summary-line"><div>Ferien<span class="table-secondary">16. bis 22. November 2026, 5 Arbeitstage</span></div>' + badge('Genehmigt', 'good') + '</div>' : i === 11 ? '<div class="summary-line"><div>Ferien<span class="table-secondary">23. bis 25. Oktober 2026</span></div>' + badge('Genehmigt', 'good') + '</div>' : '<p class="small muted">Keine Absenzen geplant.</p>') + '<div class="summary-line"><div>Ferienguthaben<span class="table-secondary">Nach bestätigten Absenzen</span></div><span class="mono">8.0 Tage</span></div></section></div></div>';
  }

  /* ================= REQUESTS ================= */
  function requests() {
    var open = U.openRequests();
    return pageHead('04 / Team & Planung', 'Anfragen entscheiden.', 'Eine klare Antwort macht Planung leichter.') + U.teamTabs() +
      '<div class="two-col"><section class="plain-surface"><div class="surface-title between"><h2>Eingegangen</h2>' + badge(open + ' offen', open ? 'accent' : 'good') + '</div>' +
      D.requests.map(function (r) { var p = D.staff[r.person], done = S.requests[r.id]; return '<article class="request"><span class="avatar">' + p.ini + '</span><div><div class="row wrap gap6"><h3>' + p.name + '</h3>' + badge(r.type, r.type === 'Krank' ? 'warn' : 'outline') + '</div><p>' + r.title + '<br><span class="small">' + r.desc + '</span></p><span class="table-secondary">' + r.note + '</span></div><div class="request-actions">' + (done ? badge(done, done === 'Abgelehnt' ? 'bad' : 'good') : '<button class="button small primary" data-request="' + r.id + '" data-answer="' + r.done + '">' + r.yes + '</button><button class="button small" data-request="' + r.id + '" data-answer="' + (r.id === 'lea' ? 'ask' : 'Abgelehnt') + '">' + r.no + '</button>') + '</div></article>'; }).join('') + '</section>' +
      '<div class="stack"><section class="surface">' + sectionTitle('01', 'Diese Woche') + '<div class="request-count">' + String(open).padStart(2, '0') + '</div><p class="small muted">' + (open ? 'Anfragen warten auf eine Entscheidung.' : 'Alles erledigt. Zurzeit gibt es keine offenen Anfragen.') + '</p><div class="summary-line" style="margin-top:18px"><span>Schichttausch</span><span class="mono">1</span></div><div class="summary-line"><span>Ferien</span><span class="mono">1</span></div><div class="summary-line"><span>Krankmeldung</span><span class="mono">1</span></div></section>' +
      '<div class="notice">' + icon('phone') + '<div>Antworten kommen direkt in der Mitarbeiter-App an.<small>Im Prototyp werden Entscheidungen nur in diesem Browser gespeichert.</small></div></div></div></div>' +
      '<section class="plain-surface" style="margin-top:24px"><div class="surface-title">' + sectionTitle('02', 'Zuletzt bearbeitet') + '</div><table><thead><tr><th>Mitarbeiter:in</th><th>Anfrage</th><th class="hide-sm">Entschieden von</th><th>Status</th></tr></thead><tbody><tr><td>Nina Graf</td><td>Ferien, 16. bis 22.11.</td><td class="hide-sm">Lena Keller, 21.10.</td><td>' + badge('Genehmigt', 'good') + '</td></tr><tr><td>Anna Sutter</td><td>Verfügbarkeit Do ab 17 Uhr</td><td class="hide-sm">Lena Keller, 20.10.</td><td>' + badge('Übernommen', 'good') + '</td></tr></tbody></table></section>';
  }

  /* ================= TIME ================= */
  function time() {
    var rows = D.clock.slice().sort(function (a, b) { return a.in > b.in ? 1 : -1; });
    var dur = function (t) { var x = t.split(':').map(Number), m = 19 * 60 + 42 - (x[0] * 60 + x[1]); return Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0'); };
    return pageHead('04 / Team & Planung', 'Zeit, sauber erfasst.', 'Oktober 2026, Stand heute 19:42', button('Eintrag ergänzen', 'time-entry', '', 'plus') + button('Lohnexport', 'payroll-export', 'primary', 'download')) + U.teamTabs() +
      '<div class="planning-stats"><div class="planning-stat"><div class="label">Erfasste Stunden</div><div class="value">1\'128<span>h 30</span></div><div class="note">14 Mitarbeitende</div></div><div class="planning-stat"><div class="label">Zur Prüfung</div><div class="value">3<span>Einträge</span></div><div class="note">2 Pausen, 1 Ausstempelzeit</div></div><div class="planning-stat"><div class="label">Nachtzeit erfasst</div><div class="value">38<span>h 00</span></div><div class="note">Zuordnung nach Vertragsmodell</div></div><div class="planning-stat"><div class="label">Monatsabschluss</div><div class="value" style="font-size:22px">' + (S.monthClosed ? 'Abgeschlossen' : 'In Vorbereitung') + '</div><div class="note">' + (S.monthClosed ? 'Export bereit' : 'Zeitraum endet am 31.10.') + '</div></div></div>' +
      '<div class="notice warn page-notice">' + icon('warning') + '<div><strong>3 Einträge brauchen eine Prüfung.</strong><small>Nach der Freigabe werden Korrekturen im Änderungsprotokoll gespeichert.</small></div><div class="notice-actions">' + button('Einträge prüfen', 'review-time', 'small') + '</div></div>' +
      '<section class="plain-surface"><div class="surface-title between"><h2>Heute im Betrieb</h2><span class="small muted">11 geplant, 10 eingestempelt</span></div><div class="table-wrap"><table><thead><tr><th>Mitarbeiter:in</th><th>Plan</th><th>Beginn</th><th class="hide-sm">Pause</th><th class="num">Bisher</th><th>Status</th></tr></thead><tbody>' +
      rows.map(function (r) { var p = D.staff[r.p], s = C.shiftOf(r.p, 4); return '<tr><td>' + link('profile', p.name, 'table-link', { person: String(r.p) }) + '</td><td class="mono">' + (C.isWork(s) ? C.range(s) : 'frei') + '</td><td class="mono">' + r.in + '</td><td class="hide-sm ' + (r.pause === 'fehlt' ? 'warn-text' : '') + '">' + r.pause + '</td><td class="num mono">' + dur(r.in) + '</td><td>' + badge(r.state, r.state === 'Prüfen' ? 'warn' : 'good dot') + '</td></tr>'; }).join('') +
      '<tr><td>' + link('profile', 'Luca Baumann', 'table-link', { person: '7' }) + '</td><td class="mono">18:00-24:00</td><td class="mono">fehlt</td><td class="hide-sm">-</td><td class="num mono">0 h 00</td><td>' + badge('Nicht eingestempelt', 'bad') + '</td></tr>' +
      '<tr><td>' + link('profile', 'Lea Steiner', 'table-link', { person: '10' }) + '</td><td class="mono">18:00-24:00</td><td class="mono">-</td><td class="hide-sm">-</td><td class="num mono">-</td><td>' + badge('Krank', 'outline') + '</td></tr></tbody></table></div></section>' +
      '<div class="equal-col" style="margin-top:24px"><section class="surface">' + sectionTitle('01', 'Monat abschliessen') + '<div class="step-list"><div class="step complete"><strong>01</strong>Zeiten sammeln</div><div class="step ' + (S.monthClosed ? 'complete' : 'current') + '"><strong>02</strong>Einträge prüfen</div><div class="step ' + (S.monthClosed ? 'complete' : '') + '"><strong>03</strong>Freigeben</div><div class="step ' + (S.monthClosed ? 'current' : '') + '"><strong>04</strong>Exportieren</div></div><p class="small muted" style="margin-bottom:16px">Absenzen, Salden und Zuschläge werden zusammen mit den freigegebenen Zeiten exportiert.</p>' + button(S.monthClosed ? 'Abschluss ansehen' : 'Monatsabschluss vorbereiten', 'month-close', '', 'check') + '</section>' +
      '<section class="surface">' + sectionTitle('02', 'Export an die Lohnbuchhaltung') + '<div class="summary-line"><span>bexio Lohn</span>' + badge('CSV bereit', 'good') + '</div><div class="summary-line"><span>Abacus</span>' + badge('CSV bereit', 'good') + '</div><div class="summary-line"><span>Letzter Export</span><span class="mono">30.09.2026, 18:12</span></div>' + button('Export konfigurieren', 'payroll-export', 'text', 'download') + '</section></div>';
  }

  /* ================= TEMPLATES & RULES ================= */
  function sw(key, label) { return '<button class="switch" role="switch" aria-checked="' + (S.rules[key] !== false) + '" aria-label="' + label + '" data-rule="' + key + '"></button>'; }
  function templates() {
    var wc = C.warnCounts();
    return pageHead('04 / Team & Planung', 'Ein guter Plan beginnt hier.', 'Vorlagen für den Alltag. Regeln für Verlässlichkeit.', button('Vorlage erstellen', 'create-template', 'primary', 'plus')) + U.teamTabs() +
      '<div class="three-col">' + [['01', 'Normale Woche', 'Mo bis So, 14 Personen', '411 h · 52 Schichten', [45, 50, 55, 63, 90, 100, 55]], ['02', 'Wochenende voll', 'Fr bis So, zusätzliche Aushilfen', '252 h · 31 Schichten', [15, 15, 15, 30, 91, 100, 80]], ['03', 'Mittagsbetrieb', 'Mo bis Fr, reduziertes Abendteam', '286 h · 40 Schichten', [70, 70, 70, 70, 75, 20, 20]]].map(function (r) { return '<section class="template"><div class="template-number">VORLAGE / ' + r[0] + '</div><h2>' + r[1] + '</h2><p>' + r[2] + '</p><div class="mini-days">' + r[4].map(function (n) { return '<i style="height:' + n + '%"></i>'; }).join('') + '</div><div class="mono small muted">' + r[3] + '</div>' + button('Auf KW 44 anwenden ' + icon('arrow'), 'apply-template', '', '', 'data-name="' + r[1] + '"') + '</section>'; }).join('') + '</div>' +
      '<div class="equal-col" style="margin-top:26px"><section class="surface">' + sectionTitle('01', 'Planungsregeln', '<span class="row gap6">' + badge(wc.bad + ' Verstoss', wc.bad ? 'bad' : 'good') + badge(wc.warn + ' Warnungen', wc.warn ? 'warn' : 'good') + '</span>') +
        '<div class="rule"><div><h3>Tägliche Ruhezeit ' + badge('Verstoss', 'bad') + '</h3><p>Weniger als 11 Stunden zwischen zwei Schichten blockiert das Veröffentlichen ohne Begründung.</p></div>' + sw('rest', 'Ruhezeit prüfen') + '</div>' +
        '<div class="rule"><div><h3>Vertragliche Wochenstunden ' + badge('Warnung', 'warn') + '</h3><p>Hinweis, wenn das individuelle Pensum überschritten wird.</p></div>' + sw('hours', 'Wochenstunden prüfen') + '</div>' +
        '<div class="rule"><div><h3>Verfügbarkeit ' + badge('Warnung', 'warn') + '</h3><p>Schichten ausserhalb der hinterlegten Verfügbarkeit markieren.</p></div>' + sw('availability', 'Verfügbarkeit prüfen') + '</div>' +
        '<div class="rule"><div><h3>Feiertage Kanton St. Gallen</h3><p>Nächster Feiertag: Allerheiligen, Sonntag, 01.11.2026.</p></div>' + sw('holidays', 'St. Galler Feiertage') + '</div></section>' +
      '<section class="surface">' + sectionTitle('02', 'Zeit und Lohn nach L-GAV') + '<div class="rule"><div><h3>Nachtarbeit</h3><p>Vorübergehend: 25 % Lohnzuschlag. Regelmässig: 10 % Zeitzuschlag. Modell pro Vertrag prüfen.</p></div>' + button('Modell', 'night-model', 'small') + '</div><div class="rule"><div><h3>Sonntagsarbeit</h3><p>Vorübergehend: 50 % Lohnzuschlag. Regelmässige Arbeit im Gastgewerbe nach anwendbarem Modell.</p></div>' + button('Modell', 'sunday-model', 'small') + '</div><div class="rule"><div><h3>L-GAV Lohnklassen 2026</h3><p>Klasse, Pensum und vertraglichen Lohn getrennt pflegen. Mindestlohn IIIa: CHF 4\'528 bei 100 %.</p></div>' + link('profile', 'Profil', 'button small', { person: '4' }) + '</div><p class="legal-note">Demo-Konfiguration. Ausnahme-, Vertrags- und Betriebsregelungen vor produktiver Nutzung prüfen.</p></section></div>';
  }

  /* ================= STAFF APP ================= */
  function mobile() {
    var sat = C.shiftOf(4, 5), sun = C.shiftOf(4, 6), claimO = D.openShifts[0];
    return pageHead('04 / Team & Planung / Mitarbeiter-App', 'Dein Dienst. Dein Überblick.', 'Die gleiche Klarheit, unterwegs.') +
      '<div class="phone-stage"><section class="staff-phone" aria-label="Mitarbeiter-App für Nina Graf"><div class="phone-top"><a href="' + U.href('overview') + '" class="brand"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>nordane</a>' + link('profile', 'NG', 'avatar', { person: '4' }, 'aria-label="Ninas Profil"') + '</div>' +
      '<div class="phone-date">FREITAG, 23. OKTOBER</div><h2 class="phone-greeting">Hoi Nina.</h2><p class="phone-intro">Schön, dass du da bist. Dein Abend im Überblick.</p>' +
      '<div class="shift-feature"><div class="between"><span class="small">Deine Schicht heute</span>' + badge(S.clockOut ? 'Ausgestempelt' : 'Im Dienst', S.clockOut ? 'outline' : 'good dot') + '</div><div class="big-time">16:00-24:00</div><div class="role">Service, Saal · Wirtschaft zur Linde</div><div class="summary-line" style="padding-top:0;margin-bottom:12px"><span class="small">' + (S.clockOut ? 'Ausgestempelt um' : 'Eingestempelt um') + '</span><span class="mono">' + (S.clockOut ? '19:42' : '15:54') + '</span></div>' + button(S.clockOut ? 'Wieder einstempeln' : 'Ausstempeln', 'clock', 'primary', 'clock') + '</div>' +
      '<div class="phone-section-title"><h3>Deine nächsten Schichten</h3>' + link('planning', 'Alle', 'view-all-link') + '</div>' +
      '<div class="open-shift"><div class="date-tile">SA<strong>24</strong></div><div><h3>Service, Mittag</h3><p>' + (C.isWork(sat) ? C.range(sat) : 'frei') + ' · Saal</p></div>' + (C.changed(4, 5) ? badge('Geändert', 'warn') : '') + '</div>' +
      '<div class="open-shift"><div class="date-tile">SO<strong>25</strong></div><div><h3>Service, Mittag</h3><p>' + (C.isWork(sun) ? C.range(sun) : 'frei') + ' · Saal</p></div></div>' +
      '<div class="phone-section-title" style="margin-top:20px"><h3>Offene Schicht im Service</h3>' + badge('6 h', 'outline') + '</div><div class="open-shift"><div><h3>Samstag, ' + C.range([claimO.start, claimO.end]) + '</h3><p>Service, Terrasse und Saal</p></div>' + button(S.claimed ? 'Angefragt' : 'Übernehmen', 'claim', 'small' + (S.claimed ? '' : ' primary')) + '</div>' +
      '<nav class="phone-tabs" aria-label="App-Navigation"><a class="active" href="' + U.href('mobile') + '">' + icon('calendar') + 'Mein Plan</a><button data-action="leave">' + icon('plus') + 'Anfrage</button><a href="' + U.href('time') + '">' + icon('clock') + 'Meine Zeit</a>' + link('profile', icon('user') + 'Profil', '', { person: '4' }) + '</nav></section>' +
      '<aside class="mobile-explainer"><div class="eyebrow">Die Mitarbeiterperspektive</div><h2>Weniger Rückfragen.<br>Mehr Überblick.</h2><p>Schichten, Änderungen und das eigene Stundenkonto bleiben an einem Ort. Jede Anfrage hat einen klaren Status.</p><div class="mobile-note"><h3>01 / Der nächste Schritt ist klar</h3><p>Während der Schicht steht die Zeiterfassung im Vordergrund. Danach folgt der nächste Dienst.</p></div><div class="mobile-note"><h3>02 / Änderungen fallen auf</h3><p>Ein geänderter Dienst trägt eine sichtbare Kennzeichnung. Offene Schichten lassen sich direkt übernehmen.</p></div><div class="mobile-note"><h3>03 / Für 390 px gemacht</h3><p>Grosse Touchflächen, kurze Wege und der gleiche ruhige Rhythmus wie im Backoffice.</p></div></aside></div>';
  }

  /* ================= FINANCE ================= */
  function reports() {
    var t = D.tenders, total = t.reduce(function (s, x) { return s + x.amount; }, 0);
    return pageHead('05 / Finanzen', 'Der Tag, abgeschlossen.', 'Umsatz, Steuer, Zahlungen und Auszahlungen an einem Ort.', button('Bericht exportieren', 'report-export', '', 'download')) +
      '<nav class="tabs" aria-label="Finanzen"><a class="tab active" href="#z">Z-Bericht</a><a class="tab" href="#zahlungsarten">Zahlungsarten</a><a class="tab" href="#mwst">MWST</a><a class="tab" href="#auszahlungen">Auszahlungen</a></nav>' +
      '<div class="report-hero" id="z"><div><span class="small">Bruttoumsatz heute · ' + (S.closed ? 'Z-Bericht Z-2026-1023' : 'Zwischenbericht X um 19:42') + '</span><div class="amount"><small>CHF</small>6\'694.00</div><p class="small muted">' + D.day.orders + ' Bestellungen · ' + D.day.guests + ' Gäste · ' + D.day.service + ' im Service, ' + D.day.takeaway + ' Take-away</p></div><div class="row">' + badge(S.closed ? 'Abgeschlossen' : 'Service läuft', S.closed ? 'good' : 'accent dot') + button(S.closed ? 'Z-Bericht ansehen' : 'Tagesabschluss vorbereiten', 'daily-close', 'primary', 'check') + '</div></div>' +
      '<section class="surface" style="margin-bottom:24px">' + sectionTitle('01', 'Z-Bericht, Kennzahlen') + '<div class="z-grid"><div><small>Nettoumsatz</small><strong>' + num(D.day.net) + '</strong></div><div><small>MWST total</small><strong>' + num(D.day.vat81 + D.day.vat26) + '</strong></div><div><small>Storno, 1 Bon</small><strong>12.50</strong></div><div><small>Rückerstattung, 1 Bon</small><strong>76.00</strong></div><div><small>Rabatte</small><strong>0.00</strong></div><div><small>Trinkgeld Karte und TWINT</small><strong>214.00</strong></div><div><small>Ø Bon</small><strong>' + num(D.day.gross / D.day.orders) + '</strong></div><div><small>Ø pro Gast</small><strong>' + num(D.day.gross / D.day.guests) + '</strong></div></div></section>' +
      '<div class="equal-col"><section class="plain-surface" id="zahlungsarten"><div class="surface-title">' + sectionTitle('02', 'Zahlungsarten', link('settings', 'Konfigurieren', 'view-all-link')) + '</div><div style="padding:0 22px">' + tenderBar() + '</div><table><thead><tr><th>Zahlungsart</th><th class="num">Anzahl</th><th class="num">Betrag CHF</th><th class="num hide-sm">Anteil</th></tr></thead><tbody>' + t.map(function (x, i) { return '<tr><td><span class="row" style="gap:0"><i class="tender-dot t' + (i + 1) + '"></i>' + x.label + '</span><span class="table-secondary" style="padding-left:17px">' + x.settle + ', Gebühr ' + x.fee + '</span></td><td class="num mono">' + x.count + '</td><td class="num mono">' + num(x.amount) + '</td><td class="num mono hide-sm">' + num(x.amount / total * 100, 1) + ' %</td></tr>'; }).join('') + '<tr><td><strong>Total Zahlungen</strong></td><td class="num mono">' + t.reduce(function (s, x) { return s + x.count; }, 0) + '</td><td class="num mono"><strong>' + num(total) + '</strong></td><td class="hide-sm"></td></tr></tbody></table><div class="table-foot"><span>Karte: Visa, Mastercard, Maestro und PostFinance Card am eigenen Terminal</span></div></section>' +
      '<section class="plain-surface" id="mwst"><div class="surface-title">' + sectionTitle('03', 'MWST-Aufschlüsselung') + '</div><table><thead><tr><th>Satz</th><th class="num">Brutto</th><th class="num">MWST</th><th class="num">Netto</th></tr></thead><tbody><tr><td>8.1 %<span class="table-secondary">Im Haus und Alkohol</span></td><td class="num mono">' + num(D.day.vat81Gross) + '</td><td class="num mono">' + num(D.day.vat81) + '</td><td class="num mono">' + num(D.day.vat81Gross - D.day.vat81) + '</td></tr><tr><td>2.6 %<span class="table-secondary">Take-away Speisen, alkoholfrei</span></td><td class="num mono">' + num(D.day.vat26Gross) + '</td><td class="num mono">' + num(D.day.vat26) + '</td><td class="num mono">' + num(D.day.vat26Gross - D.day.vat26) + '</td></tr><tr><td><strong>Total</strong></td><td class="num mono">' + num(D.day.gross) + '</td><td class="num mono"><strong>' + num(D.day.vat81 + D.day.vat26) + '</strong></td><td class="num mono"><strong>' + num(D.day.net) + '</strong></td></tr></tbody></table><div class="table-foot"><span>UID ' + D.venue.uid + ' · Abrechnung effektiv, quartalsweise</span></div></section></div>' +
      '<div class="equal-col" style="margin-top:24px"><section class="plain-surface" id="auszahlungen"><div class="surface-title">' + sectionTitle('04', 'Auszahlungen') + '</div><table><thead><tr><th>Datum</th><th>Quelle</th><th class="num">Betrag CHF</th><th>Status</th></tr></thead><tbody>' +
        [['26.10.2026', 'TWINT, Umsatz 23.10.', '1\'916.77', 'Geplant', 'outline'], ['26.10.2026', 'Bareinzahlung Bank', '870.50', 'Geplant', 'outline'], ['23.10.2026', 'TWINT, Umsatz 22.10.', '1\'286.40', 'Ausgezahlt', 'good'], ['23.10.2026', 'Terminalanbieter, Karten 22.10.', '2\'948.60', 'Extern', 'outline'], ['22.10.2026', 'TWINT, Umsatz 21.10.', '1\'104.15', 'Ausgezahlt', 'good']].map(function (r) { return '<tr><td class="mono">' + r[0] + '</td><td>' + r[1] + '<span class="table-secondary">Konto CH93 •• 1742</span></td><td class="num mono">' + r[2] + '</td><td>' + badge(r[3], r[4]) + '</td></tr>'; }).join('') +
        '</tbody></table><div class="table-foot"><span>TWINT nach Abzug von 1.3 % Gebühr. Kartenumsätze rechnet der Terminalanbieter direkt ab.</span></div></section>' +
      '<section class="surface">' + sectionTitle('05', 'Kassenbestand') + '<div class="summary-line"><span>Anfangsbestand</span><span class="mono">CHF 300.00</span></div><div class="summary-line"><span>Bareinnahmen</span><span class="mono">' + chf(870.5) + '</span></div><div class="summary-line"><span>Erwarteter Bestand</span><strong class="mono">CHF 1\'170.50</strong></div>' + button('Bargeld zählen', 'cash-count', 'text', 'edit') + '</section></div>';
  }

  /* ================= SETTINGS ================= */
  function settings() {
    var v = D.venue;
    return pageHead('06 / Betrieb', 'Gut eingerichtet.', 'Stammdaten, Zahlungen und Geräte.', button('Änderungen speichern', 'save-settings', 'primary', 'save')) +
      '<div class="two-col"><form class="plain-surface" id="settings-form"><section class="form-section"><h3>' + v.name + '</h3><div class="form-grid">' + field('Betriebsname', '<input name="venue" value="' + v.name + '" required>') + field('UID / MWST-Nummer', '<input name="uid" value="' + v.uid + '">', 'Demowert') + field('Strasse und Nummer', '<input name="street" value="' + v.street + '">') + field('PLZ und Ort', '<input name="city" value="' + v.zip + '">') + field('Kanton', '<select name="canton"><option>St. Gallen</option><option>Zürich</option><option>Appenzell Ausserrhoden</option></select>') + field('Land', '<input value="Schweiz" readonly>') + '</div></section>' +
      '<section class="form-section"><h3>Sprache und Format</h3><div class="form-grid">' + field('Sprache der Oberfläche', '<select name="lang"><option>Deutsch (Schweiz)</option><option>English</option><option>Français (Suisse)</option></select>', 'Für alle Geräte dieses Betriebs') + field('Zeitzone', '<input value="Europe/Zurich" readonly>') + field('Währung', '<input value="CHF, Schweizer Franken" readonly>') + field('Zahlenformat', '<input value="CHF 6\'694.00" readonly>') + '</div></section>' +
      '<section class="form-section"><h3>Kontakt</h3><div class="form-grid">' + field('E-Mail', '<input type="email" name="mail" value="hallo@linde.example.ch">') + field('Telefon', '<input type="tel" name="tel" value="+41 71 000 00 00">') + '</div></section></form>' +
      '<div class="stack"><section class="surface">' + sectionTitle('01', 'Zahlungen') + '<div class="setting-status"><div>Karte, eigenes Terminal<p>Terminalanbieter direkt angebunden</p></div>' + badge('Aktiv', 'good') + '</div><div class="setting-status"><div>TWINT<p>Händlerkonto •• 1742, QR an der Kasse und am Tisch</p></div>' + badge('Aktiv', 'good') + '</div><div class="setting-status"><div>Rechnung<p>Nur für hinterlegte Firmenkunden</p></div>' + U.badge('Aktiv', 'good') + '</div><div class="setting-status"><div>Barzahlungen<p>Kasse Restaurant</p></div><button class="switch" role="switch" aria-checked="true" aria-label="Barzahlungen erlauben" data-toggle="1"></button></div>' + button('Zahlungen konfigurieren', 'payment-settings', 'text', 'edit') + '</section>' +
      '<section class="surface">' + sectionTitle('02', 'Geräte') + [['card', 'Terminal 01', 'Restaurant, eigene Hardware', 'Online', 'good'], ['phone', 'iPad Service', 'Zuletzt aktiv 19:42', 'Online', 'good'], ['print', 'Bondrucker Küche', 'Ethernet', 'Online', 'good'], ['register', 'Kasse Terrasse', 'Offline seit 16:38', 'Offline', 'bad']].map(function (r) { return '<div class="setting-status"><div class="row"><span class="device-icon">' + icon(r[0]) + '</span><div>' + r[1] + '<p>' + r[2] + '</p></div></div>' + badge(r[3], r[4] + ' dot') + '</div>'; }).join('') + button('Gerät verbinden', 'connect-device', 'text', 'plus') + '</section>' +
      '<div class="notice">' + icon('help') + '<div>Demodaten für diese Designrichtung.<small>UID, Adresse und Kontaktdaten sind fiktiv.</small></div></div></div></div>';
  }

  /* ================= COMPONENTS ================= */
  function components() {
    var sw2 = [['Aktion', 'var(--accent)'], ['Akzent Text', 'var(--accent-ink)'], ['Tönung', 'var(--tint)'], ['Hintergrund', 'var(--bg)'], ['Fläche', 'var(--surface)'], ['Gedeckt', 'var(--good-fill)'], ['Warnung', 'var(--warn-fill)'], ['Lücke, Fehler', 'var(--bad-fill)']];
    var demoOrder = C.orders()[3];
    return pageHead('D / Komponenten', 'Ein System. Ein ruhiges Licht.', 'LINIE als Basis, mit den Arbeitswerkzeugen der Linear-Variante.', button('Tastenkürzel', 'shortcuts', '', 'keyboard') + button('Springen zu <kbd>⌘K</kbd>', 'palette', 'primary', 'search')) +
      '<section class="system-section"><div class="system-section-title">01 / Typografie</div><div class="equal-col"><div><div class="muted small">Space Grotesk 400 / 500 / 600</div><div class="type-display">Präzision<br>mit Charakter.</div><p class="small muted">Sachliche Grotesk für Navigation, Arbeit und grosse Zahlen. JetBrains Mono für Zeiten, Beträge und Nummern.</p></div><div>' +
        '<div class="type-row"><h1 style="font-size:38px">Seitentitel</h1><small>44 / 48 · -1.8</small></div><div class="type-row"><h2>Abschnitt</h2><small>21 / 26</small></div><div class="type-row"><span>Text und Bedienung</span><small>14 / 21</small></div><div class="type-row"><span class="mono">CHF 6\'694.00 · 16:00-24:00</span><small>Mono 12 bis 13</small></div><div class="type-row"><span class="eyebrow" style="margin:0">04 / Team & Planung</span><small>Mono 11 · +1.3</small></div><div class="type-row"><span class="small muted">Kleinste Schrift: 11 px, nur für Labels und Achsen</span><small>Minimum</small></div></div></div></section>' +
      '<section class="system-section"><div class="system-section-title">02 / Farbe als Tokens · Palette ' + U.palette().toUpperCase() + ', ' + (U.theme() === 'dark' ? 'dunkel' : 'hell') + '</div><div class="swatches">' + sw2.map(function (r) { return '<div class="swatch"><div class="swatch-color" style="background:' + r[1] + '"></div><p>' + r[0] + '</p><small>' + r[1].replace('var(', '').replace(')', '') + '</small></div>'; }).join('') + '</div><p class="legal-note">Palette C (Standard): hell wie Palette A, Eisblau auf Weiss; dunkel nahezu schwarz mit Eisblau für alles Bedienbare und Warnungen in ruhigem Bernstein. In beiden Modi liegt nur ein kaum sichtbarer, warmer Schimmer hinter dem Inhalt. Palette A: hell Eisblau, dunkel Koralle. Palette B: hell Koralle, dunkel Eisblau. Dunkle Flächen bleiben neutral schwarz. Status nutzt immer Farbe und Text gemeinsam. Umschalten oben rechts unter Farben.</p></section>' +
      '<section class="system-section"><div class="system-section-title">03 / Bedienelemente</div><div class="comp-grid">' +
        '<div class="comp"><h3>Schaltflächen</h3><div class="row">' + button('Veröffentlichen', 'noop', 'primary', 'send') + button('Bearbeiten', 'noop', '', 'edit') + button('Mehr', 'noop', 'text') + '</div><div class="row" style="margin-top:12px">' + button('Klein', 'noop', 'small') + button('Neu <kbd>N</kbd>', 'noop', 'primary small', 'plus') + '<button class="button" disabled>Deaktiviert</button></div></div>' +
        '<div class="comp"><h3>Status und Pillen</h3><div class="row gap6">' + ['neu', 'kueche', 'bereit', 'verspaetet', 'serviert', 'bezahlt', 'erstattet', 'storniert'].map(function (k) { return badge(C.STATUS[k][1], C.STATUS[k][0]); }).join('') + '</div><div class="row gap6" style="margin-top:12px">' + badge('Entwurf', 'outline') + badge('Veröffentlicht', 'good') + badge('1 Verstoss', 'bad') + badge('2 Warnungen', 'warn') + '</div></div>' +
        '<div class="comp"><h3>Rollen und Tasten</h3><div class="row gap6">' + ['SL', 'SV', 'BA', 'KÜ', 'AW'].map(tag).join('') + '</div><div class="row gap6" style="margin-top:14px"><kbd>⌘K</kbd><kbd>J</kbd><kbd>K</kbd><kbd>N</kbd><kbd>1</kbd><kbd>?</kbd></div></div>' +
        '<div class="comp"><h3>Suche und Segmente</h3><label class="search">' + icon('search') + '<input placeholder="Nummer, Tisch oder Gericht" aria-label="Beispielsuche"></label><div class="seg" role="group" aria-label="Beispiel" style="margin-top:12px"><button aria-pressed="true">Alle</button><button aria-pressed="false">' + icon('qr') + 'Tisch-QR</button><button aria-pressed="false">' + icon('bike') + 'Lieferung</button></div></div>' +
        '<div class="comp"><h3>Tabs mit Zählern</h3><nav class="tabs" style="margin:0"><span class="tab active">Alle<span class="count">19</span></span><span class="tab">Braucht Aktion<span class="count">4</span></span><span class="tab">Bezahlt<span class="count">12</span></span></nav></div>' +
        '<div class="comp"><h3>Formular</h3><div class="form-grid">' + field('Schicht', '<input placeholder="Abendservice">') + field('Bereich', '<select><option>Service</option><option>Küche</option></select>') + '</div><div class="row" style="margin-top:14px"><button class="switch" role="switch" aria-checked="true" aria-label="Beispiel" data-toggle="1"></button><span class="small">Verfügbar</span></div></div>' +
      '</div></section>' +
      '<section class="system-section"><div class="system-section-title">04 / Wochenplan-Bausteine</div><div class="comp-grid">' +
        '<div class="comp"><h3>Schichtkarten</h3><div class="stack" style="gap:6px"><button class="shift service"><span class="t">16:00-24:00</span><span class="r">' + tag('SV') + 'Service</span></button><button class="shift kitchen"><span class="t">09:00-17:00</span><span class="r">' + tag('KÜ') + 'Küche</span></button><button class="shift bar"><span class="t">16:00-24:00</span><span class="r">' + tag('BA') + 'Bar</span></button><button class="shift bad"><span class="t">09:00-17:00</span><span class="r">! 9 h Ruhezeit</span></button><button class="shift warn changed"><span class="t">18:00-24:00</span><span class="r">verfügbar ab 19:00</span></button><button class="shift open"><span class="t">17:00-23:00</span><span class="r">' + tag('SV') + 'Offen</span></button></div></div>' +
        '<div class="comp"><h3>Abdeckung je halbe Stunde</h3>' + strip(4, true) + '<div class="strip-axis"><span>09</span><span>16</span><span>24</span></div><div style="margin-top:14px">' + strip(3, true) + '</div><h3 style="margin-top:22px">Stunden gegen Soll</h3><div class="hours" style="grid-template-columns:1fr auto"><div class="hours-bar"><i style="width:94%"></i></div><span>39.5 / 42.0</span></div><div class="hours" style="grid-template-columns:1fr auto;margin-top:10px"><div class="hours-bar"><i class="over" style="width:100%"></i></div><span class="over">46.0 / 42.0</span></div></div>' +
        '<div class="comp"><h3>Hinweise</h3><div class="stack" style="gap:10px"><div class="notice bad">' + icon('warning') + '<div><strong>1 Regelverstoss</strong><small>Nina: 9 h Ruhezeit</small></div></div><div class="notice warn">' + icon('warning') + '<div><strong>2 Warnungen</strong><small>Wochenstunden, Verfügbarkeit</small></div></div><div class="notice good">' + icon('check') + '<div><strong>Plan veröffentlicht</strong><small>Das Team sieht die neue Version.</small></div></div></div></div>' +
      '</div></section>' +
      '<section class="system-section"><div class="system-section-title">05 / Tabellenzeile mit nächstem Schritt</div><section class="plain-surface"><table class="order-table"><thead><tr><th>Nr.</th><th>Kanal</th><th>Tisch oder Gast</th><th>Status</th><th>Zahlung</th><th>Nächster Schritt</th><th class="num">CHF</th></tr></thead><tbody><tr class="needs"><td><span class="order-id">#' + demoOrder.id + '</span></td><td><span class="channel">' + icon(CH_ICON[demoOrder.channel]) + demoOrder.channel + '</span></td><td>' + demoOrder.where + '</td><td>' + pill(demoOrder) + '</td><td>' + payCell(demoOrder) + '</td><td>' + nextAction(demoOrder) + '</td><td class="num mono">' + num(demoOrder.total) + '</td></tr><tr class="sel"><td><span class="order-id">#1048</span></td><td><span class="channel">' + icon('register') + 'Kasse</span></td><td>Tisch 08</td><td>' + badge('In der Küche', 'ink dot') + '</td><td><span class="pay-open">noch offen</span></td><td><span class="muted">-</span></td><td class="num mono">186.50</td></tr></tbody></table></section></section>' +
      '<section class="system-section"><div class="system-section-title">06 / Leer, ladend, Fehler</div><div class="states"><div class="state">' + icon('empty') + '<h3>Alles erledigt.</h3><p>Zurzeit gibt es keine offenen Anfragen.</p>' + link('planning', 'Zum Wochenplan', 'view-all-link') + '</div><div class="state" aria-label="Beispiel Ladezustand"><h3>Plan wird geladen.</h3><p>Einen Moment bitte.</p><div class="skeleton"></div><div class="skeleton short"></div></div><div class="state">' + icon('warning') + '<h3>Speichern nicht möglich.</h3><p>Deine Änderungen sind noch hier.</p>' + button('Erneut versuchen', 'retry', 'small') + '</div></div></section>' +
      '<section class="system-section"><div class="system-section-title">07 / Alle Ansichten</div><div class="system-links">' + Object.keys(U.ROUTES).map(function (v) { return link(v, U.ROUTES[v].t); }).join('') + '</div></section>';
  }

  function voice() {
    var rows = [['Begrüssung', 'Hoi Nina. Dein Abend im Überblick.', 'Hi Nina. Your evening at a glance.'], ['Hauptaktion', 'Plan veröffentlichen', 'Publish schedule'], ['Erfolg', 'Der Plan ist veröffentlicht. Dein Team sieht die neue Version.', 'Schedule published. Your team can see the new version.'], ['Regelverstoss', 'Nina hat zwischen Freitag und Samstag 9 Stunden Ruhezeit. Schicht prüfen.', 'Nina has 9 hours of rest between Friday and Saturday. Review shift.'], ['Offene Schicht', 'Samstag, 17:00 bis 23:00. Service. Schicht übernehmen.', 'Saturday, 17:00 to 23:00. Floor service. Claim shift.'], ['Nächster Schritt', 'Kurier anrufen. Lieferung 12 Minuten über der Zeit.', 'Call courier. Delivery 12 minutes late.'], ['Leerzustand', 'Alles erledigt. Zurzeit gibt es keine offenen Anfragen.', 'All done. There are no pending requests.'], ['Fehler', 'Speichern nicht möglich. Deine Änderungen sind noch hier.', 'Couldn\'t save. Your changes are still here.'], ['Zahlung', 'CHF 186.50 offen. Zahlung erfassen.', 'CHF 186.50 outstanding. Record payment.'], ['Export', 'Lohnexport erstellen. Freigegebene Zeiten und Absenzen werden übernommen.', 'Create payroll export. Approved hours and absences are included.']];
    return pageHead('D / Sprache', 'Klar sagen. Weiterhelfen.', 'Deutsch (Schweiz) zuerst. Englisch als Referenz.') +
      '<div class="tone-hero">Ruhig im Betrieb.<br>Direkt im nächsten Schritt.</div><div class="three-col"><div class="tone-rule"><h3>01 / Konkret</h3><p>Handlung, Person und Zeitpunkt nennen. Kein Systemjargon.</p></div><div class="tone-rule"><h3>02 / Zugewandt</h3><p>Für Menschen unter Zeitdruck. Freundlich, kurz, ohne Schuldzuweisung.</p></div><div class="tone-rule"><h3>03 / Verlässlich</h3><p>Entwurf, Änderung und Veröffentlichung unterscheiden. Ein Klick verspricht nur, was passiert.</p></div></div>' +
      '<section class="plain-surface" style="margin-top:24px"><div class="surface-title"><h2>Microcopy, Wort für Wort</h2></div><div class="table-wrap"><table class="copy-table"><thead><tr><th>Situation</th><th>Deutsch, de-CH</th><th>English</th></tr></thead><tbody>' + rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>'; }).join('') + '</tbody></table></div></section>' +
      '<div class="equal-col" style="margin-top:24px"><section class="surface">' + sectionTitle('01', 'Schweizer Konventionen') + '<div class="summary-line"><span>Rechtschreibung</span><span>ss statt ß</span></div><div class="summary-line"><span>Geld</span><span class="mono">CHF 6\'694.00</span></div><div class="summary-line"><span>Datum</span><span class="mono">23.10.2026</span></div><div class="summary-line"><span>Zeitspanne</span><span class="mono">17:00-23:00 oder «17:00 bis 23:00»</span></div></section><section class="surface">' + sectionTitle('02', 'Sprachen') + '<p class="small muted">Die Oberfläche ist Deutsch (Schweiz). Die Sprache pro Betrieb wird unter Einstellungen gewählt. Diese Seite ist die englische Referenz für Navigation, Zustände und zentrale Handlungen.</p></section></div>';
  }

  NBF.views = { overview: overview, orders: orders, order: order, menu: menu, planning: planning, day: day, team: team, profile: profile, requests: requests, time: time, templates: templates, mobile: mobile, reports: reports, settings: settings, components: components, voice: voice };
  NBF.partials = { ordersTable: ordersTable, ordersTabs: ordersTabs, orderRows: orderRows, menuTable: menuTable, editor: editor, dateOf: dateOf };
})();
