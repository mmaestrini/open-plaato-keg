// ─────────────────────────────────────────────────────────────────────
// AirlockRoute — the /airlocks page.
//
// This is the logic that used to live in App.tsx: fetches the list of
// airlocks, manages the selected id, and renders the selector + detail.
// Extracted here so App.tsx can be a clean router layout.
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import { AirlockSelector } from '../components/AirlockSelector'
import { AirlockDetail } from './AirlockDetail'
import { api, Airlock } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { useDemoMode, DEMO_AIRLOCK_ID, mockAirlock } from '../lib/demo'

export function AirlockRoute() {
  const { t } = useI18n()
  const { demo, setDemo } = useDemoMode()
  const [airlocks, setAirlocks] = useState<Airlock[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [retryNonce, setRetryNonce] = useState(0)
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)

  const fetchAirlocks = () => {
    api
      .airlocks()
      .then((a) => { setAirlocks(a); setErr(null) })
      .catch((e) => { console.error('Failed to fetch airlocks:', e); setErr(String(e)) })
  }

  useEffect(() => { fetchAirlocks() }, [demo, retryNonce])

  useEffect(() => {
    if (!selectedId && airlocks && airlocks.length > 0 && !demo) {
      setSelectedId(airlocks[0].id)
    }
  }, [airlocks, selectedId, demo])

  const activeAirlockId = demo
    ? DEMO_AIRLOCK_ID
    : selectedId && airlocks?.some((a) => a.id === selectedId)
    ? selectedId
    : airlocks?.[0]?.id

  const selectorAirlocks: Airlock[] = useMemo(() => {
    if (demo) return [mockAirlock()]
    return airlocks ?? []
  }, [demo, airlocks])

  const handleAirlockLabelChange = (id: string, label: string) => {
    setAirlocks((prev) =>
      prev ? prev.map((a) => (a.id === id ? { ...a, label } : a)) : prev,
    )
  }

  // ── Demo mode ──────────────────────────────────────────────────────
  if (demo && activeAirlockId) {
    return (
      <>
        <div className="container-pers pt-8">
          <AirlockSelector
            airlocks={selectorAirlocks}
            selectedId={activeAirlockId}
            onChange={() => {/* demo has only one */}}
          />
        </div>
        <AirlockDetail key={activeAirlockId} airlockId={activeAirlockId} />
      </>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────
  if (!demo && err) {
    return (
      <main className="container-pers py-10">
        <div className="card-pers mx-auto max-w-lg text-center">
          <p className="font-serif text-lg">{t('error_loading')}</p>
          <p className="mt-2 break-all text-xs text-text-muted">{err}</p>
          <div className="mt-5 flex justify-center gap-3">
            <button onClick={() => setRetryNonce((n) => n + 1)} className="btn-primary-pers">
              Retry
            </button>
            <button onClick={() => setDemo(true)} className="btn-pers">
              {t('show_demo')}
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── Loading ────────────────────────────────────────────────────────
  if (!demo && !err && !airlocks) {
    return (
      <main className="container-pers py-10">
        <p className="text-center italic text-text-muted">{t('loading')}</p>
      </main>
    )
  }

  // ── No airlocks ────────────────────────────────────────────────────
  if (!demo && !err && airlocks && airlocks.length === 0) {
    return (
      <main className="container-pers py-10">
        <div className="card-pers text-center">
          <p className="font-serif text-lg">{t('no_airlocks')}</p>
          <p className="mx-auto mt-2 max-w-prose text-sm italic text-text-muted">
            {t('no_airlocks_sub')}
          </p>
          <button onClick={() => setDemo(true)} className="btn-primary-pers mt-5">
            {t('show_demo')}
          </button>
        </div>
      </main>
    )
  }

  // ── Airlocks present ───────────────────────────────────────────────
  if (!demo && activeAirlockId && airlocks && airlocks.length > 0) {
    return (
      <>
        <div className="container-pers pt-8">
          <AirlockSelector
            airlocks={selectorAirlocks}
            selectedId={activeAirlockId}
            onChange={setSelectedId}
          />
        </div>
        <AirlockDetail
          key={activeAirlockId}
          airlockId={activeAirlockId}
          onLabelChange={handleAirlockLabelChange}
        />
      </>
    )
  }

  return null
}
