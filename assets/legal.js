// Shared script for the legal pages (impressum.html, datenschutz.html, agb.html). Load it after the page's own
// `var D = { de:{}, en:{...} }` dictionary. German lives in the HTML (no-JS fallback); English lives in D.en.
// Same storage keys as the home page: nordane-lang (de|en) and nordane-theme (light|dark).
(function(){
  var root = document.documentElement, KEY = 'nordane-lang', D = window.D || { de:{}, en:{} };
  var COMMON = {
    de: { 'mode.toDark':'Dunkles Design einschalten', 'mode.toLight':'Helles Design einschalten' },
    en: { 'mode.toDark':'Switch to dark mode', 'mode.toLight':'Switch to light mode',
      'nav.aria':'Main', 'brand.aria':'Nordane home', 'lang.aria':'Language', 'nav.contact':'Get in touch',
      'foot.country':'Switzerland', 'foot.imp':'Legal notice', 'foot.ds':'Privacy', 'foot.agb':'Terms',
      'foot.li':'Nordane on LinkedIn', 'foot.x':'Nordane on X', 'foot.fb':'Nordane on Facebook' }
  };
  var base = 'de', kinds = [['data-i18n','text'],['data-i18n-html','html'],['data-i18n-aria','aria'],['data-i18n-content','content']];
  function get(el, how){ return how === 'text' ? el.textContent : how === 'html' ? el.innerHTML : el.getAttribute(how === 'aria' ? 'aria-label' : 'content'); }
  function put(el, how, v){ if (how === 'text') el.textContent = v; else if (how === 'html') el.innerHTML = v; else el.setAttribute(how === 'aria' ? 'aria-label' : 'content', v); }
  D[base] = D[base] || {};
  D[base].title = document.title;
  kinds.forEach(function(k){ document.querySelectorAll('[' + k[0] + ']').forEach(function(el){ D[base][el.getAttribute(k[0])] = get(el, k[1]); }); });
  var lang = base;
  function t(key){ return (D[lang] && D[lang][key]) || (COMMON[lang] && COMMON[lang][key]) || D[base][key] || COMMON[base][key] || key; }
  function pick(){
    var q = null, s = null;
    try { q = new URLSearchParams(location.search).get('lang'); } catch(e) {}
    if (q === 'de' || q === 'en') { try { localStorage.setItem(KEY, q); } catch(e) {} return q; }
    try { s = localStorage.getItem(KEY); } catch(e) {}
    if (s === 'de' || s === 'en') return s;
    return /^de/i.test((navigator.languages && navigator.languages[0]) || navigator.language || '') ? 'de' : 'en';
  }
  function apply(next, user){
    lang = next;
    root.setAttribute('lang', lang === 'de' ? 'de-CH' : 'en');
    document.title = t('title');
    kinds.forEach(function(k){ document.querySelectorAll('[' + k[0] + ']').forEach(function(el){ put(el, k[1], t(el.getAttribute(k[0]))); }); });
    // Long texts (privacy notice, terms) have one block per language: <div data-block="de"> and <div data-block="en" hidden>.
    document.querySelectorAll('[data-block]').forEach(function(el){ el.hidden = el.getAttribute('data-block') !== lang; });
    document.querySelectorAll('.lang button').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false'); });
    // The wordmark goes to the home page in the same language.
    document.querySelectorAll('a.brand').forEach(function(a){ a.setAttribute('href', lang === 'de' ? '/de/' : '/'); });
    if (user) { try { localStorage.setItem(KEY, lang); } catch(e) {} }
    syncMode();
  }
  document.querySelectorAll('.lang button').forEach(function(b){ b.addEventListener('click', function(){
    apply(b.dataset.lang, true);
    if (location.search) history.replaceState(null, '', location.pathname + location.hash);
  }); });

  // Light/dark toggle, remembered under the key the pre-paint script reads.
  var btn = document.getElementById('mode'), meta = document.querySelector('meta[name="theme-color"]');
  function syncMode(){
    var d = root.getAttribute('data-theme') === 'dark';
    if (btn) btn.setAttribute('aria-label', t(d ? 'mode.toLight' : 'mode.toDark'));
    if (meta) meta.setAttribute('content', d ? '#05080d' : '#f5f7fa');
  }
  if (btn) btn.addEventListener('click', function(){
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    if (next === 'dark') root.setAttribute('data-theme', 'dark'); else root.removeAttribute('data-theme');
    try { localStorage.setItem('nordane-theme', next); } catch(e) {}
    syncMode();
  });
  apply(pick(), false);
})();
