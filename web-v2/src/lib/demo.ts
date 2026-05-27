// ─────────────────────────────────────────────────────────────────────
// Demo mode: realistic synthetic fermentation data, used until the
// real airlock has accumulated enough readings to look meaningful.
//
// Activation:
//   - Visit ?demo=1 in the URL (persists to localStorage)
//   - Or toggle the "Show example data" button on the chart card
//   - Or call localStorage.setItem('plaato_demo', '1') manually
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react'
import type { Airlock, LogEntry, Range } from './api'

const STORAGE_KEY = 'plaato_demo'

export function useDemoMode() {
  const [demo, setDemo] = useState<boolean>(() => {
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo')) {
      localStorage.setItem(STORAGE_KEY, '1')
      return true
    }
    return localStorage.getItem(STORAGE_KEY) === '1'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, demo ? '1' : '0')
  }, [demo])

  const toggle = useCallback(() => setDemo((d) => !d), [])

  return { demo, setDemo, toggle }
}

// ─── Mock fermentation curve generator ──────────────────────────────────
//
// Models a realistic IPA fermentation:
//   - Lag phase (0-12h): near-zero activity
//   - Acceleration (12h-2d): rapid rise in BPM
//   - Peak (~2-3d): high activity, 6-10 BPM, some noise
//   - Decline (3-7d): exponential decay toward zero
//
// Temperature drifts slightly with fermentation heat then settles.

function rangeToDays(range: Range): number {
  switch (range) {
    case '24h': return 1
    case '3d':  return 3
    case '7d':  return 7
    case '30d': return 30
  }
}

export function mockHistory(range: Range): LogEntry[] {
  const days = rangeToDays(range)
  // ~one reading every 5 min — matches what the real Plaato Airlock emits
  const points = Math.min(days * 24 * 12, 2016)
  const now = Math.floor(Date.now() / 1000)
  const totalSeconds = days * 86400
  const step = totalSeconds / points

  // For shorter ranges, fast-forward through the fermentation curve so we
  // see something meaningful even on a 1d view.
  const compress = days < 7 ? 7 / days : 1

  const entries: LogEntry[] = []
  for (let i = 0; i < points; i++) {
    const ts = now - (points - i) * step
    const x = (i / points) * compress // 0..compress

    // BPM curve: lag → rise → peak → decay
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

    // Temperature: 19.5°C ambient, slight bump during peak activity
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
    id: id || 'demo-airlock-0000000000000000000000000000',
    label: 'Primary Fermenter (demo)',
    temperature: '20.4',
    bubbles_per_min: '3.8',
    error: '0',
    total_bubble_count: '18432',
    last_bubble_count: '1204',
  }
}
