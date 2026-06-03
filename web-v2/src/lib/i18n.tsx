// Lightweight i18n for v2. React-Context based so a single language
// change in any component re-renders ALL consumers.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type Lang = 'en' | 'da'

const STORAGE_KEY = 'plaato_lang'

const T = {
  en: {
    brand_name: 'Pers Bryggeri',
    brand_sub: 'Open Plaato',

    nav_tap_room: 'Tap Room',
    nav_cellar: 'Cellar',
    nav_kegs: 'Kegs',
    nav_history: 'History',
    nav_settings: 'Settings',

    page_breadcrumb_airlocks: 'Airlocks',
    page_status_fermenting: 'Fermenting',
    page_status_idle: 'Idle',
    page_status_done: 'Done',

    kpi_total_bubbles: 'Total Bubbles',
    kpi_total_bubbles_sub: 'since reset',
    kpi_bpm: 'Bubbles · per minute',
    kpi_bpm_sub: 'live',
    kpi_temperature: 'Temperature',
    kpi_temperature_sub: 'live',

    chart_title: 'Fermentation activity',
    chart_subtitle: 'Bubbles per minute over time',
    range_1h: '1h',
    range_1d: '1d',
    range_3d: '3d',
    range_7d: '7d',
    live_indicator: 'Live',
    airlock_unnamed: 'Airlock {n}',

    notifications_title: "Brewmaster's alerts",
    notifications_sub: 'Be summoned to the cellar when the fermentation begins.',
    threshold_label: 'Start-of-fermentation threshold',
    push_label: 'Push notification',
    push_sub: 'Free, instant — install ntfy on iPhone',
    email_label: 'Daily email summary',
    email_sub: 'Sent via Resend',
    save_notifications: 'Save alert settings',

    activity_title: "Brewer's log",
    activity_sub: 'Recent activity',
    activity_no_events: 'No recent events',

    reset_counter: 'Reset counter',
    reset_confirm:
      'Reset bubble counter and clear chart history for this airlock? This cannot be undone.',

    rename_airlock: 'Rename airlock',
    label_placeholder: 'Friendly name (e.g. IPA)',
    save: 'Save',
    cancel: 'Cancel',

    loading: 'Loading…',
    error_loading: 'Could not load data. Is the server reachable?',
    no_airlocks: 'No airlocks connected yet.',
    no_airlocks_sub:
      'Power on a Plaato Airlock and configure it to point at this server. It will appear here once the first data packet arrives.',
    show_demo: 'View example data instead',

    demo_badge: 'Demo mode — synthetic data',
    demo_show: 'Show example data',
    demo_hide: 'Showing demo · click for real',

    readings_in: '{count} readings in last {range}',
    stable: 'stable',
    from_1h_avg: 'from 1h avg',
    in_last_24h: 'in last 24h',

    // ── Tap Room ───────────────────────────────────────────────────────
    taproom_on_tap: 'On tap',
    taproom_is_pouring: 'Pouring now',
    taproom_amount_left: '{amount} {unit} remaining',
    taproom_pct_left: '{pct}% left',
    taproom_no_kegs: 'No kegs connected yet.',
    taproom_no_kegs_sub: 'Connect a Plaato Keg and it will appear here automatically.',
    taproom_abv: 'ABV',
    taproom_ibu: 'IBU',
    taproom_style: 'Style',
    taproom_unnamed: 'Unnamed beer',

    // ── Kegs ──────────────────────────────────────────────────────────
    kegs_title: 'Kegs',
    kegs_subtitle: 'Live weight and batch details for each keg',
    keg_unnamed: 'Keg {n}',
    keg_rename: 'Rename keg',
    keg_pct_left: '{pct}% left',
    keg_amount_left: '{amount} {unit}',
    keg_temperature: 'Temperature',
    keg_is_pouring: 'Pouring',
    keg_idle: 'Idle',
    keg_last_pour: 'Last pour',
    keg_details: 'Batch details',
    keg_beer_style: 'Style',
    keg_abv: 'ABV',
    keg_og: 'OG',
    keg_fg: 'FG',
    keg_date_started: 'Brew date',
    keg_save_details: 'Save',
    keg_saving: 'Saving…',
    keg_saved: 'Saved ✓',
    no_kegs: 'No kegs connected yet.',
    no_kegs_sub:
      'Connect a Plaato Keg and configure it to point at this server. It will appear here once the first data packet arrives.',

    // ── History ────────────────────────────────────────────────────────
    history_title: 'Fermentation history',
    history_subtitle: 'Bubble activity over time for each airlock',
    history_no_data: 'No history data in this range.',
    history_download_csv: 'CSV',
    history_loading: 'Loading history…',

    // ── Settings ───────────────────────────────────────────────────────
    settings_title: 'Settings',
    settings_language: 'Language',
    settings_lang_en: 'English',
    settings_lang_da: 'Dansk',
    settings_display: 'Display',
    settings_time_format: 'Time format',
    settings_time_12h: '12-hour (2:30 PM)',
    settings_time_24h: '24-hour (14:30)',
    settings_notifications_sub: 'Get alerted when fermentation begins or stalls.',
    settings_ntfy_topic: 'ntfy topic',
    settings_ntfy_placeholder: 'e.g. per-bryggeri-alerts',
    settings_ntfy_sub: 'Free push notifications — install ntfy on your phone',
    settings_email_addr: 'Email for daily summary',
    settings_email_placeholder: 'your@email.com',
    settings_email_sub: 'Sent via Resend once per day while fermenting',
    settings_threshold_bpm: 'Alert threshold (bubbles / min)',
    settings_brewfather: 'Brewfather',
    settings_brewfather_sub: 'Connect your account to import batch data.',
    settings_bf_user_id: 'User ID',
    settings_bf_api_key: 'API Key (read-only scope)',
    settings_bf_configured: 'Connected',
    settings_bf_not_configured: 'Not connected',
    settings_bf_connect: 'Connect',
    settings_save: 'Save',
    settings_saved: 'Saved',
    settings_about: 'About',
    settings_server_version: 'Server version',
    settings_server_online: 'Online',
    settings_server_offline: 'Offline',
    settings_server_unknown: 'Checking…',
  },
  da: {
    brand_name: 'Pers Bryggeri',
    brand_sub: 'Open Plaato',

    nav_tap_room: 'Taprum',
    nav_cellar: 'Kælder',
    nav_kegs: 'Fustager',
    nav_history: 'Historik',
    nav_settings: 'Indstillinger',

    page_breadcrumb_airlocks: 'Gærlåse',
    page_status_fermenting: 'Gærer',
    page_status_idle: 'Inaktiv',
    page_status_done: 'Færdig',

    kpi_total_bubbles: 'Bobler i alt',
    kpi_total_bubbles_sub: 'siden nulstilling',
    kpi_bpm: 'Bobler · per minut',
    kpi_bpm_sub: 'live',
    kpi_temperature: 'Temperatur',
    kpi_temperature_sub: 'live',

    chart_title: 'Gæringsaktivitet',
    chart_subtitle: 'Bobler per minut over tid',
    range_1h: '1t',
    range_1d: '1d',
    range_3d: '3d',
    range_7d: '7d',
    live_indicator: 'Live',
    airlock_unnamed: 'Gærlås {n}',

    notifications_title: 'Brygmesterens alarmer',
    notifications_sub: 'Bliv tilkaldt til kælderen, når gæringen begynder.',
    threshold_label: 'Tærskel for gæringsstart',
    push_label: 'Push-notifikation',
    push_sub: 'Gratis og øjeblikkelig — installer ntfy på iPhone',
    email_label: 'Daglig e-mail-opsummering',
    email_sub: 'Sendt via Resend',
    save_notifications: 'Gem alarm-indstillinger',

    activity_title: 'Bryggerens log',
    activity_sub: 'Seneste aktivitet',
    activity_no_events: 'Ingen seneste hændelser',

    reset_counter: 'Nulstil tæller',
    reset_confirm:
      'Nulstil bobletælleren og slet diagramhistorikken for denne gærlås? Dette kan ikke fortrydes.',

    rename_airlock: 'Omdøb gærlås',
    label_placeholder: 'Kaldenavn (f.eks. IPA)',
    save: 'Gem',
    cancel: 'Annuller',

    loading: 'Indlæser…',
    error_loading: 'Kunne ikke indlæse data. Kan serveren nås?',
    no_airlocks: 'Ingen gærlåse er forbundet endnu.',
    no_airlocks_sub:
      'Tænd for en Plaato-gærlås og konfigurer den til at pege på denne server. Den vil dukke op her, så snart første datapakke ankommer.',
    show_demo: 'Vis eksempeldata i stedet',

    demo_badge: 'Demo-tilstand — syntetiske data',
    demo_show: 'Vis eksempeldata',
    demo_hide: 'Viser demo · klik for at se rigtige data',

    readings_in: '{count} aflæsninger i sidste {range}',
    stable: 'stabil',
    from_1h_avg: 'fra 1t-gennemsnit',
    in_last_24h: 'sidste 24 timer',

    // ── Tap Room ───────────────────────────────────────────────────────
    taproom_on_tap: 'På tryk',
    taproom_is_pouring: 'Hælder nu',
    taproom_amount_left: '{amount} {unit} tilbage',
    taproom_pct_left: '{pct}% tilbage',
    taproom_no_kegs: 'Ingen fustager er forbundet endnu.',
    taproom_no_kegs_sub: 'Tilslut en Plaato Keg, og den vil dukke op her automatisk.',
    taproom_abv: 'ABV',
    taproom_ibu: 'IBU',
    taproom_style: 'Øltype',
    taproom_unnamed: 'Unavngivet øl',

    // ── Kegs ──────────────────────────────────────────────────────────
    kegs_title: 'Fustager',
    kegs_subtitle: 'Live vægt og batchdetaljer for hver fustage',
    keg_unnamed: 'Fustage {n}',
    keg_rename: 'Omdøb fustage',
    keg_pct_left: '{pct}% tilbage',
    keg_amount_left: '{amount} {unit}',
    keg_temperature: 'Temperatur',
    keg_is_pouring: 'Hælder',
    keg_idle: 'Inaktiv',
    keg_last_pour: 'Seneste hældning',
    keg_details: 'Batchdetaljer',
    keg_beer_style: 'Øltype',
    keg_abv: 'ABV',
    keg_og: 'OG',
    keg_fg: 'FG',
    keg_date_started: 'Bryggdato',
    keg_save_details: 'Gem',
    keg_saving: 'Gemmer…',
    keg_saved: 'Gemt ✓',
    no_kegs: 'Ingen fustager er forbundet endnu.',
    no_kegs_sub:
      'Tilslut en Plaato Keg og konfigurer den til at pege på denne server. Den vil dukke op her, så snart første datapakke ankommer.',

    // ── History ────────────────────────────────────────────────────────
    history_title: 'Gæringshistorik',
    history_subtitle: 'Boblingsaktivitet over tid for hver gærlås',
    history_no_data: 'Ingen historikdata i dette interval.',
    history_download_csv: 'CSV',
    history_loading: 'Indlæser historik…',

    // ── Settings ───────────────────────────────────────────────────────
    settings_title: 'Indstillinger',
    settings_language: 'Sprog',
    settings_lang_en: 'English',
    settings_lang_da: 'Dansk',
    settings_display: 'Visning',
    settings_time_format: 'Tidsformat',
    settings_time_12h: '12-timers (2:30 PM)',
    settings_time_24h: '24-timers (14:30)',
    settings_notifications_sub: 'Få besked, når gæringen begynder eller stopper.',
    settings_ntfy_topic: 'ntfy-emne',
    settings_ntfy_placeholder: 'f.eks. per-bryggeri-alarmer',
    settings_ntfy_sub: 'Gratis push-notifikationer — installer ntfy på din telefon',
    settings_email_addr: 'E-mail til daglig opsummering',
    settings_email_placeholder: 'din@email.dk',
    settings_email_sub: 'Sendes via Resend én gang om dagen under gæring',
    settings_threshold_bpm: 'Alarmgrænse (bobler / minut)',
    settings_brewfather: 'Brewfather',
    settings_brewfather_sub: 'Tilslut din konto for at importere batchdata.',
    settings_bf_user_id: 'Bruger-ID',
    settings_bf_api_key: 'API-nøgle (kun læsning)',
    settings_bf_configured: 'Forbundet',
    settings_bf_not_configured: 'Ikke forbundet',
    settings_bf_connect: 'Tilslut',
    settings_save: 'Gem',
    settings_saved: 'Gemt',
    settings_about: 'Om',
    settings_server_version: 'Serverversion',
    settings_server_online: 'Online',
    settings_server_offline: 'Offline',
    settings_server_unknown: 'Tjekker…',
  },
} as const

export type Key = keyof typeof T.en

type I18nValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: Key, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function readStored(): Lang {
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'da' ? 'da' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => readStored())

  useEffect(() => {
    document.documentElement.lang = lang
    localStorage.setItem(STORAGE_KEY, lang)
  }, [lang])

  const t = useCallback(
    (key: Key, vars?: Record<string, string | number>): string => {
      let s: string = (T[lang][key] ?? T.en[key] ?? key) as string
      if (vars) for (const k in vars) s = s.replace(`{${k}}`, String(vars[k]))
      return s
    },
    [lang],
  )

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const v = useContext(I18nContext)
  if (!v) throw new Error('useI18n must be used within an I18nProvider')
  return v
}
