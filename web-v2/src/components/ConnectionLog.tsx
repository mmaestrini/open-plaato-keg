import { useEffect, useState } from 'react'
import { useI18n } from '../lib/i18n'

// Connection history for one keg: connects, drops and smart-plug restarts.
// Shows the last 24 h; if that is empty, the last 3 days. Scrolls inside ~6 rows.

type Ev = { at: number; type: 'connected' | 'disconnected' | 'restart'; detail: string }

const D = {
  en: { day: 'Connection log (24 h)', days3: 'Connection log (3 days)', empty: 'No connection events in the last 3 days.',
        connected: 'Connected', disconnected: 'Dropped', restart: 'Restarted by plug' },
  da: { day: 'Forbindelseslog (24 t)', days3: 'Forbindelseslog (3 dage)', empty: 'Ingen forbindelseshændelser de sidste 3 dage.',
        connected: 'Forbundet', disconnected: 'Afbrudt', restart: 'Genstartet af stik' },
}
const DOT = { connected: 'bg-success', disconnected: 'bg-red-500', restart: 'bg-accent' }

export function ConnectionLog({ kegId }: { kegId: string }) {
  const { lang } = useI18n()
  const s = D[lang === 'da' ? 'da' : 'en']
  const [events, setEvents] = useState<Ev[] | null>(null)

  useEffect(() => {
    fetch(`/api/kegs/${encodeURIComponent(kegId)}/events?days=3`)
      .then((r) => r.json()).then(setEvents).catch(() => setEvents([]))
  }, [kegId])

  const today = events?.filter((e) => e.at > Date.now() - 86_400_000) ?? []
  const shown = today.length ? today : events ?? []

  return (
    <div className="mt-3 rounded-lg border border-border p-3">
      <h3 className="mb-2 font-serif text-sm font-medium uppercase tracking-widest text-text-muted">{today.length ? s.day : s.days3}</h3>
      {events === null ? <p className="text-xs text-text-muted">…</p>
        : shown.length === 0 ? <p className="text-xs text-text-muted">{s.empty}</p>
        : (
          <ul className="max-h-[9.5rem] space-y-1.5 overflow-y-auto overscroll-contain pr-1 text-xs">
            {shown.map((e) => (
              <li key={e.at} className="flex h-5 items-center gap-2 whitespace-nowrap">
                <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[e.type] ?? 'bg-text-muted'}`} />
                <span className="shrink-0 font-mono text-text-muted">
                  {new Date(e.at).toLocaleString(lang === 'da' ? 'da-DK' : 'en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="truncate" title={e.detail}><b className="font-semibold">{s[e.type] ?? e.type}</b>{e.detail ? ` · ${e.detail}` : ''}</span>
              </li>
            ))}
          </ul>
        )}
    </div>
  )
}
