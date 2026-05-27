import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { AirlockDetail } from './pages/AirlockDetail'
import { api, Airlock } from './lib/api'
import { useI18n } from './lib/i18n'

// ──────────────────────────────────────────────────────────
// MVP routing: read the first airlock's id from /api/airlocks
// and render the detail page. When we add React Router we'll
// support /v2/airlocks/:id explicitly.
// ──────────────────────────────────────────────────────────

export default function App() {
  const { t } = useI18n()
  const [airlocks, setAirlocks] = useState<Airlock[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    api.airlocks()
      .then(setAirlocks)
      .catch((e) => setErr(String(e)))
  }, [])

  return (
    <>
      <Header />
      {err && (
        <main className="container-pers py-10">
          <div className="card-pers text-center">
            <p className="font-serif text-lg">{t('error_loading')}</p>
            <p className="mt-2 text-xs text-text-dim">{err}</p>
          </div>
        </main>
      )}
      {!err && !airlocks && (
        <main className="container-pers py-10">
          <p className="text-center italic text-text-muted">{t('loading')}</p>
        </main>
      )}
      {!err && airlocks && airlocks.length === 0 && (
        <main className="container-pers py-10">
          <div className="card-pers text-center">
            <p className="font-serif text-lg">No airlocks connected yet.</p>
            <p className="mt-2 text-sm italic text-text-muted">
              Power on a Plaato Airlock and configure it to point at this server. It will appear here once the first data packet arrives.
            </p>
          </div>
        </main>
      )}
      {!err && airlocks && airlocks.length > 0 && (
        <AirlockDetail airlockId={airlocks[0].id} />
      )}
    </>
  )
}
