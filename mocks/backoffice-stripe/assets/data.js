/* Shared demo data for all three directions. Fictional restaurant in St. Gallen.
   Prices are VAT-inclusive (Swiss practice). VAT: 8.1 % standard (dine-in food, all alcohol),
   2.6 % reduced (take-away and delivery food, non-alcoholic take-away drinks). */
(function () {
  const NF = new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const NI = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 });
  const chf = (v) => NF.format(v);            // 1’234.50
  const chf0 = (v) => NI.format(Math.round(v)); // 1’235
  const vatOf = (gross, rate) => Math.round(gross * rate / (100 + rate) * 100) / 100;

  const store = {
    name: 'Wirtschaft zur Linde',
    short: 'Linde',
    legal: 'Linde Gastro GmbH',
    street: 'Multergasse 14',
    zip: '9000', city: 'St. Gallen', canton: 'SG',
    uid: 'CHE-412.886.203',
    vatNo: 'CHE-412.886.203 MWST',
    register: 'Handelsregister des Kantons St. Gallen',
    iban: 'CH56 0078 1612 4508 2200 1',
    bank: 'St. Galler Kantonalbank',
    phone: '+41 71 222 18 40',
    email: 'gastgeber@linde-sg.ch',
    hours: 'Di bis Sa 11:00 bis 23:30, So 10:00 bis 15:00',
    tables: 28, seats: 84,
    manager: 'Corina Fässler',
  };
  const stores = [
    { name: 'Wirtschaft zur Linde', city: 'St. Gallen' },
    { name: 'Gasthaus Hoher Kasten', city: 'Brülisau AI' },
    { name: 'Linde Bistro am Bahnhof', city: 'St. Gallen' },
  ];

  const today = { iso: '2026-10-23', label: 'Freitag, 23. Oktober 2026', short: 'Fr 23.10.', week: 43, now: '19:42', service: 'Abendservice' };

  // Hourly sales (gross CHF) for today and the same Friday last week.
  const hours = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22'];
  const salesToday = [412.5, 1648.0, 1290.5, 386.0, 142.0, 98.5, 264.0, 918.5, 1534.0, null, null, null];
  const salesLastFri = [388.0, 1702.5, 1188.0, 402.5, 156.0, 120.0, 310.5, 1046.0, 1798.0, 1712.5, 1104.0, 486.0];

  // Orders (today + a few still open). channel: Kasse | Tisch-QR | Abholung | Lieferung
  const O = (id, time, channel, where, guest, items, tender, status, extra) => Object.assign({ id, time, channel, where, guest, items, tender, status }, extra || {});
  const orders = [
    O(1287, '19:41', 'Tisch-QR', 'Tisch 12', 'Tisch 12', [['Appenzeller Chäshörnli', 2, 27.5], ['Apfelmus', 2, 4.5], ['Appenzeller Bier Quöllfrisch 5 dl', 2, 7.8]], null, 'neu', { action: 'Bestätigen', note: 'Ein Gast vegetarisch, ohne Speck', vatClass: 'dine' }),
    O(1286, '19:38', 'Abholung', 'Abholung 20:05', 'Reto Brändle', [['St. Galler Bratwurst mit Zwiebelsauce', 2, 26.0], ['Rösti', 2, 7.5]], 'TWINT', 'in Küche', { vatClass: 'take' }),
    O(1285, '19:35', 'Kasse', 'Tisch 4', 'Tisch 4', [['Kalbsgeschnetzeltes Zürcher Art', 1, 46.0], ['Rindstatar 120 g', 1, 34.0], ['Pinot Noir Fläsch 1 dl', 3, 8.5]], null, 'in Küche', { vatClass: 'dine' }),
    O(1284, '19:31', 'Lieferung', 'Rosenbergstrasse 51', 'Lea Zellweger', [['Siedwurst mit Kartoffelsalat', 1, 24.0], ['Chäsfladen', 1, 19.5], ['Rivella rot 5 dl', 2, 5.2]], 'Karte', 'verspätet', { action: 'Kurier anrufen', late: 12, vatClass: 'take' }),
    O(1283, '19:26', 'Kasse', 'Tisch 9', 'Tisch 9', [['Saisonsalat', 2, 12.5], ['Kürbisrisotto', 2, 32.0], ['Mineral Goba 5 dl', 2, 5.8]], 'Karte', 'bezahlt', { vatClass: 'dine' }),
    O(1282, '19:20', 'Tisch-QR', 'Tisch 2', 'Tisch 2', [['Appenzeller Mostbröckli', 1, 22.0], ['Weisswein Rheintaler 1 dl', 2, 8.0]], 'TWINT', 'bezahlt', { vatClass: 'dine' }),
    O(1281, '19:14', 'Kasse', 'Tisch 15', 'Tisch 15', [['Kalbsbratwurst mit Rösti', 3, 34.0], ['Appenzeller Bier Quöllfrisch 5 dl', 3, 7.8]], 'Rechnung', 'offen', { action: 'Rechnung senden', note: 'Firmenessen Huber + Suhner, Rechnung an Buchhaltung', vatClass: 'dine' }),
    O(1280, '19:08', 'Abholung', 'Abholung 19:30', 'Andrea Koller', [['Chäshörnli', 1, 27.5]], 'TWINT', 'bereit', { action: 'Abholung bestätigen', vatClass: 'take' }),
    O(1279, '19:02', 'Kasse', 'Tisch 7', 'Tisch 7', [['Rindsfilet 180 g', 2, 58.0], ['Saisonsalat', 2, 12.5], ['Pinot Noir Fläsch 7.5 dl', 1, 64.0]], 'Karte', 'bezahlt', { vatClass: 'dine' }),
    O(1278, '18:55', 'Kasse', 'Bar', 'Bar', [['Kafi Lutz', 2, 7.5], ['Appenzeller Alpenbitter 2 cl', 2, 6.5]], 'Bar', 'bezahlt', { vatClass: 'dine' }),
    O(1277, '18:48', 'Lieferung', 'Teufener Strasse 8', 'Marco Sutter', [['Kürbisrisotto', 1, 32.0], ['Vermicelles', 1, 12.0]], 'TWINT', 'bezahlt', { vatClass: 'take' }),
    O(1276, '18:40', 'Kasse', 'Tisch 11', 'Tisch 11', [['St. Galler Bratwurst mit Zwiebelsauce', 2, 26.0], ['Appenzeller Bier Quöllfrisch 5 dl', 2, 7.8]], 'Karte', 'rückerstattet', { refund: 26.0, note: 'Bratwurst kalt serviert, Teilrückerstattung durch C. Fässler', vatClass: 'dine' }),
    O(1275, '18:31', 'Tisch-QR', 'Tisch 3', 'Tisch 3', [['Chäsfladen', 2, 19.5], ['Süssmost 3 dl', 2, 4.8]], 'TWINT', 'bezahlt', { vatClass: 'dine' }),
    O(1274, '18:22', 'Kasse', 'Tisch 6', 'Tisch 6', [['Kalbsgeschnetzeltes Zürcher Art', 2, 46.0], ['Rösti', 2, 7.5], ['Mineral Goba 5 dl', 1, 5.8]], 'Karte', 'bezahlt', { vatClass: 'dine' }),
    O(1273, '18:10', 'Abholung', 'Abholung 18:30', 'Simone Rusch', [['Saisonsalat', 1, 12.5], ['Siedwurst mit Kartoffelsalat', 1, 24.0]], 'TWINT', 'bezahlt', { vatClass: 'take' }),
    O(1272, '17:52', 'Kasse', 'Tisch 1', 'Tisch 1', [['Appenzeller Mostbröckli', 1, 22.0]], null, 'storniert', { note: 'Doppelt erfasst, storniert durch J. Inauen', vatClass: 'dine' }),
    O(1271, '13:44', 'Kasse', 'Tisch 8', 'Tisch 8', [['Mittagsmenü Fleisch', 4, 24.5], ['Kafi crème', 4, 4.9]], 'Karte', 'bezahlt', { vatClass: 'dine' }),
    O(1270, '13:12', 'Tisch-QR', 'Tisch 5', 'Tisch 5', [['Mittagsmenü Vegi', 2, 22.5], ['Rivella rot 5 dl', 2, 5.2]], 'TWINT', 'bezahlt', { vatClass: 'dine' }),
  ];
  orders.forEach((o) => {
    o.total = Math.round(o.items.reduce((s, it) => s + it[1] * it[2], 0) * 100) / 100;
    o.vatRate = o.vatClass === 'take' ? 2.6 : 8.1;
    // alcohol always 8.1 even in take-away: none of the take-away orders above contain alcohol.
    o.vat = vatOf(o.total, o.vatRate);
    o.covers = o.items.reduce((s, it) => s + (/(Bier|wein|Wein|Pinot|Kafi|Mineral|Rivella|Süssmost|Alpenbitter|Kafi crème)/.test(it[0]) ? 0 : it[1]), 0);
  });
  const needsAction = orders.filter((o) => o.action);

  // Day totals (consistent, used by Overview and Z report). Gross incl. VAT.
  const day = {
    gross: 6694.0, ordersCount: 63, covers: 118,
    lastFriSameTime: 7176.0, forecastClose: 10420.0, labourCostToday: 2186.0,
    openTables: 9, seatedGuests: 31, kitchenQueue: 6, avgPrepMin: 14,
  };
  day.avgTicket = day.gross / day.ordersCount; day.avgPerCover = day.gross / day.covers; // 106.25 and 56.73
  day.vsLastFri = (day.gross - day.lastFriSameTime) / day.lastFriSameTime * 100; // -6.7 %
  day.labourPct = day.labourCostToday / day.forecastClose * 100;

  // Menu
  const allergens = [
    ['A', 'Glutenhaltiges Getreide', 'Gluten'], ['B', 'Krebstiere', 'Crustaceans'], ['C', 'Eier', 'Eggs'], ['D', 'Fisch', 'Fish'],
    ['E', 'Erdnüsse', 'Peanuts'], ['F', 'Soja', 'Soy'], ['G', 'Milch (Laktose)', 'Milk'], ['H', 'Schalenfrüchte', 'Tree nuts'],
    ['L', 'Sellerie', 'Celery'], ['M', 'Senf', 'Mustard'], ['N', 'Sesam', 'Sesame'], ['O', 'Sulfite', 'Sulphites'],
    ['P', 'Lupinen', 'Lupin'], ['R', 'Weichtiere', 'Molluscs'],
  ];
  const menu = [
    { cat: 'Vorspeisen', items: [
      { name: 'Saisonsalat', desc: 'Blattsalate, Kürbiskerne, Hausdressing', price: 12.5, al: ['M', 'H'], vat: 'Speisen', avail: 'Ganztags', on: true, mods: ['Dressing'] },
      { name: 'Appenzeller Mostbröckli', desc: 'Hauchdünn, mit Bürli und Butter', price: 22.0, al: ['A', 'G'], vat: 'Speisen', avail: 'Ganztags', on: true, mods: [] },
      { name: 'Rindstatar 120 g', desc: 'Von Hand geschnitten, Toast, Butter', price: 34.0, al: ['A', 'C', 'G', 'M'], vat: 'Speisen', avail: 'Abend', on: true, mods: ['Schärfe'] },
      { name: 'Kürbissuppe', desc: 'Mit Kernöl und Croûtons', price: 11.5, al: ['A', 'G', 'L'], vat: 'Speisen', avail: 'Ganztags', on: false, soldOut: true, mods: [] },
    ]},
    { cat: 'Appenzeller Spezialitäten', items: [
      { name: 'Appenzeller Chäshörnli', desc: 'Mit Röstzwiebeln, Speck und Apfelmus', price: 27.5, al: ['A', 'C', 'G'], vat: 'Speisen', avail: 'Ganztags', on: true, mods: ['Ohne Speck', 'Beilage'] },
      { name: 'Chäsfladen', desc: 'Appenzeller Käsekuchen nach Hausrezept', price: 19.5, al: ['A', 'C', 'G'], vat: 'Speisen', avail: 'Ganztags', on: true, mods: [] },
      { name: 'Siedwurst mit Kartoffelsalat', desc: 'Siedwurst vom Metzger Breitenmoser', price: 24.0, al: ['M', 'L'], vat: 'Speisen', avail: 'Ganztags', on: true, mods: [] },
    ]},
    { cat: 'Hauptgänge', items: [
      { name: 'St. Galler Bratwurst mit Zwiebelsauce', desc: 'Kalbsbratwurst IGP, Rösti oder Bürli', price: 26.0, al: ['G', 'L'], vat: 'Speisen', avail: 'Ganztags', on: true, mods: ['Beilage', 'Zwiebelsauce'] },
      { name: 'Kalbsgeschnetzeltes Zürcher Art', desc: 'Champignon-Rahmsauce, Butterrösti', price: 46.0, al: ['G', 'L', 'O'], vat: 'Speisen', avail: 'Ganztags', on: true, mods: ['Beilage'] },
      { name: 'Rindsfilet 180 g', desc: 'Schweizer Weiderind, Kräuterbutter, Gemüse', price: 58.0, al: ['G'], vat: 'Speisen', avail: 'Abend', on: true, mods: ['Garstufe', 'Beilage'] },
      { name: 'Kürbisrisotto', desc: 'Sbrinz AOP, geröstete Kerne', price: 32.0, al: ['G', 'L', 'O'], vat: 'Speisen', avail: 'Ganztags', on: true, mods: [] },
      { name: 'Mittagsmenü Fleisch', desc: 'Täglich wechselnd, mit Suppe oder Salat', price: 24.5, al: ['A', 'G', 'L'], vat: 'Speisen', avail: 'Mittag', on: true, mods: ['Suppe oder Salat'] },
      { name: 'Mittagsmenü Vegi', desc: 'Täglich wechselnd, mit Suppe oder Salat', price: 22.5, al: ['A', 'G'], vat: 'Speisen', avail: 'Mittag', on: true, mods: ['Suppe oder Salat'] },
    ]},
    { cat: 'Beilagen', items: [
      { name: 'Rösti', desc: 'Butterrösti', price: 7.5, al: ['G'], vat: 'Speisen', avail: 'Ganztags', on: true, mods: [] },
      { name: 'Apfelmus', desc: 'Hausgemacht', price: 4.5, al: [], vat: 'Speisen', avail: 'Ganztags', on: true, mods: [] },
    ]},
    { cat: 'Desserts', items: [
      { name: 'Vermicelles', desc: 'Mit Meringue und Rahm', price: 12.0, al: ['C', 'G'], vat: 'Speisen', avail: 'Ganztags', on: true, mods: [] },
      { name: 'Biber-Glace', desc: 'Appenzeller Biber, Vanille', price: 10.5, al: ['A', 'C', 'G', 'H'], vat: 'Speisen', avail: 'Ganztags', on: true, mods: [] },
    ]},
    { cat: 'Getränke', items: [
      { name: 'Mineral Goba 5 dl', desc: 'Mit oder ohne Kohlensäure', price: 5.8, al: [], vat: 'Getränke alkoholfrei', avail: 'Ganztags', on: true, mods: [] },
      { name: 'Rivella rot 5 dl', desc: '', price: 5.2, al: ['G'], vat: 'Getränke alkoholfrei', avail: 'Ganztags', on: true, mods: [] },
      { name: 'Süssmost 3 dl', desc: 'Thurgauer Apfelsaft', price: 4.8, al: [], vat: 'Getränke alkoholfrei', avail: 'Ganztags', on: true, mods: [] },
      { name: 'Kafi crème', desc: '', price: 4.9, al: ['G'], vat: 'Getränke alkoholfrei', avail: 'Ganztags', on: true, mods: ['Milch'] },
    ]},
    { cat: 'Bier & Wein', items: [
      { name: 'Appenzeller Bier Quöllfrisch 5 dl', desc: 'Brauerei Locher, Appenzell', price: 7.8, al: ['A'], vat: 'Alkohol', avail: 'Ganztags', on: true, mods: [] },
      { name: 'Pinot Noir Fläsch 1 dl', desc: 'Bündner Herrschaft', price: 8.5, al: ['O'], vat: 'Alkohol', avail: 'Ganztags', on: true, mods: [] },
      { name: 'Weisswein Rheintaler 1 dl', desc: 'Riesling-Sylvaner, Berneck', price: 8.0, al: ['O'], vat: 'Alkohol', avail: 'Ganztags', on: true, mods: [] },
      { name: 'Kafi Lutz', desc: 'Mit Appenzeller Kräuterschnaps', price: 7.5, al: [], vat: 'Alkohol', avail: 'Ganztags', on: true, mods: [] },
    ]},
  ];
  // VAT classes: dine-in rate / take-away rate
  const vatClasses = [
    { name: 'Speisen', dine: 8.1, take: 2.6, note: 'Im Lokal 8.1 %, über die Gasse und Lieferung 2.6 %' },
    { name: 'Getränke alkoholfrei', dine: 8.1, take: 2.6, note: 'Im Lokal 8.1 %, über die Gasse 2.6 %' },
    { name: 'Alkohol', dine: 8.1, take: 8.1, note: 'Immer 8.1 %' },
  ];
  const modifiers = [
    { name: 'Beilage', rule: 'Pflicht, genau 1', options: [['Butterrösti', 0], ['Bürli', 0], ['Pommes frites', 0], ['Gemüse statt Beilage', 2.0]] },
    { name: 'Garstufe', rule: 'Pflicht, genau 1', options: [['Saignant', 0], ['À point', 0], ['Bien cuit', 0]] },
    { name: 'Ohne Speck', rule: 'Optional', options: [['Ohne Speck', 0]] },
    { name: 'Zwiebelsauce', rule: 'Optional, bis 2', options: [['Extra Zwiebelsauce', 3.5], ['Sauce separat', 0]] },
    { name: 'Dressing', rule: 'Pflicht, genau 1', options: [['Hausdressing', 0], ['Balsamico', 0], ['Französisch', 0]] },
    { name: 'Suppe oder Salat', rule: 'Pflicht, genau 1', options: [['Tagessuppe', 0], ['Kleiner Salat', 0]] },
    { name: 'Schärfe', rule: 'Pflicht, genau 1', options: [['Mild', 0], ['Mittel', 0], ['Scharf', 0]] },
    { name: 'Milch', rule: 'Optional', options: [['Hafermilch', 0.5], ['Laktosefrei', 0]] },
  ];

  // Staff rota, week 43 (Mo 19.10. to So 25.10.2026). Mo closed (Ruhetag).
  const days = ['Mo 19.', 'Di 20.', 'Mi 21.', 'Do 22.', 'Fr 23.', 'Sa 24.', 'So 25.'];
  const S = (name, role, area, rate, contract, shifts) => ({ name, role, area, rate, contract, shifts });
  // shift: [start, end] or null; 'F' = frei, 'U' = Ferien, 'K' = krank
  const staff = [
    S('Corina Fässler', 'Gastgeberin', 'Service', 38.5, 42, [null, ['10:00', '19:00'], ['10:00', '19:00'], ['14:00', '23:00'], ['14:00', '23:30'], ['14:00', '23:30'], 'F']),
    S('Jonas Inauen', 'Chef de Service', 'Service', 34.0, 42, [null, ['16:00', '23:30'], ['16:00', '23:30'], 'F', ['16:00', '23:30'], ['16:00', '23:30'], ['09:30', '15:30']]),
    S('Lara Manser', 'Service', 'Service', 27.5, 34, [null, ['10:30', '14:30'], 'F', ['10:30', '14:30'], ['17:00', '23:30'], ['17:00', '23:30'], ['09:30', '15:30']]),
    S('Nico Signer', 'Service (Aushilfe)', 'Service', 26.0, 0, [null, 'F', ['17:00', '22:00'], ['17:00', '22:00'], ['17:00', '23:30'], ['17:00', '23:30'], 'F']),
    S('Fabienne Koch', 'Bar', 'Service', 27.5, 34, [null, ['17:00', '23:30'], ['17:00', '23:30'], ['17:00', '23:30'], 'U', 'U', 'U']),
    S('Thomas Rechsteiner', 'Küchenchef', 'Küche', 42.0, 42, [null, ['09:00', '14:00'], ['09:00', '14:00'], ['09:00', '21:00'], ['14:00', '22:30'], ['14:00', '22:30'], ['08:30', '15:00']]),
    S('Ivana Kovačević', 'Sous-Chef', 'Küche', 36.0, 42, [null, ['16:00', '22:30'], ['16:00', '22:30'], 'F', ['09:00', '14:30'], ['09:00', '22:30'], 'F']),
    S('Samuel Fritsche', 'Koch', 'Küche', 31.0, 42, [null, ['09:00', '14:30'], ['09:00', '14:30'], ['16:00', '22:30'], ['16:00', '22:30'], 'K', ['08:30', '15:00']]),
    S('Ardit Berisha', 'Lernender Koch, 2. Lj.', 'Küche', 12.5, 42, [null, ['09:00', '14:30'], ['09:00', '14:30'], ['09:00', '14:30'], ['09:00', '14:30'], 'F', ['08:30', '15:00']]),
    S('Maria Santos', 'Abwasch', 'Küche', 25.0, 28, [null, ['11:00', '15:00'], ['18:00', '23:00'], ['18:00', '23:00'], ['18:00', '23:30'], ['18:00', '23:30'], 'F']),
  ];
  const toH = (t) => { const [h, m] = t.split(':').map(Number); return h + m / 60; };
  const shiftHours = (sh) => Array.isArray(sh) ? Math.max(0, toH(sh[1]) - toH(sh[0]) - (toH(sh[1]) - toH(sh[0]) > 5.5 ? 0.5 : 0)) : 0; // 30 min unpaid break over 5.5 h
  staff.forEach((p) => {
    p.hours = p.shifts.map(shiftHours);
    p.total = Math.round(p.hours.reduce((a, b) => a + b, 0) * 10) / 10;
    p.cost = Math.round(p.total * p.rate * 1.155); // incl. AHV/IV/EO, ALV, BVG, UVG employer share (approx. 15.5 %)
  });
  const forecastByDay = [0, 6200, 6900, 8400, 10420, 12100, 5600];
  const labourByDay = days.map((_, i) => Math.round(staff.reduce((s, p) => s + p.hours[i] * p.rate * 1.155, 0)));
  const openShifts = [{ day: 5, area: 'Service', time: '17:00 bis 23:30', reason: 'Fabienne Koch in den Ferien' }, { day: 5, area: 'Küche', time: '16:00 bis 22:30', reason: 'Samuel Fritsche krank gemeldet' }];

  // Z report for yesterday (Thursday 22.10.2026) and today's running X.
  const z = {
    no: 'Z-0412', date: 'Do 22.10.2026', opened: '10:12', closed: '23:58', by: 'Jonas Inauen', register: 'Kasse Tresen',
    gross: 8419.6,
    rates: [
      { rate: 8.1, label: 'Normalsatz 8.1 %', gross: 7642.8 },
      { rate: 2.6, label: 'Reduzierter Satz 2.6 %', gross: 776.8 },
    ],
    tenders: [
      { name: 'Karte (Nordane Terminal)', count: 58, amount: 4388.4, fee: 43.88 },
      { name: 'TWINT', count: 41, amount: 2207.5, fee: 28.70 },
      { name: 'Bar', count: 17, amount: 896.2, fee: 0 },
      { name: 'Rechnung', count: 2, amount: 742.0, fee: 0 },
      { name: 'Gutschein', count: 3, amount: 185.5, fee: 0 },
    ],
    tips: 312.4, discounts: 64.0, voids: 2, voidAmount: 47.5, refunds: 1, refundAmount: 26.0,
    cash: { expected: 1146.2, counted: 1141.2, float: 250.0 },
    covers: 154, orders: 121,
  };
  z.rates.forEach((r) => { r.vat = vatOf(r.gross, r.rate); r.net = Math.round((r.gross - r.vat) * 100) / 100; });
  z.vatTotal = z.rates.reduce((s, r) => s + r.vat, 0);
  z.net = z.gross - z.vatTotal;
  z.cash.diff = Math.round((z.cash.counted - z.cash.expected) * 100) / 100;
  const closings = [
    { no: 'Z-0412', date: 'Do 22.10.', gross: 8419.6, diff: -5.0, status: 'Abgeschlossen' },
    { no: 'Z-0411', date: 'Mi 21.10.', gross: 6982.3, diff: 0, status: 'Abgeschlossen' },
    { no: 'Z-0410', date: 'Di 20.10.', gross: 6120.9, diff: 2.4, status: 'Abgeschlossen' },
    { no: 'Z-0409', date: 'So 18.10.', gross: 5410.5, diff: 0, status: 'Abgeschlossen' },
    { no: 'Z-0408', date: 'Sa 17.10.', gross: 11842.0, diff: -12.6, status: 'Geprüft' },
    { no: 'Z-0407', date: 'Fr 16.10.', gross: 10380.7, diff: 0, status: 'Geprüft' },
  ];
  const payouts = [
    { date: 'Mo 26.10.', source: 'Karte (Nordane Terminal)', period: '22. bis 25.10.', amount: null, status: 'Geplant' },
    { date: 'Fr 23.10.', source: 'Karte (Nordane Terminal)', period: '20. bis 21.10.', amount: 7842.15, status: 'Unterwegs' },
    { date: 'Fr 23.10.', source: 'TWINT', period: '22.10.', amount: 2178.8, status: 'Unterwegs' },
    { date: 'Do 22.10.', source: 'TWINT', period: '21.10.', amount: 1904.35, status: 'Gutgeschrieben' },
    { date: 'Di 20.10.', source: 'Karte (Nordane Terminal)', period: '16. bis 18.10.', amount: 18911.6, status: 'Gutgeschrieben' },
  ];
  const week = { gross: [0, 6120.9, 6982.3, 8419.6, 6694.0, null, null], label: days };

  const devices = [
    { name: 'Kasse Tresen', type: 'iPad Pro 11, Nordane Kasse 4.2', status: 'online', seen: 'jetzt' },
    { name: 'Kasse Terrasse', type: 'iPad Air, Nordane Kasse 4.2', status: 'offline', seen: 'vor 3 Std.', issue: 'Seit 16:38 offline. Wahrscheinlich ausgeschaltet.' },
    { name: 'Küchenmonitor', type: 'Nordane KDS, 22 Zoll', status: 'online', seen: 'jetzt' },
    { name: 'Bondrucker Küche', type: 'Epson TM-m30III', status: 'online', seen: 'jetzt' },
    { name: 'Bondrucker Bar', type: 'Epson TM-m30III', status: 'warnung', seen: 'jetzt', issue: 'Papier fast leer' },
    { name: 'Terminal 1', type: 'Nordane Terminal T1, S/N NT1-20417', status: 'online', seen: 'jetzt' },
    { name: 'Terminal 2', type: 'Nordane Terminal T1, S/N NT1-20418', status: 'online', seen: 'vor 2 Min.' },
  ];
  const payments = [
    { name: 'Nordane Terminal', detail: 'Debit- und Kreditkarten, Apple Pay, Google Pay', fee: '1.0 % pro Zahlung', state: 'Aktiv' },
    { name: 'TWINT', detail: 'Händlernummer 70 4412 88, QR auf Terminal und Tisch', fee: '1.3 % pro Zahlung', state: 'Aktiv' },
    { name: 'Bargeld', detail: 'Wechselgeld CHF 250.00 pro Kasse', fee: 'keine', state: 'Aktiv' },
    { name: 'Rechnung', detail: 'Zahlbar in 30 Tagen, QR-Rechnung', fee: 'keine', state: 'Aktiv' },
    { name: 'Gutscheine', detail: 'Eigene Gutscheine, Seriennummer', fee: 'keine', state: 'Aktiv' },
  ];

  window.NORDANE = { chf, chf0, vatOf, store, stores, today, hours, salesToday, salesLastFri, orders, needsAction, day, allergens, menu, vatClasses, modifiers, days, staff, forecastByDay, labourByDay, openShifts, z, closings, payouts, week, devices, payments };
})();
