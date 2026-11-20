/* Shared i18n handler: 6 languages with persistence and browser default
   Pages must define window.I18N_STRINGS = { en:{...}, ja:{...}, zh:{...}, ko:{...}, fr:{...}, es:{...} }
   Optional: pages can listen for 'i18n:changed' and 'i18n:ready' events to run custom updates.
*/
(function () {
  const SUPPORTED = ['en', 'ja', 'zh', 'ko', 'fr', 'es'];
  const LS_KEY = 'i18n.lang';
  let current = null;

  function normalize(lang) {
    if (!lang) return null;
    const lc = String(lang).toLowerCase();
    // Special-case Chinese variants
    if (lc.startsWith('zh')) return 'zh';
    // Map to 2-letter code
    const code = lc.slice(0, 2);
    return SUPPORTED.includes(code) ? code : null;
  }

  function detectInitial() {
    const saved = normalize(localStorage.getItem(LS_KEY));
    if (saved) return saved;
    const nav = normalize(navigator.language || (navigator.languages && navigator.languages[0]));
    return nav || 'en';
  }

  function applyTranslations(lang) {
    const dicts = window.I18N_STRINGS || {};
    const t = dicts[lang];
    if (!t) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      if (key in t) {
        // Prefer textContent for safety; if you need HTML, include a data-i18n-html attribute
        if (el.hasAttribute('data-i18n-html')) el.innerHTML = t[key];
        else el.textContent = t[key];
      }
    });
  }

  function updateActiveButtons(lang, clickedBtn) {
    const btns = document.querySelectorAll('.lang-btn');
    btns.forEach(b => {
      const isActive = b === clickedBtn || b.textContent.trim().toLowerCase().endsWith(lang);
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', String(isActive));
    });
  }

  function setLang(lang, btn) {
    const code = normalize(lang) || 'en';
    current = code;
    localStorage.setItem(LS_KEY, code);
    document.documentElement.setAttribute('lang', code);
    updateActiveButtons(code, btn || null);
    applyTranslations(code);
    // Notify pages with custom behavior
    window.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: code } }));
    return false;
  }

  function ready() {
    const initial = detectInitial();
    setLang(initial);
    window.dispatchEvent(new CustomEvent('i18n:ready', { detail: { lang: initial } }));
  }

  // Wire global
  window.I18N = {
    get: () => current || 'en',
    set: setLang,
    supported: SUPPORTED.slice(),
  };
  window.setLang = setLang; // keep compatibility with inline onclick="setLang('xx', this)"

  // Auto-init
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
