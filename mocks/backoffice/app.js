/* Rendering, actions, keyboard. Loaded last; boots the app and shows a readable error instead of a blank page. */
(function () {
  'use strict';
  var NBF = window.NBF, C = NBF.core, U = NBF.ui, V = NBF.views, PT = NBF.partials, D = NBF.data, S = C.state;
  var $ = U.$, $$ = U.$$, icon = U.icon, button = U.button, field = U.field, toast = U.toast, modal = U.modal, closeModal = U.closeModal, esc = C.esc;
  var view = U.view();

  function render() {
    U.shell(V[view]());
    bindInputs();
  }
  function persistAll() {
    C.write('edits', S.edits); C.write('assigned', S.assigned); C.write('published', S.published);
  }
  function planChanged(msg) { S.published = false; persistAll(); render(); if (msg) toast(msg); }

  function bindInputs() {
    var os = $('#order-search');
    if (os) os.addEventListener('input', function () { S.orderQuery = os.value; S.orderSel = 0; refreshOrders(); });
    var ms = $('#menu-search');
    if (ms) ms.addEventListener('input', function () { S.menuQuery = ms.value; $('#menu-table').innerHTML = PT.menuTable(); });
  }
  function refreshOrders() { $('#orders-region').innerHTML = PT.ordersTable(); $('#order-tabs').innerHTML = PT.ordersTabs(); }

  /* ---------- shift editing ---------- */
  function timeOpts(sel, from, to) { var h = ''; for (var t = from; t <= to; t += 0.5) h += '<option value="' + t + '" ' + (t === sel ? 'selected' : '') + '>' + C.hm(t) + '</option>'; return h; }
  function shiftDialog(i, d) {
    var s = C.shiftOf(i, d), work = C.isWork(s), cur = work ? s : [17, 23];
    shiftDialog.key = [i, d];
    modal(work ? 'Schicht bearbeiten' : 'Schicht hinzufügen',
      field('Mitarbeiter:in', '<select id="sh-person">' + D.staff.map(function (p, n) { return '<option value="' + n + '" ' + (n === i ? 'selected' : '') + '>' + p.name + ', ' + p.area + '</option>'; }).join('') + '</select>') +
      '<div class="form-grid">' + field('Tag', '<select id="sh-day">' + D.dayLong.map(function (n, k) { return '<option value="' + k + '" ' + (k === d ? 'selected' : '') + '>' + n + ' ' + NBF.partials.dateOf(k).getDate() + '.</option>'; }).join('') + '</select>') + field('Pause', '<select><option>30 Minuten</option><option>15 Minuten</option><option>60 Minuten</option></select>') + '</div>' +
      '<div class="form-grid">' + field('Beginn', '<select id="sh-start">' + timeOpts(cur[0], 6, 23) + '</select>') + field('Ende', '<select id="sh-end">' + timeOpts(cur[1], 8, 24) + '</select>') + '</div>' +
      '<p class="field-help">Änderungen bleiben bis zum Veröffentlichen im Entwurf. Ruhezeit, Wochenstunden und Verfügbarkeit werden sofort geprüft.</p>',
      (work ? button('Schicht entfernen', 'delete-shift', 'danger') : '') + button('Speichern', 'save-shift', 'primary', 'check'));
  }
  function assignDialog(key) {
    var o = D.openShifts.filter(function (x) { return x.key === key; })[0]; assignDialog.key = key;
    var cands = D.staff.map(function (p, i) { return { p: p, i: i }; }).filter(function (c) { return c.p.area === o.area && !C.isWork(C.shiftOf(c.i, o.day)); });
    modal('Offene Schicht besetzen', '<p class="small">' + D.dayLong[o.day] + ', ' + C.range([o.start, o.end]) + ' · ' + o.title + ' · ' + o.where + '</p>' +
      field('Passende Person', '<select id="as-person">' + cands.map(function (c) { return '<option value="' + c.i + '" ' + (c.i === o.suggest ? 'selected' : '') + '>' + c.p.name + ', ' + C.hl(C.personHours(c.i)) + ' von ' + C.hl(c.p.target) + '</option>'; }).join('') + '</select>') +
      '<p class="field-help">' + o.why + ' Die Schicht wird direkt im Wochenplan ergänzt. Alternativ bleibt sie in der App ausgeschrieben.</p>',
      (S.assigned[key] !== undefined ? button('Wieder ausschreiben', 'unassign') : '') + button('Zuweisen', 'confirm-assign', 'primary', 'check'));
  }
  function conflictsDialog() {
    var w = C.warnings();
    modal('Planungshinweise', w.length ? w.map(function (x) { return '<div class="notice ' + x.kind + '">' + icon('warning') + '<div><strong>' + (x.kind === 'bad' ? 'Regelverstoss: ' : 'Warnung: ') + x.title + '</strong><small>' + x.body + '</small><button class="button text small" data-fix="' + x.person + '-' + x.day + '">' + icon('edit') + 'Schicht anpassen</button></div></div>'; }).join('') : '<div class="notice good">' + icon('check') + '<div>Keine Hinweise offen.<small>Ruhezeit, Wochenstunden und Verfügbarkeit sind eingehalten.</small></div></div>', button('Fertig', 'modal-close', 'primary'));
  }
  function publishDialog() {
    var wc = C.warnCounts();
    modal(S.published ? 'Plan ist veröffentlicht' : 'Wochenplan veröffentlichen',
      (wc.all.length ? '<div class="notice ' + (wc.bad ? 'bad' : 'warn') + '">' + icon('warning') + '<div><strong>' + wc.bad + ' Regelverstoss, ' + wc.warn + ' Warnungen offen</strong><small>' + wc.all.map(function (w) { return w.summary; }).join(' · ') + '</small></div></div>' : '<div class="notice good">' + icon('check') + '<div><strong>Keine Hinweise offen.</strong><small>Der Plan ist bereit.</small></div></div>') +
      '<p class="small">Der Plan für ' + 'KW ' + (43 + S.week) + ' wird in der Mitarbeiter-App sichtbar. ' + C.openLeft().length + (C.openLeft().length === 1 ? ' offene Schicht bleibt' : ' offene Schichten bleiben') + ' zum Übernehmen ausgeschrieben. Im Prototyp wird niemand benachrichtigt.</p>' +
      (wc.bad ? field('Begründung für den Regelverstoss', '<input id="pub-reason" placeholder="z. B. mit Nina abgesprochen, Ausgleich am Montag">') : '') +
      '<label class="checkbox"><input type="checkbox" id="pub-check">Ich habe den Plan und die Hinweise geprüft.</label>',
      button('Veröffentlichen', 'confirm-publish', 'primary', 'send'));
  }
  function orderAction(id) {
    var o = C.orderOf(D.orders.filter(function (x) { return x.id === id; })[0]); if (!o || !o.action) return;
    var set = function (st, msg) { S.orderState[id] = Object.assign({}, S.orderState[id], st); C.write('orders', S.orderState); render(); toast(msg); };
    if (o.action === 'Bestätigen') return set({ status: 'kueche', action: null }, 'Bestellung #' + id + ' bestätigt und an die Küche gesendet.');
    if (o.action === 'Abholung bestätigen') return set({ status: 'bezahlt', action: null }, 'Abholung #' + id + ' übergeben. Bezahlt mit TWINT.');
    if (o.action === 'Kurier anrufen') { orderAction.pending = id; return modal('Kurier anrufen', '<div class="summary-line"><span>Kurier</span><strong>Velokurier St. Gallen</strong></div><div class="summary-line"><span>Telefon</span><a class="mono accent" href="tel:+41710000099">+41 71 000 00 99</a></div><div class="summary-line"><span>Lieferung</span><span>#' + id + ', ' + esc(o.where) + '</span></div><p class="field-help">Nach dem Anruf als unterwegs markieren. Der Gast erhält eine SMS mit der neuen Zeit.</p>', button('Als unterwegs markieren', 'courier-done', 'primary', 'check')); }
    if (o.action === 'Rechnung senden') { orderAction.pending = id; return modal('Rechnung senden', field('Rechnungsadresse', '<textarea rows="3">Bühler Treuhand AG\nMarktgasse 4\n9000 St. Gallen</textarea>') + field('E-Mail', '<input type="email" value="buchhaltung@buehler.example.ch">') + '<div class="summary-line"><span>Betrag</span><strong class="mono">' + C.chf(o.total) + '</strong></div><p class="field-help">Zahlbar in 30 Tagen. QR-Rechnung als PDF.</p>', button('Rechnung senden', 'invoice-done', 'primary', 'send')); }
  }

  /* ---------- actions ---------- */
  var A = {
    'noop': function () {}, 'retry': function () { toast('Verbindung wiederhergestellt. Änderungen gespeichert.'); },
    'nav': function () { $('#rail').classList.add('open'); $('.mobile-nav-shade').classList.add('open'); },
    'nav-close': function () { $('#rail').classList.remove('open'); $('.mobile-nav-shade').classList.remove('open'); },
    'theme': function () { U.setLook(U.theme() === 'dark' ? 'light' : 'dark', U.palette()); render(); },
    'palette': function () { U.openPal(); },
    'shortcuts': function () { U.shortcutsDialog(); },
    'modal-close': closeModal,
    'week-prev': function () { S.week = Math.max(-1, S.week - 1); render(); toast('Vorherige Woche, Beispielbelegung'); },
    'week-next': function () { S.week = Math.min(1, S.week + 1); render(); toast('Nächste Woche, Beispielbelegung'); },
    'week-today': function () { S.week = 0; render(); },
    'add-shift': function (el) { var d = el && el.dataset.day ? Number(el.dataset.day) : 4; var free = D.staff.findIndex(function (_, i) { return !C.isWork(C.shiftOf(i, d)) && C.shiftOf(i, d) !== 'F'; }); shiftDialog(free < 0 ? 0 : free, d); },
    'save-shift': function () {
      var i = Number($('#sh-person').value), d = Number($('#sh-day').value), s = Number($('#sh-start').value), e = Number($('#sh-end').value), old = shiftDialog.key;
      if (e <= s) { toast('Das Ende muss nach dem Beginn liegen.'); return; }
      if (C.shiftOf(i, d) === 'F') { toast(D.staff[i].name + ' hat an diesem Tag Ferien.'); return; }
      if (old && (old[0] !== i || old[1] !== d) && C.isWork(C.shiftOf(old[0], old[1]))) S.edits[old[0] + '-' + old[1]] = null;
      S.edits[i + '-' + d] = [s, e]; closeModal(); planChanged('Schicht gespeichert. Der Plan ist wieder im Entwurf.');
    },
    'delete-shift': function () { var k = shiftDialog.key; S.edits[k[0] + '-' + k[1]] = null; Object.keys(S.assigned).forEach(function (key) { var o = D.openShifts.filter(function (x) { return x.key === key; })[0]; if (S.assigned[key] === k[0] && o.day === k[1]) delete S.assigned[key]; }); closeModal(); planChanged('Schicht entfernt.'); },
    'publish': publishDialog,
    'confirm-publish': function () {
      if (!$('#pub-check').checked) { toast('Bitte zuerst bestätigen, dass die Hinweise geprüft sind.'); return; }
      var r = $('#pub-reason'); if (r && !r.value.trim()) { toast('Bitte den Regelverstoss kurz begründen.'); r.focus(); return; }
      S.published = true; persistAll(); closeModal(); render(); toast('Der Plan ist veröffentlicht. Das Team sieht die neue Version.');
    },
    'conflicts': conflictsDialog, 'go-check': function () { location.href = U.href('planning', { check: '1' }); }, 'go-open': function () { location.href = U.href('planning') + '#offen'; },
    'assign': function (el) { assignDialog(el.dataset.key); },
    'confirm-assign': function () {
      var key = assignDialog.key, o = D.openShifts.filter(function (x) { return x.key === key; })[0], p = Number($('#as-person').value);
      if (S.assigned[key] !== undefined) S.edits[S.assigned[key] + '-' + o.day] = null;
      S.assigned[key] = p; S.edits[p + '-' + o.day] = [o.start, o.end]; closeModal(); planChanged('Schicht an ' + D.staff[p].name + ' zugewiesen. Die Lücke ist geschlossen.');
    },
    'unassign': function () { var key = assignDialog.key, o = D.openShifts.filter(function (x) { return x.key === key; })[0]; S.edits[S.assigned[key] + '-' + o.day] = null; delete S.assigned[key]; closeModal(); planChanged('Schicht ist wieder ausgeschrieben.'); },
    'call-luca': function () { modal('Luca Baumann anrufen', '<div class="summary-line"><span>Telefon</span><a class="mono accent" href="tel:+41790000008">+41 79 000 00 08</a></div><div class="summary-line"><span>Geplant</span><span class="mono">18:00-24:00</span></div><div class="summary-line"><span>Verfügbar</span><span class="mono">ab 19:00</span></div><p class="field-help">Die Schicht liegt ausserhalb seiner Verfügbarkeit. Für nächste Woche im Wochenplan anpassen.</p>', button('Zum Wochenplan', 'go-check', 'primary')); },
    'courier-done': function () { var id = orderAction.pending; S.orderState[id] = { status: 'unterwegs', action: null }; C.write('orders', S.orderState); closeModal(); render(); toast('Lieferung #' + id + ' ist unterwegs. Der Gast wurde informiert.'); },
    'invoice-done': function () { var id = orderAction.pending; S.orderState[id] = { status: 'fakturiert', action: null }; C.write('orders', S.orderState); closeModal(); render(); toast('Rechnung für #' + id + ' gesendet.'); },
    'orders-reset': function () { S.orderQuery = ''; S.orderChannel = 'Alle'; S.orderTab = 'all'; render(); },
    'orders-export': function () { var rows = PT.orderRows(); csv('nordane-bestellungen-2026-10-23.csv', [['Nr', 'Zeit', 'Kanal', 'Tisch oder Gast', 'Positionen', 'Status', 'Zahlung', 'Betrag CHF']].concat(rows.map(function (o) { return [o.id, o.time, o.channel, o.where, o.items.map(function (it) { return it[1] + 'x ' + C.menuById[it[0]].name; }).join(', '), C.STATUS[o.status][1], o.pay || 'offen', o.total.toFixed(2)]; }))); },
    'new-order': function () { modal('Bestellung erfassen', '<div class="form-grid">' + field('Kanal', '<select><option>Telefon, Abholung</option><option>Kasse</option><option>Lieferung</option></select>') + field('Zeit', '<input type="time" value="20:15">') + '</div>' + field('Name des Gasts', '<input id="no-name" placeholder="z. B. Familie Rüegg">') + field('Positionen', '<select>' + D.menu.map(function (m) { return '<option>' + m.name + ', ' + C.chf(m.price) + '</option>'; }).join('') + '</select>') + '<p class="field-help">Bestellungen im Service entstehen an der Kasse. Hier werden Telefon- und Firmenbestellungen erfasst.</p>', button('Erfassen', 'simple-save', 'primary', 'check')); },
    'payment': function (el) { var id = Number(el.dataset.id), o = C.orderOf(D.orders.filter(function (x) { return x.id === id; })[0]); A.payment.id = id; modal('Zahlung erfassen', '<div class="between"><span>Offener Betrag</span><strong class="mono" style="font-size:24px">' + C.chf(o.total) + '</strong></div>' + field('Zahlungsart', '<select id="pay-method"><option>Karte</option><option>TWINT</option><option>Bar</option><option>Rechnung</option></select>', 'Karte: zuerst am eigenen Terminal abschliessen. TWINT: QR an der Kasse.'), button('Zahlung bestätigen', 'confirm-payment', 'primary', 'check')); },
    'confirm-payment': function () { var id = A.payment.id, m = $('#pay-method').value; S.orderState[id] = Object.assign({}, S.orderState[id], { status: m === 'Rechnung' ? 'fakturiert' : 'bezahlt', pay: m, action: null }); C.write('orders', S.orderState); closeModal(); render(); toast('Zahlung für #' + id + ' erfasst: ' + m + '.'); },
    'print': function () { window.print(); },
    'add-menu': function () { var id = 'neu' + Date.now(); D.menu.push({ id: id, name: 'Neuer Artikel', cat: S.menuCat === 'Alle' ? 'Hauptgerichte' : S.menuCat, price: 0, allergens: '', vat: 'food', note: 'Neu in der Herbstkarte', sold: 0 }); C.menuById[id] = D.menu[D.menu.length - 1]; S.menuSel = id; render(); setTimeout(function () { var n = $('#item-name'); if (n) { n.focus(); n.select(); } }, 30); },
    'menu-close': function () { S.menuSel = null; render(); },
    'save-menu': function () {
      var name = $('#item-name').value.trim(), price = Number($('#item-price').value);
      if (!name) { toast('Bitte einen Namen eingeben.'); return; } if (!isFinite(price) || price < 0) { toast('Bitte einen gültigen Preis eingeben.'); return; }
      var al = $$('[data-chip]').filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; }).map(function (c) { return c.textContent; }).join(', ') || 'Keine';
      var e = { name: name, price: price, cat: $('#item-category').value, note: $('#item-note').value, vat: $('#item-vat').value, allergens: al };
      var base = C.menuById[S.menuSel]; if (base && /^neu/.test(S.menuSel)) Object.assign(base, e); else { S.menuEdits[S.menuSel] = e; C.write('menu', S.menuEdits); }
      S.soldout[S.menuSel] = !$('#item-avail').checked; C.write('soldout', S.soldout); render(); toast('Artikel gespeichert: ' + name + '.');
    },
    'invite': function () { modal('Person einladen', field('Name', '<input placeholder="Vorname Nachname">') + field('Mobilnummer', '<input type="tel" placeholder="+41 79 000 00 00">') + field('Bereich', '<select><option>Service</option><option>Bar</option><option>Küche</option><option>Abwasch</option></select>') + '<p class="field-help">Die Person erhält per SMS einen Link zur Mitarbeiter-App.</p>', button('Einladung senden', 'simple-save', 'primary', 'send')); },
    'edit-profile': function () { modal('Profil bearbeiten', field('Pensum', '<select><option>100 %</option><option>90 %</option><option>80 %</option><option>60 %</option><option>Stundenlohn</option></select>') + field('Rolle', '<select><option>Service</option><option>Service, Schichtleitung</option><option>Bar</option><option>Küche</option></select>') + field('Vertraglicher Monatslohn in CHF', '<input type="number" value="4230" min="0" step="0.05">'), button('Speichern', 'simple-save', 'primary')); },
    'availability': function () { modal('Verfügbarkeit anpassen', D.dayLong.map(function (n) { return '<label class="checkbox"><input type="checkbox" checked>' + n + ' verfügbar</label>'; }).join(''), button('Speichern', 'simple-save', 'primary')); },
    'leave': function () { modal('Eine Anfrage stellen', field('Art', '<select id="leave-type"><option>Ferien</option><option>Schichttausch</option><option>Krankmeldung</option></select>') + '<div class="form-grid">' + field('Von', '<input type="date" value="2026-11-09">') + field('Bis', '<input type="date" value="2026-11-13">') + '</div>' + field('Nachricht an Lena', '<textarea rows="3" placeholder="Optional"></textarea>'), button('Anfrage senden', 'send-leave', 'primary', 'send')); },
    'send-leave': function () { var t = $('#leave-type').value; closeModal(); toast(t + ': Deine Anfrage ist bei Lena.'); },
    'clock': function () { S.clockOut = !S.clockOut; C.write('clock', S.clockOut); render(); toast(S.clockOut ? 'Du bist ausgestempelt. Gute Erholung.' : 'Du bist wieder eingestempelt.'); },
    'claim': function () { if (S.claimed) return; S.claimed = true; C.write('claimed', true); render(); toast('Deine Anfrage für Samstag ist bei Lena.'); },
    'time-entry': function () { modal('Zeiteintrag ergänzen', field('Mitarbeiter:in', '<select>' + D.staff.map(function (p) { return '<option>' + p.name + '</option>'; }).join('') + '</select>') + field('Datum', '<input type="date" value="2026-10-23">') + '<div class="form-grid">' + field('Beginn', '<input type="time" value="17:00">') + field('Ende', '<input type="time" value="23:00">') + '</div>' + field('Grund', '<input placeholder="z. B. Ausstempeln vergessen">'), button('Eintrag speichern', 'simple-save', 'primary')); },
    'review-time': function () { modal('Zeiteinträge prüfen', '<div class="summary-line"><div>Nina Graf, 23.10.<span class="table-secondary">Pause fehlt</span></div><select aria-label="Ninas Pause"><option>30 Minuten</option><option>15 Minuten</option></select></div><div class="summary-line"><div>Luca Baumann, 22.10.<span class="table-secondary">Ausstempelzeit fehlt</span></div><input type="time" value="23:00" aria-label="Lucas Ende"></div><div class="summary-line"><div>Ben Schmid, 21.10.<span class="table-secondary">Pause fehlt</span></div><select aria-label="Bens Pause"><option>30 Minuten</option><option>60 Minuten</option></select></div>', button('Korrekturen freigeben', 'simple-save', 'primary', 'check')); },
    'month-close': function () { modal('Oktober abschliessen', '<p class="small">Im Demoabschluss werden die vorhandenen Beispielzeiten freigegeben.</p><div class="summary-line"><span>Erfasste Stunden</span><span class="mono">1\'128 h 30</span></div><div class="summary-line"><span>Mitarbeitende</span><span class="mono">14</span></div><label class="checkbox"><input type="checkbox" id="month-check">Demoabschluss bestätigen</label>', button('Abschluss bestätigen', 'confirm-month', 'primary')); },
    'confirm-month': function () { if (!$('#month-check').checked) { toast('Bitte den Demoabschluss bestätigen.'); return; } S.monthClosed = true; C.write('monthclosed', true); closeModal(); render(); toast('Monatsabschluss gespeichert. Export ist bereit.'); },
    'payroll-export': function () { modal('Lohnexport erstellen', field('Zielformat', '<select id="pr-format"><option>bexio Lohn CSV</option><option>Abacus CSV</option></select>') + field('Zeitraum', '<select id="pr-period"><option value="2026-10">Oktober 2026, Zwischenstand</option><option value="2026-09">September 2026, abgeschlossen</option></select>') + '<div class="notice">' + icon('help') + '<div>Enthält freigegebene Zeiten, Absenzen und Salden.<small>Demo-CSV. Importfelder mit dem Zielsystem abstimmen.</small></div></div>', button('CSV herunterladen', 'download-payroll', 'primary', 'download')); },
    'download-payroll': function () { var f = $('#pr-format').value, p = $('#pr-period').value; closeModal(); csv('nordane-' + (f.indexOf('bexio') === 0 ? 'bexio' : 'abacus') + '-' + p + '-demo.csv', [['Personalnummer', 'Name', 'Periode', 'Pensum', 'Stunden_Woche_43', 'Soll_Woche']].concat(D.staff.map(function (s, i) { return [String(i + 1).padStart(3, '0'), s.name, p, s.pensum, C.personHours(i).toFixed(2), s.target.toFixed(2)]; }))); },
    'create-template': function () { modal('Vorlage erstellen', field('Name', '<input placeholder="z. B. Feiertagswoche">') + field('Basis', '<select><option>Aktueller Wochenplan</option><option>Leere Vorlage</option></select>'), button('Vorlage speichern', 'simple-save', 'primary')); },
    'apply-template': function (el) { modal('Vorlage anwenden', '<p>«' + esc(el.dataset.name) + '» für KW 44 verwenden?</p><p class="field-help">Bestehende Schichten bleiben. Neue Schichten kommen als Entwurf dazu.</p>', button('Anwenden', 'simple-save', 'primary')); },
    'night-model': function () { modal('Nachtarbeit', field('Modell', '<select><option>Vorübergehend, 25 % Lohnzuschlag</option><option>Regelmässig, 10 % Zeitzuschlag</option></select>'), button('Speichern', 'simple-save', 'primary')); },
    'sunday-model': function () { modal('Sonntagsarbeit', field('Modell', '<select><option>Vorübergehend, 50 % Lohnzuschlag</option><option>Regelmässig, betriebliches Modell</option></select>'), button('Speichern', 'simple-save', 'primary')); },
    'daily-close': function () { modal('Tagesabschluss vorbereiten', '<div class="summary-line"><span>Erfasste Zahlungen</span><strong class="mono">CHF 6\'694.00</strong></div><div class="summary-line"><span>Erwarteter Kassenbestand</span><strong class="mono">CHF 1\'170.50</strong></div>' + field('Gezähltes Bargeld in CHF', '<input id="close-cash" type="number" value="1170.50" step="0.05">') + '<p class="field-help">Erstellt den Z-Bericht Z-2026-1023. Offene Bestellungen müssen vorher bezahlt oder übertragen sein.</p>', button('Z-Bericht erstellen', 'confirm-close', 'primary', 'check')); },
    'confirm-close': function () { if (!$('#close-cash').value) { toast('Bitte den Kassenbestand eingeben.'); return; } S.closed = true; C.write('closed', true); closeModal(); render(); toast('Z-2026-1023 erstellt.'); },
    'cash-count': function () { modal('Bargeld zählen', field('Gezählter Bestand in CHF', '<input type="number" step="0.05" value="1170.50">') + '<div class="summary-line"><span>Erwarteter Bestand</span><span class="mono">CHF 1\'170.50</span></div>', button('Zählung speichern', 'simple-save', 'primary')); },
    'report-export': function () { csv('nordane-tagesbericht-2026-10-23.csv', [['Datum', 'Position', 'Betrag_CHF'], ['2026-10-23', 'Bruttoumsatz', '6694.00'], ['2026-10-23', 'Nettoumsatz', '6216.02'], ['2026-10-23', 'MWST 8.1%', '465.92'], ['2026-10-23', 'MWST 2.6%', '12.06']].concat(D.tenders.map(function (t) { return ['2026-10-23', t.label, t.amount.toFixed(2)]; }))); },
    'save-settings': function () { var f = $('#settings-form'); if (!f.reportValidity()) return; C.write('settings', Object.fromEntries(new FormData(f))); toast('Betriebseinstellungen gespeichert.'); },
    'payment-settings': function () { modal('Zahlungen konfigurieren', field('Kartenzahlung', '<select><option>Eigenes Terminal, extern abgewickelt</option></select>') + field('TWINT Händlerkonto', '<input value="•• 1742">') + '<label class="checkbox"><input type="checkbox" checked>Rechnung für Firmenkunden erlauben</label><label class="checkbox"><input type="checkbox" checked>Barzahlungen erfassen</label>', button('Speichern', 'simple-save', 'primary')); },
    'connect-device': function () { modal('Gerät verbinden', '<p class="small">Diesen Code auf dem neuen Gerät eingeben.</p><div class="mono" style="font-size:36px;letter-spacing:5px;text-align:center;padding:18px;background:var(--tint)">482 719</div>', button('Fertig', 'modal-close', 'primary')); },
    'simple-save': function () { closeModal(); toast('Gespeichert.'); }
  };

  function csv(name, rows) {
    var body = '﻿' + rows.map(function (r) { return r.map(function (x) { return '"' + String(x).replace(/"/g, '""') + '"'; }).join(';'); }).join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/csv;charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); toast('CSV-Datei erstellt: ' + name);
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action],[data-palette],[data-bg],[data-order-tab],[data-channel],[data-order-action],[data-menu-cat],[data-menu-edit],[data-soldout],[data-chip],[data-shift],[data-open],[data-area],[data-mobday],[data-request],[data-rule],[data-toggle],[data-fix],tr[data-href]');
    if (!el) return;
    var ds = el.dataset;
    if (ds.action) { e.preventDefault(); if (A[ds.action]) A[ds.action](el); return; }
    if (ds.bg) { U.setBg(ds.bg); render(); toast(ds.bg === 'mountains' ? 'Hintergrund: Berge im Abendlicht.' : 'Hintergrund: nur Glow.'); return; }
    if (ds.palette) { U.setLook(U.theme(), ds.palette); render(); toast('Palette ' + ds.palette.toUpperCase() + ': ' + { c: 'Glow. Eisblau bedient, Koralle leuchtet nur im Hintergrund.', a: 'Eisblau hell, Koralle dunkel.', b: 'Koralle hell, Eisblau dunkel.' }[ds.palette]); return; }
    if (ds.orderAction) { e.preventDefault(); e.stopPropagation(); orderAction(Number(ds.orderAction)); return; }
    if (ds.orderTab) { S.orderTab = ds.orderTab; S.orderSel = 0; refreshOrders(); return; }
    if (ds.channel) { S.orderChannel = ds.channel; S.orderSel = 0; $$('[data-channel]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === el)); }); refreshOrders(); return; }
    if (ds.menuCat) { S.menuCat = ds.menuCat; render(); return; }
    if (ds.menuEdit) { e.preventDefault(); S.menuSel = ds.menuEdit; render(); setTimeout(function () { var n = $('#item-name'); if (n) n.focus(); }, 30); return; }
    if (ds.soldout) { var id = ds.soldout; S.soldout[id] = !S.soldout[id]; C.write('soldout', S.soldout); $('#menu-table').innerHTML = PT.menuTable(); toast(S.soldout[id] ? 'Als ausverkauft markiert. Kasse und Tisch-QR zeigen es sofort.' : 'Wieder verfügbar.'); return; }
    if (el.hasAttribute('data-chip')) { el.setAttribute('aria-pressed', String(el.getAttribute('aria-pressed') !== 'true')); return; }
    if (ds.shift) { var p = ds.shift.split('-').map(Number); shiftDialog(p[0], p[1]); return; }
    if (ds.fix) { var f = ds.fix.split('-').map(Number); shiftDialog(f[0], f[1]); return; }
    if (ds.open) { assignDialog(ds.open); return; }
    if (ds.area) { S.area = ds.area; render(); return; }
    if (ds.mobday) { S.mobDay = Number(ds.mobday); render(); return; }
    if (ds.request) {
      if (ds.answer === 'ask') { modal('Rückfrage zur Krankmeldung', field('Nachricht an Lea', '<textarea rows="3">Gute Besserung. Brauchst du ein Arztzeugnis ab dem dritten Tag?</textarea>'), button('Senden', 'simple-save', 'primary', 'send')); return; }
      S.requests[ds.request] = ds.answer; C.write('requests', S.requests); render(); toast('Anfrage ' + ds.answer.toLowerCase() + '. Die Person sieht es in der App.'); return;
    }
    if (ds.rule) { S.rules[ds.rule] = S.rules[ds.rule] === false; C.write('rules', S.rules); render(); toast('Regel ' + (S.rules[ds.rule] !== false ? 'aktiviert' : 'deaktiviert') + '.'); return; }
    if (ds.toggle) { el.setAttribute('aria-checked', String(el.getAttribute('aria-checked') !== 'true')); return; }
    if (ds.href && !e.target.closest('a,button')) { location.href = ds.href; }
  });
  $('#dialog').addEventListener('click', function (e) { if (e.target === $('#dialog')) { var r = e.target.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeModal(); } });

  function typing(t) { return t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable); }
  document.addEventListener('keydown', function (e) {
    var k = e.key;
    if ((e.metaKey || e.ctrlKey) && k.toLowerCase() === 'k') { e.preventDefault(); if (U.palIsOpen()) U.closePal(); else U.openPal(); return; }
    if (k === 'Escape') { A['nav-close'](); return; }
    if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey || $('#dialog').open || U.palIsOpen()) return;
    if (/^[1-6]$/.test(k)) { location.href = U.href(U.NAV[Number(k) - 1][0]); return; }
    if (k === '?') { U.shortcutsDialog(); return; }
    if (k === '/') { var s = $('#order-search') || $('#menu-search'); e.preventDefault(); if (s) s.focus(); else U.openPal(); return; }
    if (k === 'n' || k === 'N') {
      var map = { orders: 'new-order', menu: 'add-menu', planning: 'add-shift', day: 'add-shift', team: 'invite' };
      if (map[view]) { e.preventDefault(); A[map[view]]($('[data-action="' + map[view] + '"]')); }
      return;
    }
    if ((k === 'j' || k === 'k') && view === 'orders') {
      var n = PT.orderRows().length; if (!n) return;
      S.orderSel = Math.max(0, Math.min(n - 1, S.orderSel + (k === 'j' ? 1 : -1)));
      $$('#orders-region tr[data-row]').forEach(function (tr) { tr.classList.toggle('sel', Number(tr.dataset.row) === S.orderSel); });
      var cur = $('#orders-region tr.sel'); if (cur) cur.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (k === 'Enter' && view === 'orders') { var r = $('#orders-region tr.sel'); if (r) location.href = r.dataset.href; }
  });

  /* ---------- boot ---------- */
  try {
    render();
    var q = C.query;
    if (view === 'planning' && q.get('publish')) publishDialog();
    if (view === 'planning' && q.get('check')) conflictsDialog();
    if ((view === 'planning' || view === 'day') && q.get('add')) A['add-shift']();
    if (view === 'reports' && q.get('close')) A['daily-close']();
    if (view === 'time' && q.get('export')) A['payroll-export']();
    if (view === 'planning' && q.get('open')) assignDialog(q.get('open'));
    if (q.get('palette-open')) U.openPal();
    if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(function () { t.scrollIntoView(); }, 50); }
    NBF.ui.render = render;
  } catch (err) {
    document.getElementById('app').innerHTML = '<div class="boot-error"><h1>Die Ansicht konnte nicht geladen werden.</h1><p>Bitte die Seite neu laden. Falls das nicht hilft, den Browser-Cache für diese Seite leeren.</p><code>' + esc(err && err.stack || err) + '</code></div>';
    if (window.console) console.error(err);
  }
})();
