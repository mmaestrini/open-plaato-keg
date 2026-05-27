// Lightweight i18n for v2. Same translation-key idea as v1's i18n.js, but
// React-friendly: a hook + a TS-typed `t(key)` function.
//
// Add new keys to BOTH `en` and `da` below. Danish strings marked TODO
// need native-speaker review.

import { useCallback, useEffect, useState } from 'react'

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
    range_1d: '1d',
    range_3d: '3d',
    range_7d: '7d',

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
    range_1d: '1d',
    range_3d: '3d',
    range_7d: '7d',

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
  },
} as const

export type Key = keyof typeof T.en

function readStored(): Lang {
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'da' ? 'da' : 'en'
}

export function useI18n() {
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

  return { lang, setLang, t }
}
