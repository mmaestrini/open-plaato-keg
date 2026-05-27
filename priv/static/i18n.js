// ─────────────────────────────────────────────────────────────────────────────
// Open Plaato — lightweight i18n (EN / DA)
//
// Usage:
//   <script src="/i18n.js"></script>
//   <span data-i18n="taplist_loading">Loading taps…</span>
//
// API:
//   i18n.t('key')              — get translated string (falls back to EN, then key)
//   i18n.setLang('en'|'da')    — switch language (persists to localStorage)
//   i18n.getLang()             — current language code
//   i18n.applyTranslations()   — re-walk the DOM and re-apply
//
// Listen for language changes:
//   document.addEventListener('i18n:changed', e => { /* re-render dynamic UI */ });
//
// Translations below are best-effort Danish. Mark TODO for any phrasing that
// needs review by a native speaker.
// ─────────────────────────────────────────────────────────────────────────────

(function (global) {
  const STORAGE_KEY = 'plaato_lang';
  const DEFAULT_LANG = 'en';
  const SUPPORTED = ['en', 'da'];

  const T = {
    en: {
      // ── Navigation (shared across pages) ────────────────────────────
      nav_home: 'Home',
      nav_kegs: 'Kegs',
      nav_history: 'History',
      nav_configure: 'Configure',
      nav_configure_arrow: 'Configure ▾',
      nav_tap_setup: 'Tap Setup',
      nav_tap_handles: 'Tap Handles',
      nav_scale_setup: 'Scale Setup',
      nav_dashboard_setup: 'Dashboard Setup',
      nav_server_update: 'Server Update',
      nav_airlock_setup: 'Airlock Setup',
      nav_transfer_scales: 'Transfer Scales',
      nav_beverages: 'Beverages',

      // ── Tap List (home) page ────────────────────────────────────────
      taplist_title: 'TAP ROOM',
      taplist_subtitle: 'Open Plaato',
      taplist_loading: 'Loading taps…',
      taplist_no_taps_html:
        'No taps configured yet. Visit <a href="/taplist-setup.html">Tap Setup</a> to add taps.',
      taplist_load_error: 'Could not load tap data. Is the server running?',
      taplist_no_sensor: 'No sensor linked',
      taplist_sensor_offline: 'Sensor offline',
      taplist_tap_count_one: '1 on tap',
      taplist_tap_count_other: '{n} on tap',
      taplist_tap_label: 'TAP {n}',
      taplist_pouring: '● POURING',
      taplist_now_pouring: '● NOW POURING',
      taplist_unnamed_beer: 'Unnamed Beer',

      // ── Airlock page ────────────────────────────────────────────────
      airlock_title: 'Airlock Setup',
      airlock_subtitle: 'Configure Plaato Airlock devices — labels, Grainfather, and Brewfather integration.',
      airlock_support: 'Airlock Support',
      airlock_support_help: 'Enable or disable Plaato Airlock device processing on this server.',
      airlock_enabled: 'Enabled',
      airlock_disabled: 'Disabled',
      airlock_device_settings: 'Device Settings',
      airlock_select_help: 'Select an airlock to configure its label and integration settings. Airlocks appear once they have sent data to the server.',
      airlock_select_label: 'Select Airlock',
      airlock_select_placeholder: 'Select an airlock…',
      airlock_label: 'Label',
      airlock_label_placeholder: 'e.g., Primary, Secondary',
      airlock_set: 'Set',
      airlock_temperature: 'Temperature',
      airlock_bubbles_per_min: 'Bubbles / min',
      airlock_total_bubbles: 'Total bubbles',
      airlock_reset_bubbles: 'Reset bubble counter',
      airlock_reset_confirm: 'Reset total bubble counter for this airlock?',
    },

    da: {
      // ── Navigation ──────────────────────────────────────────────────
      nav_home: 'Hjem',
      nav_kegs: 'Fustager',
      nav_history: 'Historik',
      nav_configure: 'Indstillinger',
      nav_configure_arrow: 'Indstillinger ▾',
      nav_tap_setup: 'Hane-opsætning',
      nav_tap_handles: 'Hanegreb',
      nav_scale_setup: 'Vægt-opsætning',
      nav_dashboard_setup: 'Dashboard-opsætning',
      nav_server_update: 'Server-opdatering',
      nav_airlock_setup: 'Gærlås-opsætning',
      nav_transfer_scales: 'Overfør vægte',
      nav_beverages: 'Drikkevarer',

      // ── Tap List (home) page ────────────────────────────────────────
      taplist_title: 'TAPRUM',
      taplist_subtitle: 'Open Plaato',
      taplist_loading: 'Indlæser haner…',
      taplist_no_taps_html:
        'Ingen haner konfigureret endnu. Besøg <a href="/taplist-setup.html">Hane-opsætning</a> for at tilføje haner.',
      taplist_load_error: 'Kunne ikke indlæse hane-data. Kører serveren?',
      taplist_no_sensor: 'Ingen sensor tilknyttet',
      taplist_sensor_offline: 'Sensor offline', // TODO: review
      taplist_tap_count_one: '1 hane aktiv',
      taplist_tap_count_other: '{n} haner aktive',
      taplist_tap_label: 'HANE {n}',
      taplist_pouring: '● SKÆNKER',
      taplist_now_pouring: '● SKÆNKER NU',
      taplist_unnamed_beer: 'Unavngivet øl',

      // ── Airlock page ────────────────────────────────────────────────
      airlock_title: 'Gærlås-opsætning',
      airlock_subtitle: 'Konfigurér Plaato gærlåse — navne, Grainfather og Brewfather integration.',
      airlock_support: 'Gærlås-understøttelse',
      airlock_support_help: 'Aktivér eller deaktivér behandling af Plaato gærlås-enheder på denne server.',
      airlock_enabled: 'Aktiveret',
      airlock_disabled: 'Deaktiveret',
      airlock_device_settings: 'Enhedsindstillinger',
      airlock_select_help: 'Vælg en gærlås for at konfigurere navn og integrationsindstillinger. Gærlåse vises når de har sendt data til serveren.',
      airlock_select_label: 'Vælg gærlås',
      airlock_select_placeholder: 'Vælg en gærlås…',
      airlock_label: 'Navn',
      airlock_label_placeholder: 'fx Primær, Sekundær',
      airlock_set: 'Gem',
      airlock_temperature: 'Temperatur',
      airlock_bubbles_per_min: 'Bobler / min',
      airlock_total_bubbles: 'Bobler i alt',
      airlock_reset_bubbles: 'Nulstil boble-tæller',
      airlock_reset_confirm: 'Nulstil boble-tælleren for denne gærlås?',
    },
  };

  // ── Public API ────────────────────────────────────────────────────────────
  function getLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED.includes(stored) ? stored : DEFAULT_LANG;
  }

  function setLang(lang) {
    if (!SUPPORTED.includes(lang)) return;
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslations();
    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang } }));
  }

  function t(key, vars) {
    const lang = getLang();
    let str = (T[lang] && T[lang][key]) || T.en[key] || key;
    if (vars) {
      for (const k in vars) {
        str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      }
    }
    return str;
  }

  function applyTranslations() {
    const lang = getLang();
    document.documentElement.lang = lang;

    // textContent (default — safe, escapes HTML)
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const val = t(key);
      if (val !== undefined) el.textContent = val;
    });

    // innerHTML (for translations that contain links, etc.)
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.dataset.i18nHtml;
      const val = t(key);
      if (val !== undefined) el.innerHTML = val;
    });

    // Attribute translations: title, placeholder, aria-label
    ['title', 'placeholder', 'aria-label'].forEach((attr) => {
      const sel = `[data-i18n-${attr}]`;
      document.querySelectorAll(sel).forEach((el) => {
        const key = el.dataset[
          'i18n' + attr.charAt(0).toUpperCase() + attr.slice(1).replace(/-./g, (s) => s[1].toUpperCase())
        ];
        if (key) el.setAttribute(attr, t(key));
      });
    });

    // Toggle UI state on flag buttons
    document.querySelectorAll('[data-lang-flag]').forEach((flag) => {
      flag.classList.toggle('active', flag.dataset.langFlag === lang);
      flag.setAttribute('aria-pressed', flag.dataset.langFlag === lang ? 'true' : 'false');
    });
  }

  // ── Auto-bind flag toggle buttons ────────────────────────────────────────
  function bindFlagButtons() {
    document.querySelectorAll('[data-lang-set]').forEach((btn) => {
      if (btn.dataset.i18nBound) return; // idempotent
      btn.dataset.i18nBound = '1';
      btn.addEventListener('click', () => setLang(btn.dataset.langSet));
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    applyTranslations();
    bindFlagButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Expose ────────────────────────────────────────────────────────────────
  global.i18n = { t, setLang, getLang, applyTranslations, bindFlagButtons };
})(window);
