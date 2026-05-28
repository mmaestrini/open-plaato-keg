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

  airlocks: () => json<Airlock[]>('/api/airlocks'),

  airlock: (id: string) => json<Airlock>(`/api/airlocks/${id}`),

  airlockHistory: (id: string, range: Range) =>
    json<LogEntry[]>(`/api/airlocks/${id}/log?range=${range}`),

  setAirlockLabel: (id: string, value: string) =>
    json(`/api/airlocks/${id}/label`, { method: 'POST', body: JSON.stringify({ value }) }),

  // Submit a fresh reading (synthetic / test). The real device does this itself
  // via TCP, but exposing it here is convenient for nudging data during dev.
  pushAirlockData: (id: string, payload: { temperature?: number; bubbles_per_min?: number }) =>
    json(`/api/airlocks/${id}/data`, { method: 'POST', body: JSON.stringify(payload) }),
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
