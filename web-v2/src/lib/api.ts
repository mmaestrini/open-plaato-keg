// ─────────────────────────────────────────────────────────────────────
// Open Plaato Keg — HTTP API client
//
// In dev, vite proxies /api to the Elixir backend (see vite.config.ts).
// In prod, nginx does the same proxy (see web-v2/nginx.conf).
// ─────────────────────────────────────────────────────────────────────

export type Airlock = {
  id: string
  label?: string
  temperature?: string
  bubbles_per_min?: string
  error?: string
  last_bubble_count?: string
  total_bubble_count?: string
}

export type Keg = {
  id: string
  my_label?: string
  amount_left?: string
  beer_left_unit?: string
  percent_of_beer_left?: string
  keg_temperature?: string
  is_pouring?: string
  last_pour?: string
  last_pour_string?: string
  my_beer_style?: string
  beer_style?: string
  my_og?: string
  my_fg?: string
  my_abv?: string
  calculated_abv?: string
  my_keg_date?: string
  firmware_version?: string
  wifi_signal_strength?: string
}

export type Tap = {
  id: string
  tap_number?: number
  name?: string
  brewery?: string
  style?: string
  abv?: string
  ibu?: string
  color?: string
  description?: string
  tasting_notes?: string
  keg_id?: string
  handle_image?: string
}

export type AppConfig = {
  time_format?: '12h' | '24h'
  home_page?: string
  airlock_enabled?: boolean
}

export type LogEntry = {
  timestamp: number  // unix seconds
  temperature?: string
  bubbles_per_min?: string
}

export type Range = '1h' | '24h' | '3d' | '7d' | '30d'

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } })
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return res.json() as Promise<T>
}

export const api = {
  alive: () => json<{ version: string; status: string }>('/api/alive'),

  // ── Airlocks ────────────────────────────────────────────────────────
  airlocks: () => json<Airlock[]>('/api/airlocks'),
  airlock: (id: string) => json<Airlock>(`/api/airlocks/${id}`),
  airlockHistory: (id: string, range: Range) =>
    json<LogEntry[]>(`/api/airlocks/${id}/log?range=${range}`),
  setAirlockLabel: (id: string, value: string) =>
    json(`/api/airlocks/${id}/label`, { method: 'POST', body: JSON.stringify({ value }) }),
  resetAirlock: (id: string) =>
    json<{ status: string }>(`/api/airlocks/${id}/reset`, { method: 'POST', body: '{}' }),
  pushAirlockData: (id: string, payload: { temperature?: number; bubbles_per_min?: number }) =>
    json(`/api/airlocks/${id}/data`, { method: 'POST', body: JSON.stringify(payload) }),

  // ── Kegs ────────────────────────────────────────────────────────────
  kegs: () => json<Keg[]>('/api/kegs'),
  keg: (id: string) => json<Keg>(`/api/kegs/${id}`),
  kegHistory: (id: string, range: Range) =>
    json<LogEntry[]>(`/api/kegs/${id}/log?range=${range}`),
  setKegLabel: (id: string, value: string) =>
    json(`/api/kegs/${id}/label`, { method: 'POST', body: JSON.stringify({ value }) }),
  setKegBeerStyle: (id: string, value: string) =>
    json(`/api/kegs/${id}/beer-style`, { method: 'POST', body: JSON.stringify({ value }) }),
  setKegDate: (id: string, value: string) =>
    json(`/api/kegs/${id}/date`, { method: 'POST', body: JSON.stringify({ value }) }),
  setKegOG: (id: string, value: string) =>
    json(`/api/kegs/${id}/og`, { method: 'POST', body: JSON.stringify({ value }) }),
  setKegFG: (id: string, value: string) =>
    json(`/api/kegs/${id}/fg`, { method: 'POST', body: JSON.stringify({ value }) }),

  // ── Taps ────────────────────────────────────────────────────────────
  taps: () => json<Tap[]>('/api/taps'),

  // ── App config ──────────────────────────────────────────────────────
  config: () => json<AppConfig>('/api/config'),
  setTimeFormat: (format: '12h' | '24h') =>
    json('/api/config/time-format', { method: 'POST', body: JSON.stringify({ time_format: format }) }),
  brewfatherStatus: () =>
    json<{ configured: boolean }>('/api/config/brewfather'),
  setBrewfatherConfig: (user_id: string, api_key: string) =>
    json('/api/config/brewfather', { method: 'POST', body: JSON.stringify({ user_id, api_key }) }),
}

// ─── Live updates over WebSocket ────────────────────────────────────────
export type WSMessage =
  | { type: 'airlock'; data: Airlock }
  | (Record<string, unknown> & { type?: undefined })  // keg updates have no type wrapper

export function openWS(onMessage: (msg: WSMessage) => void): WebSocket {
  // In dev vite proxies /ws; in prod nginx does the same. Same-origin.
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  const ws = new WebSocket(`${proto}://${location.host}/ws`)
  ws.addEventListener('message', (ev) => {
    try {
      onMessage(JSON.parse(ev.data))
    } catch {
      /* ignore non-JSON frames */
    }
  })
  return ws
}
