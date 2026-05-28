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
    reset_confirm: 'Reset bubble counter for this airlock?',

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
    reset_confirm: 'Nulstil bobletælleren for denne gærlås?',

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
