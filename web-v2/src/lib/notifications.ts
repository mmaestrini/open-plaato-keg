// ─── Notification settings — stored in localStorage ────────────────────
// There's no backend endpoint for these yet; localStorage keeps it simple
// and survives reloads. The real push/email dispatch will come later.

export type NotifSettings = {
  ntfy_topic: string
  email: string
  threshold_bpm: number
  push_enabled: boolean
  email_enabled: boolean
}

const KEY = 'plaato_notif_settings'

const DEFAULTS: NotifSettings = {
  ntfy_topic: '',
  email: '',
  threshold_bpm: 2.0,
  push_enabled: false,
  email_enabled: false,
}

export function loadNotifSettings(): NotifSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    /* ignore parse errors */
  }
  return { ...DEFAULTS }
}

export function saveNotifSettings(s: NotifSettings): void {
  localStorage.setItem(KEY, JSON.stringify(s))
}
