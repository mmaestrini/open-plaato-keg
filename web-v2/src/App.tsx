import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { AirlockDetail } from './pages/AirlockDetail'
import { api, Airlock } from './lib/api'
import { useI18n } from './lib/i18n'
import { useDemoMode, DEMO_AIRLOCK_ID } from './lib/demo'

// ─────────────────────────────────────────────────────────────────────
// Stable-id routing for v2 MVP:
//
//   - On mount, fetch real airlocks (regardless of demo state) so that
//     toggling demo off doesn't need to wait for a fetch.
//   - The "active" airlock id is derived from demo + real airlocks.
//   - Pass it to AirlockDetail with a `key` so React fully unmounts /
//     remounts when the id changes — no stale state, no in-flight fetch
//     against the wrong id.
// ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { t } = useI18n()
  const { demo, setDemo } = useDemoMode()
  const [airlocks, setAirlocks] = useState<Airlock[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [retryNonce, setRetryNonce] = useState(0)

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

  // Re-fetch on mount, on demo flip (so a silent failure during demo
  // doesn't strand the user in an error state forever), and on retry.
  useEffect(() => {
    fetchAirlocks()
  }, [demo, retryNonce])

  const activeAirlockId = demo
    ? DEMO_AIRLOCK_ID
    : airlocks && airlocks.length > 0
    ? airlocks[0].id
    : undefined

  return (
    <>
      <Header />

      {/* Demo mode → always render demo detail (no real fetch needed) */}
      {demo && activeAirlockId && (
        <AirlockDetail key={activeAirlockId} airlockId={activeAirlockId} />
      )}

      {/* Real mode + error fetching airlocks */}
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

      {/* Real mode + still loading */}
      {!demo && !err && !airlocks && (
        <main className="container-pers py-10">
          <p className="text-center italic text-text-muted">{t('loading')}</p>
        </main>
      )}

      {/* Real mode + no airlocks at all */}
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

      {/* Real mode + airlocks present */}
      {!demo && !err && activeAirlockId && (
        <AirlockDetail key={activeAirlockId} airlockId={activeAirlockId} />
      )}
    </>
  )
}
