/* Nordane Backoffice, final direction. Demo data for Wirtschaft zur Linde, St. Gallen, Freitag 23.10.2026, 19:42.
   Everything lives on window.NBF.data so no global names can collide with other scripts or stale caches. */
(function () {
  'use strict';
  var NBF = (window.NBF = window.NBF || {});

  var menu = [
    { id: 'bratwurst', name: 'Kalbsbratwurst mit Rösti', cat: 'Hauptgerichte', price: 28.5, allergens: 'Gluten, Milch', vat: 'food', note: 'Traditionell, mit Zwiebelsauce', sold: 31 },
    { id: 'geschnetzeltes', name: 'Kalbsgeschnetzeltes Zürcher Art', cat: 'Hauptgerichte', price: 42.0, allergens: 'Milch, Sellerie', vat: 'food', note: 'Rahmsauce, Butterrösti', sold: 22 },
    { id: 'saibling', name: 'Saibling vom Bodensee', cat: 'Hauptgerichte', price: 38.0, allergens: 'Fisch, Milch', vat: 'food', note: 'Herbstgemüse, Kartoffeln', sold: 12 },
    { id: 'risotto', name: 'Pilzrisotto', cat: 'Hauptgerichte', price: 29.5, allergens: 'Milch', vat: 'food', note: 'Steinpilze, Parmesan, Kräuter', sold: 17 },
    { id: 'chaeshoernli', name: 'Chäshörnli mit Apfelmus', cat: 'Hauptgerichte', price: 26.0, allergens: 'Gluten, Milch, Ei', vat: 'food', note: 'Appenzeller Käse, Röstzwiebeln', sold: 19 },
    { id: 'salat', name: 'Herbstsalat', cat: 'Vorspeisen', price: 17.5, allergens: 'Schalenfrüchte, Senf', vat: 'food', note: 'Kürbis, Baumnüsse, Blattsalat', sold: 14 },
    { id: 'suppe', name: 'Kürbissuppe', cat: 'Vorspeisen', price: 12.5, allergens: 'Milch, Sellerie', vat: 'food', note: 'Kürbiskernöl, geröstete Kerne', sold: 16 },
    { id: 'kuechlein', name: 'Apfelküchlein', cat: 'Desserts', price: 14.0, allergens: 'Gluten, Ei, Milch', vat: 'food', note: 'Zimtzucker, Vanilleglace', sold: 9 },
    { id: 'meringue', name: 'Meringue mit Doppelrahm', cat: 'Desserts', price: 11.5, allergens: 'Ei, Milch', vat: 'food', note: 'Greyerzer Doppelrahm, Beeren', sold: 6 },
    { id: 'pinot', name: 'St. Galler Pinot Noir, 1 dl', cat: 'Getränke', price: 9.5, allergens: 'Sulfite', vat: 'alcohol', note: 'Weingut am Steinig Tisch', sold: 48 },
    { id: 'bier', name: 'Appenzeller Quöllfrisch, 33 cl', cat: 'Getränke', price: 6.5, allergens: 'Gluten', vat: 'alcohol', note: 'Vom Fass', sold: 37 },
    { id: 'most', name: 'Süessmost, 3 dl', cat: 'Getränke', price: 5.2, allergens: 'Keine', vat: 'food', note: 'Ostschweizer Apfelsaft', sold: 21 },
    { id: 'wasser', name: 'Mineralwasser, 75 cl', cat: 'Getränke', price: 8.0, allergens: 'Keine', vat: 'food', note: 'Still oder mit Kohlensäure', sold: 26 },
    { id: 'kafi', name: 'Kafi crème', cat: 'Getränke', price: 4.8, allergens: 'Keine', vat: 'food', note: 'Röstung aus Rorschach', sold: 33 }
  ];

  /* status keys: neu, kueche, bereit, verspaetet, serviert, bezahlt, storniert, erstattet */
  var orders = [
    { id: 1049, time: '19:41', channel: 'Tisch-QR', where: 'Tisch 12', guest: '3 Gäste', items: [['chaeshoernli', 2], ['most', 2], ['salat', 1]], status: 'neu', pay: null, action: 'Bestätigen', why: 'Ein Gast vegetarisch, ohne Speck' },
    { id: 1048, time: '19:38', channel: 'Kasse', where: 'Tisch 08', guest: '4 Gäste', items: [['bratwurst', 2], ['risotto', 1], ['saibling', 1], ['pinot', 2], ['wasser', 1], ['salat', 2]], status: 'kueche', pay: null, by: 'Nina Graf' },
    { id: 1047, time: '19:34', channel: 'Kasse', where: 'Tisch 03', guest: '2 Gäste', items: [['geschnetzeltes', 1], ['risotto', 1], ['pinot', 2]], status: 'kueche', pay: null, by: 'Jonas Meier' },
    { id: 1046, time: '19:31', channel: 'Lieferung', where: 'Rosenbergstrasse 51', guest: 'Lea Zellweger', items: [['bratwurst', 2], ['suppe', 1]], status: 'verspaetet', pay: 'Karte', action: 'Kurier anrufen', why: '12 Min. über der zugesagten Zeit' },
    { id: 1045, time: '19:29', channel: 'Abholung', where: 'Abholung 19:45', guest: 'Reto Brändle', items: [['chaeshoernli', 1], ['kuechlein', 1]], status: 'bereit', pay: 'TWINT', action: 'Abholung bestätigen', why: 'Liegt seit 19:40 am Pass' },
    { id: 1044, time: '19:22', channel: 'Kasse', where: 'Tisch 15', guest: 'Firmenessen Bühler Treuhand', items: [['geschnetzeltes', 4], ['saibling', 2], ['pinot', 6], ['wasser', 2]], status: 'serviert', pay: 'Rechnung', action: 'Rechnung senden', why: 'Rechnungsadresse liegt vor' },
    { id: 1043, time: '19:15', channel: 'Kasse', where: 'Tisch 05', guest: '2 Gäste', items: [['bratwurst', 2], ['bier', 2], ['kafi', 2]], status: 'bezahlt', pay: 'Karte' },
    { id: 1042, time: '19:08', channel: 'Tisch-QR', where: 'Tisch 01', guest: '1 Gast', items: [['risotto', 1], ['salat', 1], ['most', 1]], status: 'bezahlt', pay: 'TWINT' },
    { id: 1041, time: '18:57', channel: 'Abholung', where: 'Abholung 19:00', guest: 'Simone Rusch', items: [['chaeshoernli', 2]], status: 'bezahlt', pay: 'TWINT' },
    { id: 1040, time: '18:52', channel: 'Kasse', where: 'Tisch 09', guest: '4 Gäste', items: [['saibling', 2], ['risotto', 2], ['pinot', 4], ['wasser', 1]], status: 'bezahlt', pay: 'Karte' },
    { id: 1039, time: '18:43', channel: 'Kasse', where: 'Bar', guest: '3 Gäste', items: [['bier', 3], ['most', 2]], status: 'bezahlt', pay: 'Bar' },
    { id: 1038, time: '18:40', channel: 'Kasse', where: 'Tisch 11', guest: '2 Gäste', items: [['bratwurst', 2], ['pinot', 2]], status: 'erstattet', pay: 'Karte', why: 'Doppelt gebucht, am Terminal erstattet' },
    { id: 1037, time: '18:32', channel: 'Lieferung', where: 'Teufener Strasse 8', guest: 'Marco Sutter', items: [['risotto', 1], ['meringue', 1]], status: 'bezahlt', pay: 'TWINT' },
    { id: 1036, time: '18:26', channel: 'Kasse', where: 'Tisch 06', guest: '2 Gäste', items: [['geschnetzeltes', 2], ['wasser', 1], ['kafi', 2]], status: 'bezahlt', pay: 'Karte' },
    { id: 1035, time: '18:18', channel: 'Tisch-QR', where: 'Tisch 02', guest: '3 Gäste', items: [['suppe', 2], ['chaeshoernli', 1]], status: 'bezahlt', pay: 'TWINT' },
    { id: 1034, time: '18:10', channel: 'Kasse', where: 'Tisch 14', guest: '3 Gäste', items: [['bratwurst', 3], ['bier', 3]], status: 'bezahlt', pay: 'Bar' },
    { id: 1033, time: '17:58', channel: 'Abholung', where: 'Abholung 18:15', guest: 'Andrea Koller', items: [['suppe', 1]], status: 'storniert', pay: null, why: 'Vom Gast abgesagt' },
    { id: 1032, time: '17:51', channel: 'Kasse', where: 'Tisch 10', guest: '5 Gäste', items: [['chaeshoernli', 5], ['most', 5]], status: 'bezahlt', pay: 'Karte' },
    { id: 1031, time: '17:44', channel: 'Kasse', where: 'Tisch 04', guest: '2 Gäste', items: [['salat', 2], ['kafi', 2]], status: 'bezahlt', pay: 'Bar' }
  ];

  /* area: Service, Bar, Küche, Abwasch. tag: SL Schichtleitung, SV Service, BA Bar, KÜ Küche, AW Abwasch.
     target = contractual weekly hours (42 h at 100 % under L-GAV), students are capped at 24 h in semester. */
  var staff = [
    { name: 'Lena Keller', ini: 'LK', area: 'Service', tag: 'SL', title: 'Betriebsleitung', pensum: '100 %', target: 42, since: '01.02.2019', cls: 'L-GAV V' },
    { name: 'Marc Huber', ini: 'MH', area: 'Küche', tag: 'KÜ', title: 'Küchenchef', pensum: '100 %', target: 42, since: '01.04.2020', cls: 'L-GAV IV' },
    { name: 'Elena Rossi', ini: 'ER', area: 'Küche', tag: 'KÜ', title: 'Köchin EFZ', pensum: '90 %', target: 37.8, since: '15.08.2022', cls: 'L-GAV IIIa' },
    { name: 'Ben Schmid', ini: 'BS', area: 'Küche', tag: 'KÜ', title: 'Koch EFZ', pensum: '100 %', target: 42, since: '01.06.2021', cls: 'L-GAV IIIa' },
    { name: 'Nina Graf', ini: 'NG', area: 'Service', tag: 'SV', title: 'Service, Schichtleitung', pensum: '90 %', target: 37.8, since: '01.03.2023', cls: 'L-GAV IIIa' },
    { name: 'Jonas Meier', ini: 'JM', area: 'Service', tag: 'SV', title: 'Service', pensum: '60 %', target: 25.2, since: '01.09.2023', cls: 'L-GAV II' },
    { name: 'Mia Frei', ini: 'MF', area: 'Service', tag: 'SV', title: 'Service', pensum: '70 %', target: 29.4, since: '01.05.2024', cls: 'L-GAV II' },
    { name: 'Luca Baumann', ini: 'LB', area: 'Service', tag: 'SV', title: 'Service, Student', pensum: 'Stundenlohn', target: 24, since: '01.10.2025', cls: 'L-GAV I' },
    { name: 'Sara Moser', ini: 'SM', area: 'Service', tag: 'SV', title: 'Service', pensum: '60 %', target: 25.2, since: '01.01.2024', cls: 'L-GAV II' },
    { name: 'Noah Weber', ini: 'NW', area: 'Bar', tag: 'BA', title: 'Barchef', pensum: '90 %', target: 37.8, since: '01.11.2021', cls: 'L-GAV IIIa' },
    { name: 'Lea Steiner', ini: 'LS', area: 'Bar', tag: 'BA', title: 'Bar', pensum: '40 %', target: 16.8, since: '01.08.2024', cls: 'L-GAV I' },
    { name: 'Paul Brunner', ini: 'PB', area: 'Küche', tag: 'KÜ', title: 'Commis de cuisine', pensum: '60 %', target: 25.2, since: '01.02.2025', cls: 'L-GAV II' },
    { name: 'Anna Sutter', ini: 'AS', area: 'Service', tag: 'SV', title: 'Service, Studentin', pensum: 'Stundenlohn', target: 24, since: '01.09.2025', cls: 'L-GAV I' },
    { name: 'Tim Egger', ini: 'TE', area: 'Abwasch', tag: 'AW', title: 'Abwasch', pensum: '90 %', target: 37.8, since: '01.03.2024', cls: 'L-GAV I' }
  ];

  /* Week 19. bis 25. Oktober 2026. [start,end] in hours, null = frei, 'F' = Ferien. Net = length minus 30 min pause. */
  var shifts = [
    [[10, 18], [10, 18], null, [10, 18], [14, 23], [14, 23], null],
    [[9, 17], null, [9, 17], [9, 17], [14, 23], [14, 23], [10, 17]],
    [null, [9, 17], [9, 17], null, [15, 23], [14, 23], [10, 17]],
    [[9, 17], [9, 17], null, [14, 22], [14, 23], [14, 23], null],
    [null, [11, 19], [11, 19], null, [16, 24], [9, 17], [11, 19]],
    [[11, 17], null, null, [17, 23], [17, 23], [17, 23], null],
    [null, [11, 17], [11, 17], null, [17, 23], [17, 23], [11, 17]],
    [null, null, [17, 23], null, [18, 24], [17, 23], null],
    [[11, 17], [11, 17], null, [11, 17], null, [17, 23], null],
    [null, null, [16, 24], [16, 24], [16, 24], [16, 24], [14, 21]],
    [null, [16, 22], null, null, [18, 24], [18, 24], null],
    [[9, 15], [9, 15], [9, 15], null, 'F', 'F', 'F'],
    [null, null, null, [17, 23], [18, 24], null, [11, 17]],
    [[11, 19], null, [11, 19], [11, 19], [16, 24], [16, 24], null]
  ];

  /* Availability limits (only deviations from "always available"). */
  var availability = { '4-0': null, '4-3': null, '7-4': [19, 24] };

  var openShifts = [
    { key: 'service', day: 5, start: 17, end: 23, area: 'Service', tag: 'SV', title: 'Service, Abend', where: 'Terrasse und Saal', suggest: 12, why: 'Anna ist am Samstag noch nicht eingeplant und hat 16.5 h in dieser Woche.' },
    { key: 'kitchen', day: 6, start: 10, end: 15, area: 'Küche', tag: 'KÜ', title: 'Küche, Mittag', where: 'Kalte Küche', suggest: 3, why: 'Ben ist am Sonntag frei. Zur Samstagsschicht liegen 11 h Ruhezeit. Er käme auf 44 h bei 42 h Soll.' }
  ];

  /* Extra people needed on top of the base plan, per day, as [from,to] windows. Drives the half-hour coverage strip. */
  var deficits = { 4: [[19, 20]], 5: [[17, 23]], 6: [[10, 15]] };

  var forecast = [4200, 4800, 5400, 5900, 8600, 9800, 4900]; /* CHF per day, sums to 43'600 */
  var costRate = 12468 / 411.5; /* CHF per planned net hour incl. employer costs */

  var requests = [
    { id: 'jonas', person: 5, type: 'Tausch', title: 'Schichttausch mit Luca Baumann', desc: 'Sa 24.10., 17:00 bis 23:00 gegen Mi 28.10., 17:00 bis 23:00', note: 'Beide haben zugestimmt. Qualifikation passt.', yes: 'Genehmigen', no: 'Ablehnen', done: 'Genehmigt' },
    { id: 'sara', person: 8, type: 'Ferien', title: 'Ferien vom 9. bis 13. November', desc: '5 Kalendertage, 2 geplante Arbeitstage, 6 Tage Guthaben', note: 'Keine Überschneidung im Service.', yes: 'Genehmigen', no: 'Ablehnen', done: 'Genehmigt' },
    { id: 'lea', person: 10, type: 'Krank', title: 'Krankmeldung, heute', desc: 'Fr 23.10., Schicht 18:00 bis 24:00, Bar', note: 'Vertretung: Noah Weber ist bereits im Haus.', yes: 'Erfassen', no: 'Rückfrage', done: 'Erfasst' }
  ];

  /* Clock entries today. */
  var clock = [
    { p: 1, in: '13:49', pause: '30 Min.', state: 'Im Dienst' },
    { p: 0, in: '13:56', pause: '30 Min.', state: 'Im Dienst' },
    { p: 3, in: '13:58', pause: '30 Min.', state: 'Im Dienst' },
    { p: 2, in: '14:58', pause: '30 Min.', state: 'Im Dienst' },
    { p: 4, in: '15:54', pause: 'fehlt', state: 'Prüfen' },
    { p: 9, in: '15:55', pause: '30 Min.', state: 'Im Dienst' },
    { p: 13, in: '15:57', pause: '15 Min.', state: 'Im Dienst' },
    { p: 6, in: '16:55', pause: 'noch nicht', state: 'Im Dienst' },
    { p: 5, in: '16:58', pause: 'noch nicht', state: 'Im Dienst' },
    { p: 12, in: '17:57', pause: 'noch nicht', state: 'Im Dienst' }
  ];

  var tenders = [
    { key: 'Karte', label: 'Karte, eigenes Terminal', count: 41, amount: 3652.1, fee: 'gemäss Terminalvertrag', settle: 'Direkt mit dem Terminalanbieter' },
    { key: 'TWINT', label: 'TWINT', count: 27, amount: 1941.0, fee: '1.3 % pro Zahlung', settle: 'Auszahlung am nächsten Bankwerktag' },
    { key: 'Bar', label: 'Bar', count: 14, amount: 870.5, fee: 'keine', settle: 'Kassenbestand, Einzahlung Montag' },
    { key: 'Rechnung', label: 'Rechnung', count: 1, amount: 230.4, fee: 'keine', settle: 'Zahlbar in 30 Tagen' }
  ];

  NBF.data = {
    venue: { name: 'Wirtschaft zur Linde', city: 'St. Gallen', country: 'Schweiz', street: 'Lindenstrasse 12', zip: '9000 St. Gallen', uid: 'CHE-123.456.789 MWST', now: 'FR 23.10.2026', time: '19:42' },
    day: { gross: 6694, orders: 86, guests: 142, service: 72, takeaway: 14, net: 6216.02, vat81Gross: 6218, vat81: 465.92, vat26Gross: 476, vat26: 12.06 },
    menu: menu, orders: orders, staff: staff, shifts: shifts, availability: availability, openShifts: openShifts,
    deficits: deficits, forecast: forecast, costRate: costRate, requests: requests, clock: clock, tenders: tenders,
    dayNames: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
    dayLong: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
  };
})();
