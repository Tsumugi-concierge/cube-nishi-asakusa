/* Six-language switching for .lang blocks and translated attributes.
   Content stays in each HTML file; changing language never changes the URL. */
(function () {
  'use strict';
  const SUPPORTED = ['en', 'ja', 'zh', 'ko', 'fr', 'es'];
  const LS_KEY = 'i18n.lang';
  let current = null;

  function normalize(lang) {
    const code = String(lang || '').toLowerCase().split(/[-_]/)[0];
    return SUPPORTED.includes(code) ? code : null;
  }

  function detectInitial() {
    // Storage can be blocked by browser privacy settings.
    try {
      const saved = normalize(localStorage.getItem(LS_KEY));
      if (saved) return saved;
    } catch (_) { /* Fall back to browser preferences. */ }
    for (const language of navigator.languages || [navigator.language]) {
      const code = normalize(language);
      if (code) return code;
    }
    return normalize(navigator.language) || 'en';
  }

  function applyTranslations(lang) {
    const t = (window.I18N_STRINGS || {})[lang] || {};
    document.querySelectorAll('.lang[lang]').forEach(el => {
      el.hidden = normalize(el.getAttribute('lang')) !== lang;
    });
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (Object.prototype.hasOwnProperty.call(t, key)) el.textContent = t[key];
    });
    ['aria-label', 'alt', 'placeholder', 'content'].forEach(attribute => {
      document.querySelectorAll('[data-i18n-' + attribute + ']').forEach(el => {
        const key = el.getAttribute('data-i18n-' + attribute);
        if (Object.prototype.hasOwnProperty.call(t, key)) el.setAttribute(attribute, t[key]);
      });
    });
  }

  function setLang(lang) {
    const code = normalize(lang) || 'en';
    const changed = current !== code;
    current = code;
    try { localStorage.setItem(LS_KEY, code); } catch (_) { /* Switching still works. */ }
    document.documentElement.lang = code === 'zh' ? 'zh-Hans' : code;
    document.querySelectorAll('.lang-btn').forEach(button => {
      const active = button.getAttribute('data-lang') === code;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    applyTranslations(code);
    if (changed) window.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: code } }));
    return false;
  }

  function ready() {
    const initial = detectInitial();
    setLang(initial);
    window.dispatchEvent(new CustomEvent('i18n:ready', { detail: { lang: initial } }));
  }

  window.I18N = { get: () => current || 'en', set: setLang, supported: SUPPORTED.slice() };
  window.setLang = setLang;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
