import { useEffect, useState } from 'react'
import { useI18n } from '../lib/i18n'

const D = {
  en: {
    title: 'Server update', sub: 'Configure Watchtower and trigger a container update. Requires Watchtower with its HTTP API enabled.',
    url: 'Watchtower URL', token: 'API token', tokenSaved: '(token saved, leave blank to keep)',
    tokenHint: 'Same as WATCHTOWER_HTTP_API_TOKEN.', save: 'Save', saved: 'Saved', trigger: 'Trigger update',
    confirm: 'Update the server now? Watchtower will pull the latest image and restart the container.',
    ok: 'Update triggered. Watchtower will pull and restart the container shortly.', err: 'Error',
    noUrl: 'Save a Watchtower URL first.',
  },
  da: {
    title: 'Serveropdatering', sub: 'Konfigurer Watchtower og start en container-opdatering. Kræver Watchtower med HTTP API slået til.',
    url: 'Watchtower-URL', token: 'API-token', tokenSaved: '(token gemt, lad stå tom for at beholde)',
    tokenHint: 'Samme som WATCHTOWER_HTTP_API_TOKEN.', save: 'Gem', saved: 'Gemt', trigger: 'Start opdatering',
    confirm: 'Opdatér serveren nu? Watchtower henter seneste image og genstarter containeren.',
    ok: 'Opdatering startet. Watchtower henter og genstarter containeren om lidt.', err: 'Fejl',
    noUrl: 'Gem først en Watchtower-URL.',
  },
}

export function UpdateSection() {
  const { lang } = useI18n()
  const s = D[lang]
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [hasToken, setHasToken] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/config/watchtower').then((r) => r.json())
      .then((d) => { setUrl(d.url || ''); setHasToken(!!d.has_token) }).catch(() => {})
  }, [])

  const save = async () => {
    setBusy(true)
    try {
      // Legacy behaviour: POST always overwrites the token, so a blank field clears it.
      const r = await fetch('/api/config/watchtower', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), token: token.trim() }),
      })
      const d = await r.json()
      if (d.status !== 'ok') throw new Error(d.error || `HTTP ${r.status}`)
      setHasToken(!!d.has_token); setToken(''); setMsg({ ok: true, text: s.saved })
    } catch (e) { setMsg({ ok: false, text: `${s.err}: ${(e as Error).message}` }) }
    setBusy(false)
  }

  const trigger = async () => {
    if (!url.trim()) return setMsg({ ok: false, text: s.noUrl })
    if (!confirm(s.confirm)) return
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/system/update', { method: 'POST' })
      if (r.ok) setMsg({ ok: true, text: s.ok })
      else {
        const d = await r.json().catch(() => ({}))
        setMsg({ ok: false, text: `${s.err}: ${d.error || r.status}${d.detail ? ` (${d.detail})` : ''}` })
      }
    } catch (e) { setMsg({ ok: false, text: `${s.err}: ${(e as Error).message}` }) }
    setBusy(false)
  }

  const lbl = 'mb-1 block text-xs font-medium text-text-muted'
  return (
    <div className="card-pers">
      <h2 className="font-serif text-lg font-semibold">{s.title}</h2>
      <p className="mb-4 mt-0.5 text-sm italic text-text-muted">{s.sub}</p>
      <div className="flex flex-col gap-3">
        <div><label className={lbl}>{s.url}</label>
          <input className="input-pers" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://watchtower:8080" /></div>
        <div><label className={lbl}>{s.token}</label>
          <input type="password" className="input-pers" value={token} onChange={(e) => setToken(e.target.value)}
            placeholder={hasToken ? s.tokenSaved : ''} />
          <p className="mt-1 text-xs italic text-text-dim">{s.tokenHint}</p></div>
        <div className="flex gap-3">
          <button className="btn-primary-pers disabled:opacity-60" disabled={busy} onClick={() => void save()}>{s.save}</button>
          <button className="btn-pers disabled:opacity-60" disabled={busy} onClick={() => void trigger()}>{s.trigger}</button>
        </div>
        {msg && <p className={`text-sm ${msg.ok ? 'text-success' : 'text-warn'}`}>{msg.text}</p>}
      </div>
    </div>
  )
}
