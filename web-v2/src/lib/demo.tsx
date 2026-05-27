// Demo mode: synthetic fermentation data, shared across the app via
// React Context so toggling from any component updates ALL consumers
// (same fix pattern as i18n).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Airlock, LogEntry, Range } from './api'

const STORAGE_KEY = 'plaato_demo'

export const DEMO_AIRLOCK_ID = 'demo-airlock-0000000000000000000000000000'

type DemoValue = {
  demo: boolean
  setDemo: (v: boolean) => void
  toggle: () => void
}

const DemoContext = createContext<DemoValue | null>(null)

function readStored(): boolean {
  // URL ?demo=1 flag wins on first load and persists.
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo')) {
    const v = new URLSearchParams(location.search).get('demo')
    const on = v === null || v === '1' || v === 'true'
    localStorage.setItem(STORAGE_KEY, on ? '1' : '0')
    return on
  }
  return localStorage.getItem(STORAGE_KEY) === '1'
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [demo, setDemoState] = useState<boolean>(() => readStored())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, demo ? '1' : '0')
  }, [demo])

  const setDemo = useCallback((v: boolean) => setDemoState(v), [])
  const toggle = useCallback(() => setDemoState((d) => !d), [])

  return <DemoContext.Provider value={{ demo, setDemo, toggle }}>{children}</DemoContext.Provider>
}

export function useDemoMode(): DemoValue {
  const v = useContext(DemoContext)
  if (!v) throw new Error('useDemoMode must be used within a DemoModeProvider')
  return v
}

// ─── Mock fermentation curve ────────────────────────────────────────────

function rangeToDays(range: Range): number {
  switch (range) {
    case '24h':
      return 1
    case '3d':
      return 3
    case '7d':
      return 7
    case '30d':
      return 30
  }
}

export function mockHistory(range: Range): LogEntry[] {
  const days = rangeToDays(range)
  // ~one reading every 5 min — matches the real Plaato Airlock cadence
  const points = Math.min(days * 24 * 12, 2016)
  const now = Math.floor(Date.now() / 1000)
  const totalSeconds = days * 86400
  const step = totalSeconds / points

  // Compress the fermentation curve so even a 1d view shows the shape.
  const compress = days < 7 ? 7 / days : 1

  const entries: LogEntry[] = []
  for (let i = 0; i < points; i++) {
    const ts = now - (points - i) * step
    const x = (i / points) * compress

    let bpm: number
    const xc = Math.min(x, 1)
    if (xc < 0.1) {
      bpm = 0.1 + Math.random() * 0.3
    } else if (xc < 0.35) {
      const k = (xc - 0.1) / 0.25
      bpm = 0.3 + k * 8.5 + (Math.random() - 0.5) * 1.4
    } else {
      const k = (xc - 0.35) / 0.65
      bpm = Math.max(0, 9 * Math.exp(-2.5 * k) + (Math.random() - 0.5) * 0.8)
    }
    bpm = Math.max(0, +bpm.toFixed(2))

    const tempBoost = bpm > 4 ? 0.6 + Math.random() * 0.3 : 0
    const temperature = +(19.5 + tempBoost + (Math.random() - 0.5) * 0.25).toFixed(2)

    entries.push({
      timestamp: Math.floor(ts),
      bubbles_per_min: String(bpm),
      temperature: String(temperature),
    })
  }
  return entries
}

export function mockAirlock(id?: string): Airlock {
  return {
    id: id || DEMO_AIRLOCK_ID,
    label: 'Primary Fermenter (demo)',
    temperature: '20.4',
    bubbles_per_min: '3.8',
    error: '0',
    total_bubble_count: '18432',
    last_bubble_count: '1204',
  }
}
