// ──────────────────────────────────────────────────────────────────────
// Resolves the CSS theme variables to actual `rgb()` strings so they can
// be used in Recharts SVG attributes (which don't reliably resolve
// `rgb(var(--foo))` cross-browser).
//
// Re-reads on theme change by observing the data-theme attribute on
// <html>.
// ──────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'

export type ThemeColors = {
  accent: string
  accentDeep: string
  text: string
  textMuted: string
  textDim: string
  border: string
  bg: string
  bgElev: string
  success: string
  warn: string
}

function read(): ThemeColors {
  if (typeof document === 'undefined') {
    return {
      accent: 'rgb(212,146,74)',
      accentDeep: 'rgb(184,115,51)',
      text: 'rgb(245,234,212)',
      textMuted: 'rgb(192,168,128)',
      textDim: 'rgb(122,102,72)',
      border: 'rgb(60,40,20)',
      bg: 'rgb(26,18,10)',
      bgElev: 'rgb(31,22,16)',
      success: 'rgb(140,179,105)',
      warn: 'rgb(217,109,84)',
    }
  }
  const s = getComputedStyle(document.documentElement)
  const c = (name: string) => `rgb(${s.getPropertyValue(name).trim().replace(/\s+/g, ',')})`
  return {
    accent: c('--accent'),
    accentDeep: c('--accent-deep'),
    text: c('--text'),
    textMuted: c('--text-muted'),
    textDim: c('--text-dim'),
    border: c('--border'),
    bg: c('--bg'),
    bgElev: c('--bg-elev'),
    success: c('--success'),
    warn: c('--warn'),
  }
}

export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(() => read())

  useEffect(() => {
    if (typeof document === 'undefined') return
    // Refresh whenever the data-theme attribute on <html> changes.
    const obs = new MutationObserver(() => setColors(read()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  return colors
}
