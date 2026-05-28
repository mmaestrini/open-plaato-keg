import { useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { AirlockSelector } from './components/AirlockSelector'
import { AirlockDetail } from './pages/AirlockDetail'
import { api, Airlock } from './lib/api'
import { useI18n } from './lib/i18n'
import { useDemoMode, DEMO_AIRLOCK_ID, mockAirlock } from './lib/demo'

// ─────────────────────────────────────────────────────────────────────
// Stable-id routing for v2 MVP:
//
//   - On mount + on demo flip, fetch real airlocks.
//   - User picks which airlock to view via AirlockSelector.
//   - Default selection: first real airlock (or demo).
//   - The `key` prop on AirlockDetail forces a clean unmount/remount
//     whenever the active id changes (no stale state, no in-flight fetch
//     against the wrong id).
// ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { t } = useI18n()
  const { demo, setDemo } = useDemoMode()
  const [airlocks, setAirlocks] = useState<Airlock[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [retryNonce, setRetryNonce] = useState(0)
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)

  const fetchAirlocks = () => {
    api
      .airlocks()
      .then((a) => {
        setAirlocks(a)
        setErr(null)
      })
      .catch((e) => {
        console.error('Failed to fetch airlocks:', e)
        setErr(String(e))
      })
  }

  // Initial fetch + retry + refetch on demo flip
  useEffect(() => {
    fetchAirlocks()
  }, [demo, retryNonce])

  // Pick a default selection once we have real airlocks
  useEffect(() => {
    if (!selectedId && airlocks && airlocks.length > 0 && !demo) {
      setSelectedId(airlocks[0].id)
    }
  }, [airlocks, selectedId, demo])

  // The id to render. In demo mode, the synthetic id wins.
  const activeAirlockId = demo
    ? DEMO_AIRLOCK_ID
    : selectedId && airlocks?.some((a) => a.id === selectedId)
    ? selectedId
    : airlocks?.[0]?.id

  // For the selector: in demo, fake a one-element list with the demo airlock.
  // In real mode, use the fetched list.
  const selectorAirlocks: Airlock[] = useMemo(() => {
    if (demo) return [mockAirlock()]
    return airlocks ?? []
  }, [demo, airlocks])

  // When the detail page renames an airlock, patch our local list so the
  // selector tab updates immediately (no refetch round-trip needed).
  const handleAirlockLabelChange = (id: string, label: string) => {
    setAirlocks((prev) =>
      prev ? prev.map((a) => (a.id === id ? { ...a, label } : a)) : prev,
    )
  }

  return (
    <>
      <Header />

      {/* Demo mode → render demo detail (no real fetch dependency) */}
      {demo && activeAirlockId && (
        <>
          <div className="container-pers pt-8">
            <AirlockSelector
              airlocks={selectorAirlocks}
              selectedId={activeAirlockId}
              onChange={() => {/* demo has only one */}}
            />
          </div>
          {/* No onLabelChange in demo — rename is disabled there anyway */}
          <AirlockDetail key={activeAirlockId} airlockId={activeAirlockId} />
        </>
      )}

      {/* Real mode: error fetching airlocks */}
      {!demo && err && (
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
      )}

      {/* Real mode: still loading */}
      {!demo && !err && !airlocks && (
        <main className="container-pers py-10">
          <p className="text-center italic text-text-muted">{t('loading')}</p>
        </main>
      )}

      {/* Real mode: no airlocks at all */}
      {!demo && !err && airlocks && airlocks.length === 0 && (
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
      )}

      {/* Real mode: airlocks present — selector + detail */}
      {!demo && !err && activeAirlockId && airlocks && airlocks.length > 0 && (
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
      )}
    </>
  )
}
