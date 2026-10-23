/* Core: storage, helpers, rota logic. Attaches to window.NBF only. */
(function () {
  'use strict';
  var NBF = (window.NBF = window.NBF || {});
  var D = NBF.data;
  var PREFIX = 'nbf1-';

  function read(key, fallback, ok) {
    try {
      var raw = localStorage.getItem(PREFIX + key);
      if (raw == null) return fallback;
      var v = JSON.parse(raw);
      return ok && !ok(v) ? fallback : v;
    } catch (e) { return fallback; }
  }
  function write(key, value) { try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) {} }
  var isObj = function (v) { return v && typeof v === 'object' && !Array.isArray(v); };
  var isBool = function (v) { return typeof v === 'boolean'; };

  var query = new URLSearchParams(location.search);
  var state = {
    edits: read('edits', {}, isObj),
    assigned: read('assigned', {}, isObj),
    published: read('published', false, isBool),
    requests: read('requests', {}, isObj),
    soldout: read('soldout', {}, isObj),
    menuEdits: read('menu', {}, isObj),
    orderState: read('orders', {}, isObj),
    clockOut: read('clock', false, isBool),
    claimed: read('claimed', false, isBool),
    closed: read('closed', false, isBool),
    monthClosed: read('monthclosed', false, isBool),
    rules: read('rules', {}, isObj),
    week: 0, area: 'Alle', mobDay: 4,
    orderTab: 'all', orderChannel: 'Alle', orderQuery: '', orderSel: 0,
    menuCat: 'Alle', menuQuery: '', menuSel: null
  };

  /* ---------- formatting ---------- */
  function group(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "'"); }
  function num(n, d) { var s = Number(n).toFixed(d == null ? 2 : d).split('.'); return group(s[0]) + (s[1] ? '.' + s[1] : ''); }
  function chf(n, d) { return 'CHF ' + num(n, d); }
  function hm(h) { var H = Math.floor(h + 1e-9), m = Math.round((h - H) * 60); return String(H).padStart(2, '0') + ':' + String(m).padStart(2, '0'); }
  function hl(v) { var h = Math.floor(v + 1e-9), m = Math.round((v - h) * 60); return h + ' h' + (m ? ' ' + String(m).padStart(2, '0') : ''); }
  function hshort(h) { var H = Math.floor(h), m = Math.round((h - H) * 60); return m ? H + ':' + String(m).padStart(2, '0') : String(H); }
  function range(s) { return hm(s[0]) + '-' + hm(s[1]); }
  function rangeShort(s) { return hshort(s[0]) + '-' + hshort(s[1]); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function first(i) { return D.staff[i].name.split(' ')[0]; }

  /* ---------- rota ---------- */
  function base(i, d) { return D.shifts[i][d]; }
  function shiftOf(i, d) { var k = i + '-' + d; return Object.prototype.hasOwnProperty.call(state.edits, k) ? state.edits[k] : base(i, d); }
  function isWork(s) { return Array.isArray(s); }
  function net(s) { return isWork(s) ? Math.max(0, s[1] - s[0] - 0.5) : 0; }
  function personHours(i) { var t = 0; for (var d = 0; d < 7; d++) t += net(shiftOf(i, d)); return t; }
  function dayHours(d) { var t = 0; D.staff.forEach(function (_, i) { t += net(shiftOf(i, d)); }); return t; }
  function dayCount(d) { return D.staff.filter(function (_, i) { return isWork(shiftOf(i, d)); }).length; }
  function dayCost(d) { return dayHours(d) * D.costRate; }
  function weekHours() { var t = 0; for (var d = 0; d < 7; d++) t += dayHours(d); return t; }
  function weekCost() { return weekHours() * D.costRate; }
  function weekForecast() { return D.forecast.reduce(function (a, b) { return a + b; }, 0); }
  function changed(i, d) {
    var k = i + '-' + d;
    if (Object.prototype.hasOwnProperty.call(state.edits, k)) return JSON.stringify(state.edits[k]) !== JSON.stringify(base(i, d));
    return (i === 4 && d === 5) || (i === 7 && d === 4);
  }
  function changeCount() { var n = 0; for (var i = 0; i < D.staff.length; i++) for (var d = 0; d < 7; d++) if (changed(i, d)) n++; return n; }

  var SLOT0 = 9, SLOTS = 30; /* 09:00 to 24:00 in half hours */
  function plannedAt(d, t, useBase) {
    var n = 0;
    D.staff.forEach(function (_, i) { var s = useBase ? base(i, d) : shiftOf(i, d); if (isWork(s) && s[0] <= t && s[1] > t) n++; });
    return n;
  }
  function neededAt(d, t) {
    var n = plannedAt(d, t, true);
    (D.deficits[d] || []).forEach(function (w) { if (w[0] <= t && w[1] > t) n++; });
    return n;
  }
  function coverage(d) {
    var slots = [], gaps = [];
    for (var k = 0; k < SLOTS; k++) {
      var t = SLOT0 + k / 2, need = neededAt(d, t), have = plannedAt(d, t);
      var st = need === 0 && have === 0 ? 'closed' : have >= need ? 'ok' : 'gap';
      slots.push({ t: t, need: need, have: have, st: st });
    }
    slots.forEach(function (s) {
      if (s.st !== 'gap') return;
      var last = gaps[gaps.length - 1];
      if (last && last[1] === s.t) last[1] = s.t + 0.5; else gaps.push([s.t, s.t + 0.5]);
    });
    return { slots: slots, gaps: gaps };
  }

  function warnings() {
    var out = [];
    if (state.rules.rest !== false) {
      D.staff.forEach(function (p, i) {
        for (var d = 0; d < 6; d++) {
          var a = shiftOf(i, d), b = shiftOf(i, d + 1);
          if (!isWork(a) || !isWork(b)) continue;
          var rest = 24 - a[1] + b[0];
          if (rest < 11) out.push({ id: 'rest-' + i, kind: 'bad', person: i, day: d + 1, short: hl(rest) + ' Ruhezeit', summary: first(i) + ': ' + hl(rest) + ' Ruhezeit', title: p.name + ', Ruhezeit', body: 'Zwischen ' + D.dayLong[d] + ' und ' + D.dayLong[d + 1] + ' liegen ' + hl(rest) + ' statt 11 h. Später beginnen lassen oder die Schicht davor früher beenden.' });
        }
      });
    }
    if (state.rules.hours !== false) {
      D.staff.forEach(function (p, i) {
        var h = personHours(i);
        if (h > p.target + 0.01) {
          var lastDay = 6; while (lastDay > 0 && !isWork(shiftOf(i, lastDay))) lastDay--;
          out.push({ id: 'hours-' + i, kind: 'warn', person: i, day: lastDay, short: hl(h) + ' geplant', summary: first(i) + ': ' + hl(h) + ' bei ' + hl(p.target) + ' Soll', title: p.name + ', Wochenstunden', body: hl(h) + ' netto geplant bei ' + hl(p.target) + ' vertraglichem Pensum. Schichten und Ausgleich prüfen.' });
        }
      });
    }
    if (state.rules.availability !== false) {
      Object.keys(D.availability).forEach(function (k) {
        var parts = k.split('-').map(Number), i = parts[0], d = parts[1], s = shiftOf(i, d), av = D.availability[k];
        if (!isWork(s)) return;
        if (av === null) out.push({ id: 'av-' + k, kind: 'warn', person: i, day: d, short: 'nicht verfügbar', summary: first(i) + ': ' + D.dayLong[d] + ' nicht verfügbar', title: D.staff[i].name + ', Verfügbarkeit', body: D.dayLong[d] + ' ist als nicht verfügbar hinterlegt.' });
        else if (s[0] < av[0] || s[1] > av[1]) out.push({ id: 'av-' + k, kind: 'warn', person: i, day: d, short: 'verfügbar ab ' + hm(av[0]), summary: first(i) + ': ausserhalb der Verfügbarkeit', title: D.staff[i].name + ', Verfügbarkeit', body: D.dayLong[d] + ' verfügbar ab ' + hm(av[0]) + '. Die Schicht beginnt um ' + hm(s[0]) + '.' });
      });
    }
    out.sort(function (a, b) { return a.kind === b.kind ? 0 : a.kind === 'bad' ? -1 : 1; });
    return out;
  }
  function warnCounts() { var w = warnings(); return { bad: w.filter(function (x) { return x.kind === 'bad'; }).length, warn: w.filter(function (x) { return x.kind === 'warn'; }).length, all: w }; }
  function openLeft() { return D.openShifts.filter(function (o) { return state.assigned[o.key] === undefined; }); }

  /* ---------- orders ---------- */
  var menuById = {};
  D.menu.forEach(function (m) { menuById[m.id] = m; });
  function menuItem(id) { var m = menuById[id]; var e = state.menuEdits[id]; return e ? Object.assign({}, m, e) : m; }
  function orderOf(o) {
    var s = state.orderState[o.id] || {};
    var r = Object.assign({}, o, s);
    r.total = o.items.reduce(function (t, it) { return t + menuById[it[0]].price * it[1]; }, 0);
    r.takeaway = o.channel === 'Abholung' || o.channel === 'Lieferung';
    return r;
  }
  function orders() { return D.orders.map(orderOf); }
  function needsAction() { return orders().filter(function (o) { return !!o.action; }); }
  var STATUS = {
    neu: ['accent dot', 'Neu'], kueche: ['ink dot', 'In der Küche'], bereit: ['good dot', 'Bereit'], verspaetet: ['bad dot', 'Verspätet'],
    serviert: ['outline', 'Serviert'], unterwegs: ['ink dot', 'Unterwegs'], fakturiert: ['outline', 'Rechnung gesendet'],
    bezahlt: ['', 'Bezahlt'], storniert: ['', 'Storniert'], erstattet: ['warn', 'Rückerstattet']
  };
  var RUNNING = ['neu', 'kueche', 'bereit', 'verspaetet', 'serviert', 'unterwegs'];
  function vatOf(o) {
    var r81 = 0, r26 = 0;
    o.items.forEach(function (it) { var m = menuById[it[0]], g = m.price * it[1]; if (m.vat === 'alcohol' || !o.takeaway) r81 += g; else r26 += g; });
    return { g81: r81, v81: r81 * 8.1 / 108.1, g26: r26, v26: r26 * 2.6 / 102.6 };
  }

  NBF.core = {
    read: read, write: write, state: state, query: query,
    group: group, num: num, chf: chf, hm: hm, hl: hl, range: range, rangeShort: rangeShort, esc: esc, first: first,
    base: base, shiftOf: shiftOf, isWork: isWork, net: net, personHours: personHours, dayHours: dayHours, dayCount: dayCount,
    dayCost: dayCost, weekHours: weekHours, weekCost: weekCost, weekForecast: weekForecast, changed: changed, changeCount: changeCount,
    coverage: coverage, warnings: warnings, warnCounts: warnCounts, openLeft: openLeft, SLOT0: SLOT0, SLOTS: SLOTS,
    menuItem: menuItem, menuById: menuById, orders: orders, orderOf: orderOf, needsAction: needsAction, STATUS: STATUS, RUNNING: RUNNING, vatOf: vatOf
  };
})();
