/* Shared Dienstplan (staff planning) demo data and rules engine for all three directions.
   Wirtschaft zur Linde, St. Gallen. Planning week KW 44: Mo 26.10. to So 1.11.2026.
   So 1.11. is Allerheiligen, a public holiday in the canton of St. Gallen.
   Exposes window.DP. Pure data + functions; every direction renders it in its own system.

   Legal basis shown in the UI (demo values, to be checked against the current L-GAV wage table before use):
   - L-GAV Gastgewerbe: 42 h normal week (Art. 15), 2 rest days per week (Art. 16), 5 weeks holiday (Art. 17),
     6 paid public holidays (Art. 18), 13th month salary 100 % from the 1st month (Art. 12), minimum wages by category (Art. 10).
   - ArG: daily rest at least 11 consecutive hours (Art. 15a), weekly max 50 h for hospitality (Art. 9),
     breaks 15 min > 5.5 h, 30 min > 7 h, 60 min > 9 h (Art. 15), night 23:00 to 06:00 (Art. 16).
   - ArGV 5 / Jugendarbeitsschutz: young workers in hospitality from 16 may work until 23:00 at the latest (Art. 12 ArGV 5 exception). */
(function () {
  const NF = new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const NI = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 });
  const chf = (v) => NF.format(v);
  const chf0 = (v) => NI.format(Math.round(v));
  const toH = (t) => { const [h, m] = t.split(':').map(Number); return h + m / 60; };
  const fmtH = (h) => { const hh = Math.floor(h + 1e-6) % 24; const mm = Math.round((h - Math.floor(h + 1e-6)) * 60); return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); };
  const h1 = (v) => (Math.round(v * 10) / 10).toFixed(1);

  const week = {
    no: 44, from: '26.10.2026', to: '01.11.2026', label: 'KW 44 · 26. Oktober bis 1. November 2026',
    publishedAt: 'Mi 21.10., 16:12', publishedBy: 'Corina Fässler',
  };
  const days = [
    { key: 'mo', short: 'Mo', date: '26.10.', long: 'Montag, 26. Oktober', closed: true, note: 'Ruhetag' },
    { key: 'di', short: 'Di', date: '27.10.', long: 'Dienstag, 27. Oktober', open: [11, 23.5] },
    { key: 'mi', short: 'Mi', date: '28.10.', long: 'Mittwoch, 28. Oktober', open: [11, 23.5] },
    { key: 'do', short: 'Do', date: '29.10.', long: 'Donnerstag, 29. Oktober', open: [11, 23.5] },
    { key: 'fr', short: 'Fr', date: '30.10.', long: 'Freitag, 30. Oktober', open: [11, 23.5], note: 'Olma-Nachklang, 2 Gruppen reserviert' },
    { key: 'sa', short: 'Sa', date: '31.10.', long: 'Samstag, 31. Oktober', open: [11, 23.5], note: 'Firmenessen Raiffeisen, 34 Gäste ab 19:00' },
    { key: 'so', short: 'So', date: '01.11.', long: 'Sonntag, 1. November', open: [10, 15], holiday: 'Allerheiligen (SG)' },
  ];
  // Cantonal holidays SG (public holidays per Ruhetagsgesetz SG plus 1. August).
  const holidaysSG = [
    ['01.01.2026', 'Neujahr'], ['03.04.2026', 'Karfreitag'], ['06.04.2026', 'Ostermontag'], ['14.05.2026', 'Auffahrt'],
    ['25.05.2026', 'Pfingstmontag'], ['01.08.2026', 'Bundesfeiertag'], ['01.11.2026', 'Allerheiligen'],
    ['25.12.2026', 'Weihnachten'], ['26.12.2026', 'Stephanstag'],
  ];

  // Roles: colour is applied by each direction within its palette rules. Each role also has a 2 letter code
  // so the role is never carried by colour alone.
  const roles = {
    lead: { name: 'Schichtleitung', code: 'SL', area: 'Service' },
    service: { name: 'Service', code: 'SV', area: 'Service' },
    bar: { name: 'Bar', code: 'BA', area: 'Bar' },
    kitchen: { name: 'Küche', code: 'KÜ', area: 'Küche' },
    dish: { name: 'Abwasch', code: 'AW', area: 'Abwasch' },
  };
  const areas = ['Service', 'Bar', 'Küche', 'Abwasch'];
  // lead shifts count towards Service coverage.
  const areaOf = (role) => roles[role].area;

  // L-GAV minimum wages per month (x13). Demo values for 2026.
  const lgav = {
    year: 2026, weekHours: 42, monthHours: 182, restDays: 2, holidayWeeks: 5, paidHolidays: 6,
    cats: [
      { k: 'I', name: 'Mitarbeitende ohne Berufslehre', min: 3666 },
      { k: 'Ia', name: 'Ohne Berufslehre, mit Progresso', min: 3870 },
      { k: 'II', name: 'Berufsattest EBA', min: 3985 },
      { k: 'IIIa', name: 'Fähigkeitszeugnis EFZ', min: 4412 },
      { k: 'IIIb', name: 'EFZ und Weiterbildung L-GAV', min: 4515 },
      { k: 'IV', name: 'Berufsprüfung', min: 5168 },
      { k: 'L', name: 'Lernende (Lehrvertrag, kein L-GAV-Mindestlohn)', min: null },
    ],
    // Hourly wage for Stundenlöhner: base = monthly / 182, plus holiday 10.64 % (5 weeks), public holidays 2.27 % (6 days), 13th month 8.33 %.
    holidayPct: 10.64, publicHolidayPct: 2.27, thirteenthPct: 8.33,
    surcharges: [
      { k: 'night', name: 'Nachtarbeit 23:00 bis 06:00', pct: 25, basis: 'ArG Art. 17b, vorübergehende Nachtarbeit' },
      { k: 'sunday', name: 'Sonntag', pct: 10, basis: 'Betriebsregel Linde, freiwillig' },
      { k: 'holiday', name: 'Feiertag SG', pct: 50, basis: 'Betriebsregel Linde, zusätzlich Ersatzruhetag' },
    ],
    employerPct: 15.5, // AHV/IV/EO 5.3, ALV 1.1, FAK SG ~1.5, BVG ~5, UVG/KTG ~2.6 (approx.)
  };
  const catMin = (k) => (lgav.cats.find((c) => c.k === k) || {}).min;
  const hourlyFromMonthly = (m) => m / lgav.monthHours;
  const stdLohn = (base) => base * (1 + (lgav.holidayPct + lgav.publicHolidayPct + lgav.thirteenthPct) / 100);

  // Staff. pct = Pensum; target = weekly hours target; monthly = gross per month (x13); hourly = for Stundenlöhner incl. Ferien, Feiertag, 13.
  const P = (o) => Object.assign({ docs: [], absences: [], avail: {}, maxWeek: null, age: null, balance: 0 }, o);
  const staff = [
    P({ id: 'cf', name: 'Corina Fässler', short: 'Corina F.', initials: 'CF', title: 'Gastgeberin, Geschäftsführung', area: 'Service', contract: 'Monatslohn', pct: 100, target: 42, cat: 'IV', monthly: 7100, skills: ['lead', 'service', 'bar'], since: '01.03.2019', phone: '+41 79 412 33 08', balance: 18.5, holidayLeft: 6, age: 41,
      docs: [['Arbeitsvertrag 2019', 'PDF'], ['Wirtepatent SG', 'PDF'], ['Lohnausweis 2025', 'PDF']] }),
    P({ id: 'ji', name: 'Jonas Inauen', short: 'Jonas I.', initials: 'JI', title: 'Chef de Service', area: 'Service', contract: 'Monatslohn', pct: 100, target: 42, cat: 'IIIb', monthly: 5650, skills: ['lead', 'service', 'bar'], since: '15.08.2021', phone: '+41 78 655 21 90', balance: 7.0, holidayLeft: 11, age: 33,
      docs: [['Arbeitsvertrag 2021', 'PDF'], ['EFZ Restaurationsfachmann', 'PDF']] }),
    P({ id: 'lm', name: 'Lara Manser', short: 'Lara M.', initials: 'LM', title: 'Service', area: 'Service', contract: 'Monatslohn', pct: 80, target: 33.6, cat: 'IIIa', monthly: 3640, skills: ['service', 'bar'], since: '01.04.2023', phone: '+41 79 230 87 14', balance: -3.5, holidayLeft: 14, age: 27,
      avail: { mo: 'frei', so: 'nur bis 15:00' }, docs: [['Arbeitsvertrag 2023', 'PDF']] }),
    P({ id: 'ey', name: 'Elif Yılmaz', short: 'Elif Y.', initials: 'EY', title: 'Service', area: 'Service', contract: 'Monatslohn', pct: 60, target: 25.2, cat: 'II', monthly: 2440, skills: ['service'], since: '01.09.2024', phone: '+41 76 318 40 52', balance: 2.0, holidayLeft: 12, age: 36,
      avail: { note: 'Nur Mittag und früher Abend, Kinderbetreuung ab 20:00' }, docs: [['Arbeitsvertrag 2024', 'PDF'], ['Aufenthaltsbewilligung B', 'PDF']] }),
    P({ id: 'ns', name: 'Nico Signer', short: 'Nico S.', initials: 'NS', title: 'Service, Aushilfe', area: 'Service', contract: 'Stundenlohn', pct: null, target: null, cat: 'I', skills: ['service'], since: '01.05.2025', phone: '+41 79 901 12 66', age: 24,
      docs: [['Rahmenvertrag Aushilfe', 'PDF']] }),
    P({ id: 'mz', name: 'Mia Zünd', short: 'Mia Z.', initials: 'MZ', title: 'Service, Studentin HSG', area: 'Service', contract: 'Stundenlohn', pct: null, target: null, maxWeek: 15, cat: 'I', skills: ['service', 'bar'], since: '01.02.2026', phone: '+41 77 455 09 31', age: 22, student: true,
      avail: { note: 'Semester: Mo, Di, Do bis 13:30 Vorlesung. Max. 15 Std. pro Woche' }, docs: [['Rahmenvertrag Aushilfe', 'PDF'], ['Immatrikulation HSG HS26', 'PDF']] }),
    P({ id: 'lb', name: 'Luca Brunner', short: 'Luca B.', initials: 'LB', title: 'Bar, Student OST', area: 'Bar', contract: 'Stundenlohn', pct: null, target: null, maxWeek: 20, cat: 'Ia', skills: ['bar', 'service'], since: '01.10.2025', phone: '+41 78 266 71 03', age: 23, student: true,
      avail: { mo: 'frei', note: 'Prüfungen 12. bis 23.1.2027, dann nicht verfügbar' }, docs: [['Rahmenvertrag Aushilfe', 'PDF']] }),
    P({ id: 'fk', name: 'Fabienne Koch', short: 'Fabienne K.', initials: 'FK', title: 'Bar', area: 'Bar', contract: 'Monatslohn', pct: 80, target: 33.6, cat: 'IIIa', monthly: 3640, skills: ['bar', 'service'], since: '01.06.2022', phone: '+41 79 377 50 18', balance: 4.5, holidayLeft: 4, age: 30,
      absences: [{ kind: 'Ferien', from: '23.10.', to: '28.10.', state: 'Bewilligt', days: [1, 2] }], docs: [['Arbeitsvertrag 2022', 'PDF']] }),
    P({ id: 'tr', name: 'Thomas Rechsteiner', short: 'Thomas R.', initials: 'TR', title: 'Küchenchef', area: 'Küche', contract: 'Monatslohn', pct: 100, target: 42, cat: 'IV', monthly: 7400, skills: ['kitchen', 'lead'], since: '01.01.2018', phone: '+41 79 288 14 70', balance: 31.0, holidayLeft: 9, age: 48,
      docs: [['Arbeitsvertrag 2018', 'PDF'], ['Eidg. Fachausweis Küchenchef', 'PDF'], ['Hygieneschulung 2026', 'PDF']] }),
    P({ id: 'ik', name: 'Ivana Kovačević', short: 'Ivana K.', initials: 'IK', title: 'Sous-Chef', area: 'Küche', contract: 'Monatslohn', pct: 100, target: 42, cat: 'IIIb', monthly: 5400, skills: ['kitchen'], since: '01.03.2022', phone: '+41 76 540 22 81', balance: 9.5, holidayLeft: 10, age: 35,
      docs: [['Arbeitsvertrag 2022', 'PDF']] }),
    P({ id: 'sf', name: 'Samuel Fritsche', short: 'Samuel F.', initials: 'SF', title: 'Koch', area: 'Küche', contract: 'Monatslohn', pct: 100, target: 42, cat: 'IIIa', monthly: 4750, skills: ['kitchen'], since: '01.08.2023', phone: '+41 79 802 66 47', balance: -1.5, holidayLeft: 15, age: 26,
      absences: [{ kind: 'Krank', from: '24.10.', to: '25.10.', state: 'Arztzeugnis fehlt', days: [] }], docs: [['Arbeitsvertrag 2023', 'PDF']] }),
    P({ id: 'dh', name: 'Daniel Hörler', short: 'Daniel H.', initials: 'DH', title: 'Koch', area: 'Küche', contract: 'Monatslohn', pct: 60, target: 25.2, cat: 'IIIa', monthly: 2700, skills: ['kitchen'], since: '01.11.2024', phone: '+41 78 913 45 20', balance: 1.0, holidayLeft: 13, age: 52,
      avail: { note: 'Di und So nicht verfügbar' }, docs: [['Arbeitsvertrag 2024', 'PDF']] }),
    P({ id: 'ab', name: 'Ardit Berisha', short: 'Ardit B.', initials: 'AB', title: 'Lernender Koch EFZ, 2. Lehrjahr', area: 'Küche', contract: 'Lehrvertrag', pct: 100, target: 42, cat: 'L', monthly: 1250, skills: ['kitchen'], since: '01.08.2025', phone: '+41 76 220 18 39', balance: 0.5, holidayLeft: 19, age: 17, minor: true,
      avail: { note: 'Berufsschule GBS St. Gallen jeden Mittwoch' }, docs: [['Lehrvertrag 2025 bis 2028', 'PDF'], ['Bildungsbericht Sem. 2', 'PDF']] }),
    P({ id: 'ms', name: 'Maria Santos', short: 'Maria S.', initials: 'MS', title: 'Abwasch, Küchenhilfe', area: 'Abwasch', contract: 'Monatslohn', pct: 70, target: 29.4, cat: 'I', monthly: 2570, skills: ['dish', 'kitchen'], since: '01.05.2020', phone: '+41 79 640 77 12', balance: 3.0, holidayLeft: 8, age: 45,
      docs: [['Arbeitsvertrag 2020', 'PDF'], ['Aufenthaltsbewilligung C', 'PDF']] }),
  ];
  staff.forEach((p) => {
    const min = catMin(p.cat);
    if (p.contract === 'Stundenlohn') {
      p.base = Math.ceil(hourlyFromMonthly(min) * 100) / 100 + (p.cat === 'Ia' ? 0.4 : 0.6); // a little above minimum
      p.hourly = Math.round(stdLohn(p.base) * 100) / 100;
      p.rate = p.hourly;
    } else {
      p.rate = Math.round(p.monthly * 13 / 12 / (lgav.monthHours * (p.pct || 100) / 100) * 100) / 100; // incl. 13th month share
    }
    p.minOk = min == null ? true : (p.monthly ? p.monthly / ((p.pct || 100) / 100) >= min : p.base >= hourlyFromMonthly(min) - 0.001);
  });
  const byId = Object.fromEntries(staff.map((p) => [p.id, p]));

  // Shifts for KW 44. d = 0 (Mo) .. 6 (So). s/e as HH:MM, e may be past midnight as 24:30.
  let n = 0;
  const Sh = (p, d, s, e, role, extra) => Object.assign({ id: 'sh' + (++n), p, d, s, e, role }, extra || {});
  const shifts = [
    // Corina Fässler, Gastgeberin (lead). Friday split shift with Zimmerstunde.
    Sh('cf', 1, '10:00', '19:00', 'lead'), Sh('cf', 2, '10:00', '19:00', 'lead'), Sh('cf', 3, '14:00', '23:30', 'lead'),
    Sh('cf', 4, '10:30', '14:30', 'lead'), Sh('cf', 4, '17:00', '23:30', 'lead'), Sh('cf', 5, '15:00', '23:30', 'lead'),
    // Jonas Inauen, Chef de Service. Saturday late then Sunday brunch: the deliberate rest-time conflict.
    Sh('ji', 1, '16:00', '23:30', 'lead'), Sh('ji', 2, '14:00', '23:30', 'lead'), Sh('ji', 3, '16:00', '23:30', 'service'),
    Sh('ji', 5, '15:00', '23:30', 'service'), Sh('ji', 6, '09:30', '15:30', 'lead', { changed: true }),
    // Lara Manser 80 %
    Sh('lm', 2, '10:30', '14:30', 'service'), Sh('lm', 3, '10:30', '14:30', 'service'), Sh('lm', 4, '17:00', '23:30', 'service'),
    Sh('lm', 5, '17:00', '23:30', 'service'), Sh('lm', 6, '10:30', '15:00', 'service'),
    // Elif Yılmaz 60 %
    Sh('ey', 1, '11:00', '15:00', 'service'), Sh('ey', 2, '11:00', '15:00', 'service'), Sh('ey', 3, '11:00', '15:00', 'service'),
    Sh('ey', 4, '11:00', '17:00', 'service'), Sh('ey', 6, '10:00', '15:00', 'service'),
    // Nico Signer, Aushilfe
    Sh('ns', 1, '11:00', '14:30', 'service'), Sh('ns', 2, '17:00', '23:30', 'service'), Sh('ns', 3, '17:00', '22:30', 'service'),
    Sh('ns', 4, '17:00', '23:30', 'service', { changed: true }), Sh('ns', 5, '17:00', '23:30', 'service'),
    // Mia Zünd, student: Thursday lunch clashes with her lecture.
    Sh('mz', 1, '18:00', '23:30', 'service'), Sh('mz', 3, '11:00', '14:30', 'service'), Sh('mz', 4, '11:00', '14:30', 'service'), Sh('mz', 5, '11:00', '15:00', 'service'),
    // Luca Brunner, bar
    Sh('lb', 1, '17:00', '23:30', 'bar'), Sh('lb', 4, '17:00', '23:30', 'bar'), Sh('lb', 5, '17:00', '23:30', 'bar'),
    // Fabienne Koch, bar: Wednesday planned during approved holiday.
    Sh('fk', 2, '17:00', '23:30', 'bar'), Sh('fk', 3, '17:00', '23:30', 'bar'), Sh('fk', 5, '19:00', '23:30', 'bar'),
    // Thomas Rechsteiner, Küchenchef: 6 days and close to the 50 h ceiling.
    Sh('tr', 1, '09:00', '14:30', 'kitchen'), Sh('tr', 2, '09:00', '22:00', 'kitchen'), Sh('tr', 3, '09:00', '21:00', 'kitchen'),
    Sh('tr', 4, '14:00', '22:30', 'kitchen'), Sh('tr', 5, '14:00', '22:30', 'kitchen'), Sh('tr', 6, '09:30', '15:00', 'kitchen'),
    // Ivana Kovačević, Sous-Chef
    Sh('ik', 1, '14:00', '22:30', 'kitchen'), Sh('ik', 2, '16:00', '22:30', 'kitchen'), Sh('ik', 3, '14:00', '22:30', 'kitchen'),
    Sh('ik', 4, '10:00', '14:30', 'kitchen'), Sh('ik', 5, '14:00', '22:30', 'kitchen'),
    // Samuel Fritsche, Koch. Tuesday split shift.
    Sh('sf', 1, '10:30', '14:00', 'kitchen'), Sh('sf', 1, '17:00', '22:30', 'kitchen'), Sh('sf', 5, '10:00', '14:30', 'kitchen'),
    Sh('sf', 3, '16:00', '22:30', 'kitchen'), Sh('sf', 4, '16:00', '22:30', 'kitchen'), Sh('sf', 6, '08:30', '15:00', 'kitchen'),
    // Daniel Hörler 60 %, not available Tue and Sun
    Sh('dh', 2, '10:00', '14:30', 'kitchen'), Sh('dh', 3, '10:00', '14:30', 'kitchen'), Sh('dh', 4, '09:00', '14:30', 'kitchen', { changed: true }),
    Sh('dh', 5, '09:00', '14:30', 'kitchen'),
    // Ardit Berisha, apprentice, 17: Friday until 23:30 breaks the youth rule.
    Sh('ab', 1, '09:00', '14:30', 'kitchen'), Sh('ab', 3, '09:00', '14:30', 'kitchen'), Sh('ab', 4, '17:00', '23:30', 'kitchen'),
    Sh('ab', 6, '08:30', '15:00', 'kitchen'),
    // Maria Santos, Abwasch
    Sh('ms', 2, '18:00', '23:30', 'dish'), Sh('ms', 3, '18:00', '23:30', 'dish'), Sh('ms', 4, '18:00', '23:30', 'dish'),
    Sh('ms', 5, '18:00', '23:30', 'dish'), Sh('ms', 6, '10:30', '15:00', 'dish'),
    // Open shifts (no person yet)
    Sh(null, 4, '18:00', '23:30', 'bar', { open: true, note: 'Zwei Gruppen, Olma-Nachklang' }),
    Sh(null, 5, '18:00', '23:30', 'service', { open: true, note: 'Firmenessen Raiffeisen, 34 Gäste' }),
    Sh(null, 5, '17:00', '22:30', 'kitchen', { open: true, note: 'Firmenessen Raiffeisen, Menü 3 Gänge' }),
    Sh(null, 2, '11:00', '14:30', 'dish', { open: true, note: 'Mittag mit Bankett 40 Personen' }),
  ];

  // Required staffing per area: [from, to, count] windows per day index.
  const W = (...w) => w;
  const reqTemplate = {
    Service: [null,
      W([11, 14, 3], [14, 17, 1], [17, 18, 2], [18, 23.5, 2]),
      W([11, 14, 3], [14, 17, 1], [17, 18, 2], [18, 23.5, 2]),
      W([11, 14, 3], [14, 17, 1], [17, 18, 2], [18, 22, 3], [22, 23.5, 2]),
      W([11, 14, 3], [14, 17, 1], [17, 18, 2], [18, 22, 3], [22, 23.5, 3]),
      W([11, 15, 1], [15, 17, 2], [17, 18, 3], [18, 22, 5], [22, 23.5, 3]),
      W([10, 10.5, 2], [10.5, 15, 3])],
    Bar: [null,
      W([17, 23.5, 1]), W([17, 23.5, 1]), W([17, 23.5, 1]), W([17, 18, 1], [18, 23.5, 2]), W([17, 19, 1], [19, 23.5, 2]), W()],
    Küche: [null,
      W([9, 11, 1], [11, 14, 2], [14, 17, 1], [17, 22, 2]),
      W([9, 11, 1], [11, 14, 2], [14, 17, 1], [17, 22, 2]),
      W([9, 11, 1], [11, 14, 3], [14, 17, 1], [17, 21, 3], [21, 22, 2]),
      W([9, 11, 1], [11, 14, 2], [14, 17, 1], [17, 21, 3], [21, 22, 2]),
      W([9, 11, 1], [11, 14, 2], [14, 17, 1], [17, 21, 3], [21, 22, 2]),
      W([8.5, 10, 2], [10, 15, 3])],
    Abwasch: [null,
      W(), W([11, 14.5, 1], [18, 23.5, 1]), W([18, 23.5, 1]), W([18, 23.5, 1]), W([18, 23.5, 1]), W([10.5, 15, 1])],
  };
  // Expected guests (covers) and orders per hour, used for the day timeline. index = hour 8..23
  const HOURS = Array.from({ length: 16 }, (_, i) => 8 + i); // 8..23
  const guestsTemplate = [
    null,
    [0, 0, 0, 22, 41, 30, 6, 4, 3, 10, 26, 32, 24, 14, 6, 0],
    [0, 0, 0, 24, 44, 31, 7, 4, 4, 12, 28, 35, 26, 15, 7, 0],
    [0, 0, 0, 25, 46, 34, 8, 5, 5, 14, 34, 41, 31, 19, 9, 0],
    [0, 0, 0, 26, 48, 36, 9, 6, 8, 18, 42, 52, 44, 28, 14, 0],
    [0, 0, 0, 18, 36, 30, 12, 10, 12, 22, 48, 64, 58, 36, 18, 0],
    [0, 0, 18, 34, 46, 40, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];
  const forecastSales = [0, 6400, 7100, 8600, 10800, 12400, 7200];
  const target = { labourPct: 32, warnPct: 35 };

  // ---------- Engine ----------
  const len = (sh) => toH(sh.e) - toH(sh.s);
  const breakFor = (h) => (h > 9 ? 1 : h > 7 ? 0.5 : h > 5.5 ? 0.25 : 0); // ArG Art. 15
  const paidHours = (sh) => Math.max(0, len(sh) - breakFor(len(sh)));
  const nightHours = (sh) => Math.max(0, toH(sh.e) - Math.max(23, toH(sh.s)));
  function shiftCost(sh, rate) {
    const h = paidHours(sh);
    let c = h * rate;
    c += nightHours(sh) * rate * lgav.surcharges[0].pct / 100;
    if (days[sh.d].holiday) c += h * rate * lgav.surcharges[2].pct / 100;
    else if (sh.d === 6) c += h * rate * lgav.surcharges[1].pct / 100;
    return c * (1 + lgav.employerPct / 100);
  }
  const avgOpenRate = () => { const r = staff.filter((p) => p.contract !== 'Lehrvertrag'); return r.reduce((s, p) => s + p.rate, 0) / r.length; };
  function requiredAt(area, d, h) {
    const w = (reqTemplate[area][d] || []);
    for (const [a, b, c] of w) if (h >= a && h < b) return c;
    return 0;
  }
  // half-hour slots from 8:00 to 24:00
  const SLOTS = Array.from({ length: 32 }, (_, i) => 8 + i / 2);

  function compute(list) {
    list = list || shifts;
    const people = {};
    staff.forEach((p) => { people[p.id] = { hours: 0, cost: 0, days: Array(7).fill(0), shifts: [], night: 0 }; });
    const dayCost = Array(7).fill(0), dayHours = Array(7).fill(0), openCost = Array(7).fill(0);
    list.forEach((sh) => {
      const rate = sh.p ? byId[sh.p].rate : avgOpenRate();
      const c = shiftCost(sh, rate);
      sh.hours = paidHours(sh); sh.cost = c; sh.brk = breakFor(len(sh));
      if (sh.p) {
        const x = people[sh.p];
        x.hours += sh.hours; x.cost += c; x.days[sh.d] += sh.hours; x.shifts.push(sh); x.night += nightHours(sh);
        dayCost[sh.d] += c; dayHours[sh.d] += sh.hours;
      } else { openCost[sh.d] += c; }
    });
    // coverage per area, per half-hour slot
    const coverage = {};
    areas.forEach((a) => {
      coverage[a] = days.map((day, d) => SLOTS.map((t) => {
        const have = list.filter((sh) => sh.p && sh.d === d && areaOf(sh.role) === a && toH(sh.s) <= t && toH(sh.e) > t).length;
        return { t, have, need: day.closed ? 0 : requiredAt(a, d, t) };
      }));
    });
    // gaps: merge contiguous slots where have < need
    const gaps = [];
    areas.forEach((a) => days.forEach((day, d) => {
      let cur = null;
      coverage[a][d].forEach((c, i) => {
        const short = c.need - c.have;
        if (short > 0) { if (cur && cur.short === short) cur.to = c.t + 0.5; else { if (cur) gaps.push(cur); cur = { area: a, d, from: c.t, to: c.t + 0.5, short }; } }
        else if (cur) { gaps.push(cur); cur = null; }
      });
      if (cur) gaps.push(cur);
    }));
    gaps.forEach((g) => { g.label = `${days[g.d].short} ${fmtH(g.from)} bis ${fmtH(g.to)}`; });
    const conflicts = rules(list, people);
    const totalCost = dayCost.reduce((a, b) => a + b, 0);
    const totalSales = forecastSales.reduce((a, b) => a + b, 0);
    const pctByDay = dayCost.map((c, d) => (forecastSales[d] ? c / forecastSales[d] * 100 : null));
    return {
      people, dayCost, dayHours, openCost, coverage, gaps, conflicts,
      totalCost, totalSales, totalHours: dayHours.reduce((a, b) => a + b, 0),
      pct: totalCost / totalSales * 100, pctByDay,
      openCount: list.filter((s) => !s.p).length,
    };
  }

  function rules(list, people) {
    const out = [];
    const C = (sev, kind, p, d, title, detail, rule, fix) => out.push({ sev, kind, p, d, title, detail, rule, fix, id: kind + '-' + (p || 'x') + '-' + d });
    staff.forEach((p) => {
      const mine = list.filter((s) => s.p === p.id).sort((a, b) => a.d - b.d || toH(a.s) - toH(b.s));
      // rest time between consecutive shifts
      for (let i = 1; i < mine.length; i++) {
        const a = mine[i - 1], b = mine[i];
        const rest = (b.d * 24 + toH(b.s)) - (a.d * 24 + toH(a.e));
        if (a.d !== b.d && rest > 0 && rest < 11) C('error', 'rest', p.id, b.d, `Ruhezeit ${h1(rest)} Std.`, `${p.name}: ${days[a.d].short} bis ${a.e}, ${days[b.d].short} ab ${b.s}. Mindestens 11 Std. am Stück.`, 'ArG Art. 15a', `${days[b.d].short} erst ab ${fmtH(toH(a.e) + 11 - 24)} einplanen oder tauschen`);
      }
      const x = people[p.id];
      // max hours
      if (p.target && x.hours > p.target + 4) C('warn', 'hours', p.id, null, `${h1(x.hours)} Std. geplant`, `${p.name}: Soll ${h1(p.target)} Std., ${h1(x.hours - p.target)} Std. darüber. Saldo bereits +${h1(p.balance)} Std.`, 'L-GAV Art. 15, ArG max. 50 Std.', 'Eine Schicht an Ivana Kovačević oder Daniel Hörler geben');
      if (p.maxWeek && x.hours > p.maxWeek) C('warn', 'hours', p.id, null, `${h1(x.hours)} von max. ${p.maxWeek} Std.`, `${p.name}: Studierende im Semester höchstens ${p.maxWeek} Std. pro Woche (Vereinbarung).`, 'Rahmenvertrag', 'Eine Schicht kürzen oder abgeben');
      // rest days
      const workDays = x.days.filter((h) => h > 0).length;
      if (workDays > 5) C('warn', 'restdays', p.id, null, `Nur ${7 - workDays} Ruhetag`, `${p.name}: ${workDays} Arbeitstage in KW 44. L-GAV verlangt 2 Ruhetage pro Woche, im Schnitt mindestens 1.5.`, 'L-GAV Art. 16', 'Sonntag frei geben, offene Schicht ausschreiben');
      // availability
      mine.forEach((s) => {
        if (p.id === 'mz' && [1, 3].includes(s.d) && toH(s.s) < 13.5) C('warn', 'avail', p.id, s.d, 'Nicht verfügbar', `${p.name}: ${days[s.d].short} bis 13:30 Vorlesung, eingeplant ab ${s.s}.`, 'Verfügbarkeit', 'Elif Yılmaz oder Lara Manser fragen');
        if (p.id === 'dh' && [1, 6].includes(s.d)) C('warn', 'avail', p.id, s.d, 'Nicht verfügbar', `${p.name}: ${days[s.d].long} nicht verfügbar.`, 'Verfügbarkeit', 'Schicht verschieben');
        if (p.id === 'ab' && s.d === 2) C('error', 'avail', p.id, s.d, 'Berufsschule', `${p.name}: jeden Mittwoch Berufsschule.`, 'Lehrvertrag', 'Schicht streichen');
        if (p.minor && toH(s.e) > 23) C('error', 'minor', p.id, s.d, 'Jugendschutz bis 23:00', `${p.name} ist 17. Im Gastgewerbe dürfen Jugendliche höchstens bis 23:00 arbeiten, geplant bis ${s.e}.`, 'ArGV 5 Art. 12', 'Ende auf 23:00 setzen');
        (p.absences || []).forEach((a) => { if (a.days.includes(s.d)) C('error', 'absence', p.id, s.d, `${a.kind} bewilligt`, `${p.name}: ${a.kind} vom ${a.from} bis ${a.to} bewilligt, trotzdem eingeplant.`, 'Abwesenheit', 'Luca Brunner einplanen'); });
      });
      // holiday info
      mine.filter((s) => days[s.d].holiday).forEach((s) => C('info', 'holiday', p.id, s.d, 'Feiertag', `${p.name}: ${days[s.d].holiday}. Zuschlag 50 % und ein Ersatzruhetag innert 4 Wochen.`, 'Betriebsregel, L-GAV Art. 18', null));
    });
    const order = { error: 0, warn: 1, info: 2 };
    return out.sort((a, b) => order[a.sev] - order[b.sev]);
  }

  // Publish states: 'draft' | 'published' | 'changed'
  const publish = { state: 'changed', changes: shifts.filter((s) => s.changed).length, notify: ['Corina Fässler', 'Jonas Inauen', 'Nico Signer', 'Daniel Hörler'] };

  // ---------- Requests inbox ----------
  const requests = [
    { id: 'rq1', kind: 'Ferien', p: 'lm', when: 'Mo 16.11. bis So 22.11.2026', days: 5, sent: 'heute, 09:14', text: 'Hochzeit meiner Schwester in Porto.', impact: 'Service Di bis Sa Mittag: Elif Yılmaz und Mia Zünd können übernehmen. Ferienguthaben danach 9 Tage.', state: 'offen' },
    { id: 'rq2', kind: 'Schichttausch', p: 'ns', with: 'mz', when: 'Sa 31.10., 17:00 bis 23:30', sent: 'gestern, 22:41', text: 'Mia übernimmt meinen Samstag, ich nehme ihren Freitagmittag.', impact: 'Mia käme auf 18.5 Std., über ihrem Maximum von 15 Std. pro Woche.', warn: true, state: 'offen' },
    { id: 'rq3', kind: 'Krankmeldung', p: 'sf', when: 'Sa 24.10. bis So 25.10.2026', sent: 'Sa 24.10., 06:52', text: 'Fieber, bleibe zu Hause.', impact: 'Ab dem 3. Tag braucht es ein Arztzeugnis (Betriebsregel). Lohnfortzahlung über KTG ab Tag 3.', doc: 'Arztzeugnis ausstehend', state: 'offen' },
    { id: 'rq4', kind: 'Offene Schicht', p: 'lb', when: 'Fr 30.10., 18:00 bis 23:30, Bar', sent: 'heute, 11:05', text: 'Kann ich gerne machen.', impact: 'Luca käme auf 23.5 Std., über seinem Maximum von 20 Std.', warn: true, state: 'offen' },
    { id: 'rq5', kind: 'Verfügbarkeit', p: 'lb', when: 'Di 12.1. bis Sa 23.1.2027', sent: 'Mo 19.10., 14:30', text: 'Prüfungsphase an der OST.', impact: 'Bar Januar: 2 Abende pro Woche offen.', state: 'offen' },
    { id: 'rq6', kind: 'Ferien', p: 'ji', when: 'Mo 28.12.2026 bis So 3.1.2027', days: 4, sent: 'Do 15.10., 18:02', text: 'Wie besprochen.', impact: 'Zwischen den Jahren, Service Leitung durch Corina Fässler.', state: 'bewilligt', by: 'Corina Fässler' },
    { id: 'rq7', kind: 'Schichttausch', p: 'ey', with: 'lm', when: 'Mi 28.10., 11:00 bis 15:00', sent: 'Di 20.10., 10:11', text: 'Arzttermin Kind.', impact: 'Keine Auswirkung auf Kosten.', state: 'abgelehnt', by: 'Jonas Inauen', reason: 'Lara hat an dem Tag schon Mittag.' },
  ];

  // ---------- Time tracking (Zeiterfassung) KW 43, clocked at the till ----------
  // [person, day label, plan, in, out, break min, source, state, note]
  const T = (p, day, plan, inn, out, brk, src, state, note) => ({ p, day, plan, inn, out, brk, src, state, note });
  const punches = [
    T('cf', 'Fr 23.10.', '14:00 bis 23:30', '13:52', null, 0, 'Kasse Tresen', 'eingestempelt', 'Läuft seit 13:52'),
    T('ji', 'Fr 23.10.', '16:00 bis 23:30', '15:58', null, 0, 'Kasse Tresen', 'eingestempelt', 'Läuft seit 15:58'),
    T('ns', 'Fr 23.10.', '17:00 bis 23:30', '17:06', null, 0, 'Kasse Tresen', 'eingestempelt', '6 Min. später'),
    T('tr', 'Fr 23.10.', '14:00 bis 22:30', '13:40', null, 30, 'Küchenmonitor', 'eingestempelt', 'Pause 17:10 bis 17:40'),
    T('ms', 'Fr 23.10.', '18:00 bis 23:30', '17:57', null, 0, 'Küchenmonitor', 'eingestempelt', ''),
    T('lm', 'Fr 23.10.', '17:00 bis 23:30', null, null, 0, '', 'fehlt', 'Nicht eingestempelt, laut Kasse seit 17:04 Bestellungen erfasst'),
    T('ab', 'Fr 23.10.', '09:00 bis 14:30', '08:57', '14:41', 30, 'Küchenmonitor', 'ok', ''),
    T('cf', 'Do 22.10.', '14:00 bis 23:00', '13:55', '23:41', 30, 'Kasse Tresen', 'prüfen', '41 Min. länger, Z-Bericht um 23:58'),
    T('ji', 'Do 22.10.', 'frei', null, null, 0, '', 'ok', ''),
    T('lm', 'Do 22.10.', '10:30 bis 14:30', '10:28', '14:35', 0, 'Kasse Tresen', 'ok', ''),
    T('ns', 'Do 22.10.', '17:00 bis 22:00', '16:59', null, 0, 'Kasse Tresen', 'korrigieren', 'Ausstempeln vergessen'),
    T('fk', 'Do 22.10.', '17:00 bis 23:30', '17:02', '23:48', 0, 'Kasse Tresen', 'prüfen', 'Keine Pause bei 6.8 Std. (ArG: 30 Min. ab 7 Std., 15 Min. ab 5.5 Std.)'),
    T('tr', 'Do 22.10.', '09:00 bis 21:00', '08:51', '21:22', 60, 'Küchenmonitor', 'ok', ''),
    T('sf', 'Do 22.10.', '16:00 bis 22:30', '15:55', '22:34', 15, 'Küchenmonitor', 'ok', ''),
    T('ab', 'Do 22.10.', '09:00 bis 14:30', '09:12', '14:30', 15, 'Küchenmonitor', 'genehmigt', '12 Min. später, Bus. Genehmigt durch T. Rechsteiner'),
    T('ms', 'Do 22.10.', '18:00 bis 23:00', '17:58', '23:15', 0, 'Küchenmonitor', 'ok', ''),
  ];
  const corrections = [
    { p: 'ns', day: 'Do 22.10.', what: 'Ausstempeln nachtragen', from: 'fehlt', to: '22:08', by: 'Nico Signer (App)', reason: 'Vergessen, bin um 22:05 gegangen', state: 'offen' },
    { p: 'cf', day: 'Mi 21.10.', what: 'Pause erfassen', from: '0 Min.', to: '30 Min.', by: 'Corina Fässler', reason: 'Pause 16:00 bis 16:30 nicht gestempelt', state: 'genehmigt' },
  ];
  // Month close October 2026: hours summary per person (Soll, Ist, Saldo), surcharges, absences, 13th month accrual.
  const month = {
    label: 'Oktober 2026', from: '01.10.2026', to: '31.10.2026', state: 'offen', closeFrom: 'So 1.11.', lastClosed: 'September 2026, abgeschlossen am 2.10. durch Corina Fässler',
    blockers: 4, // open punches/corrections that must be resolved before export
  };
  const workdaysOct = 22; // Soll basis: 5-day week in October 2026 (L-GAV: 42 h / 5)
  const ist = { cf: 196.5, ji: 181.0, lm: 141.0, ey: 104.5, ns: 88.5, mz: 52.0, lb: 66.5, fk: 118.0, tr: 203.5, ik: 182.0, sf: 166.0, dh: 106.5, ab: 172.0, ms: 125.0 };
  const night = { cf: 5.5, ji: 7.0, lm: 4.0, ey: 0, ns: 3.0, mz: 2.5, lb: 6.0, fk: 4.5, tr: 0, ik: 0, sf: 0, dh: 0, ab: 0, ms: 6.5 };
  const sun = { cf: 12.0, ji: 18.0, lm: 17.5, ey: 0, ns: 0, mz: 0, lb: 0, fk: 0, tr: 26.0, ik: 6.5, sf: 19.5, dh: 0, ab: 19.5, ms: 10.0 };
  const absOct = { fk: ['Ferien', 4], sf: ['Krank', 2], lm: ['Ferien', 2], tr: ['Ferien', 1] };
  const monthRows = staff.map((p) => {
    const soll = p.target ? Math.round(p.target / 5 * workdaysOct * 10) / 10 : null;
    const i = ist[p.id];
    const abs = absOct[p.id] || null;
    const credit = abs && p.target ? abs[1] * p.target / 5 : 0;
    const saldo = soll == null ? null : Math.round((i + credit - soll) * 10) / 10;
    const gross = p.contract === 'Stundenlohn' ? i * p.base : p.monthly;
    return {
      p: p.id, soll, ist: i, credit, saldo, prev: p.balance, next: saldo == null ? null : Math.round((p.balance + saldo) * 10) / 10,
      night: night[p.id], sun: sun[p.id], abs, gross: Math.round(gross * 100) / 100,
      thirteenth: Math.round(gross * lgav.thirteenthPct) / 100,
      surcharge: Math.round(((night[p.id] * 0.25) + (sun[p.id] * 0.10)) * p.rate * 100) / 100,
    };
  });
  const exportFormats = [
    { k: 'bexio', name: 'bexio Lohn', file: 'linde_lohn_2026-10_bexio.csv', note: 'Spalten: Personalnummer, Lohnart, Menge, Ansatz, Betrag' },
    { k: 'abacus', name: 'Abacus Lohn (AbaCliK CSV)', file: 'linde_lohn_2026-10_abacus.csv', note: 'Spalten: MA-Nr, LA-Nr, Datum, Anzahl, Ansatz, Text' },
  ];
  const persNo = (p) => String(1000 + staff.indexOf(byId[p]) + 1);
  function exportCsv(k) {
    const rows = [];
    if (k === 'bexio') {
      rows.push(['Personalnummer', 'Name', 'Lohnart', 'Bezeichnung', 'Menge', 'Ansatz', 'Betrag'].join(';'));
      monthRows.forEach((r) => {
        const p = byId[r.p];
        if (p.contract === 'Stundenlohn') rows.push([persNo(r.p), p.name, '1010', 'Stundenlohn', r.ist.toFixed(2), p.base.toFixed(2), (r.ist * p.base).toFixed(2)].join(';'));
        else rows.push([persNo(r.p), p.name, '1000', p.contract === 'Lehrvertrag' ? 'Lehrlingslohn' : 'Monatslohn', '1.00', p.monthly.toFixed(2), p.monthly.toFixed(2)].join(';'));
        if (r.night) rows.push([persNo(r.p), p.name, '1210', 'Nachtzuschlag 25 %', r.night.toFixed(2), (p.rate * 0.25).toFixed(2), (r.night * p.rate * 0.25).toFixed(2)].join(';'));
        if (r.sun) rows.push([persNo(r.p), p.name, '1220', 'Sonntagszuschlag 10 %', r.sun.toFixed(2), (p.rate * 0.10).toFixed(2), (r.sun * p.rate * 0.10).toFixed(2)].join(';'));
        if (p.contract === 'Stundenlohn') rows.push([persNo(r.p), p.name, '1500', 'Ferien- und Feiertagsentschädigung 12.91 %', '', '', (r.ist * p.base * 0.1291).toFixed(2)].join(';'));
      });
    } else {
      rows.push(['MA-Nr', 'LA-Nr', 'Datum', 'Anzahl', 'Ansatz', 'Text'].join(','));
      monthRows.forEach((r) => {
        const p = byId[r.p];
        if (p.contract === 'Stundenlohn') rows.push([persNo(r.p), '1100', '31.10.2026', r.ist.toFixed(2), p.base.toFixed(2), '"Stunden Oktober"'].join(','));
        rows.push([persNo(r.p), '9100', '31.10.2026', r.ist.toFixed(2), '0.00', '"Iststunden Oktober"'].join(','));
        if (r.night) rows.push([persNo(r.p), '1210', '31.10.2026', r.night.toFixed(2), (p.rate * 0.25).toFixed(2), '"Nachtzuschlag"'].join(','));
        if (r.sun) rows.push([persNo(r.p), '1220', '31.10.2026', r.sun.toFixed(2), (p.rate * 0.10).toFixed(2), '"Sonntagszuschlag"'].join(','));
      });
    }
    return rows.join('\n');
  }

  // ---------- Templates and rules ----------
  const templates = [
    { k: 'mittag-sv', name: 'Mittag Service', role: 'service', s: '10:30', e: '14:30', days: 'Di bis Sa', used: 14 },
    { k: 'abend-sv', name: 'Abend Service', role: 'service', s: '17:00', e: '23:30', days: 'Di bis Sa', used: 11 },
    { k: 'lang-sl', name: 'Schichtleitung lang', role: 'lead', s: '14:00', e: '23:30', days: 'Di bis Sa', used: 6 },
    { k: 'bar', name: 'Bar Abend', role: 'bar', s: '17:00', e: '23:30', days: 'Di bis Sa', used: 7 },
    { k: 'frueh-ku', name: 'Küche früh', role: 'kitchen', s: '09:00', e: '14:30', days: 'Di bis Sa', used: 12 },
    { k: 'spaet-ku', name: 'Küche spät', role: 'kitchen', s: '16:00', e: '22:30', days: 'Di bis Sa', used: 10 },
    { k: 'brunch', name: 'Sonntagsbrunch', role: 'kitchen', s: '08:30', e: '15:00', days: 'So', used: 3 },
    { k: 'aw-abend', name: 'Abwasch Abend', role: 'dish', s: '18:00', e: '23:30', days: 'Di bis Sa', used: 5 },
  ];
  templates.forEach((t) => { t.hours = paidHours(t); t.brk = breakFor(len(t)); });
  const ruleSettings = [
    { k: 'rest', name: 'Ruhezeit zwischen zwei Schichten', value: '11 Std.', basis: 'ArG Art. 15a', level: 'Blockiert Veröffentlichung', on: true },
    { k: 'week', name: 'Höchstarbeitszeit pro Woche', value: '50 Std.', basis: 'ArG Art. 9, Gastgewerbe', level: 'Blockiert Veröffentlichung', on: true },
    { k: 'target', name: 'Abweichung vom Wochensoll', value: 'ab 4 Std.', basis: 'L-GAV Art. 15, 42 Std.', level: 'Warnung', on: true },
    { k: 'restdays', name: 'Ruhetage pro Woche', value: '2, mindestens 1.5', basis: 'L-GAV Art. 16', level: 'Warnung', on: true },
    { k: 'breaks', name: 'Pausen', value: '15 Min. ab 5.5 Std., 30 Min. ab 7 Std., 60 Min. ab 9 Std.', basis: 'ArG Art. 15', level: 'Automatisch abgezogen', on: true },
    { k: 'minor', name: 'Jugendliche unter 18', value: 'Ende spätestens 23:00, 12 Std. Ruhe', basis: 'ArGV 5 Art. 12, 16', level: 'Blockiert Veröffentlichung', on: true },
    { k: 'student', name: 'Studierende im Semester', value: 'max. 15 bis 20 Std. pro Woche', basis: 'Rahmenvertrag', level: 'Warnung', on: true },
    { k: 'avail', name: 'Verfügbarkeit und Abwesenheit', value: 'Ferien, Berufsschule, Sperrzeiten', basis: 'Personalprofil', level: 'Warnung', on: true },
  ];

  // ---------- Mobile staff view (Mia Zünd) ----------
  const me = {
    p: 'mz', clock: { state: 'aus', last: 'Do 22.10., 14:00 bis 14:32 ausgestempelt', next: 'Di 27.10., 18:00' },
    weekHours: 0, // computed by renderer from shifts
    openForMe: [
      { d: 5, s: '18:00', e: '23:30', role: 'service', note: 'Firmenessen Raiffeisen, 34 Gäste', pay: 'CHF 24.42/Std. plus 25 % ab 23:00' },
      { d: 4, s: '18:00', e: '23:30', role: 'bar', note: 'Bar, Gruppen', pay: 'CHF 24.42/Std. plus 25 % ab 23:00' },
    ],
    news: [['Plan KW 44 veröffentlicht', 'Mi 21.10., 16:12'], ['Schichttausch mit Nico: wartet auf Corina', 'gestern, 22:41']],
  };

  window.DP = {
    chf, chf0, toH, fmtH, h1, week, days, holidaysSG, roles, areas, areaOf, lgav, catMin, staff, byId, shifts, reqTemplate, HOURS, SLOTS,
    guestsTemplate, forecastSales, target, paidHours, breakFor, nightHours, shiftCost, requiredAt, compute, publish,
    requests, punches, corrections, month, monthRows, exportFormats, exportCsv, templates, ruleSettings, me, stdLohn, hourlyFromMonthly,
  };
})();
