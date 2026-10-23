import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '../lib/i18n'

const D = {
  en: {
    title: 'Airlock setup', support: 'Airlock support', supportSub: 'Show airlocks in the app and accept airlock data.',
    on: 'Enabled', off: 'Disabled', select: 'Select an airlock…', none: 'No airlocks yet.',
    label: 'Label', save: 'Save', gf: 'Grainfather', bf: 'Brewfather',
    gfSub: 'Send this airlock\'s data to the Grainfather web app (max every 15 min).',
    bfSub: 'Send this airlock\'s data to a Brewfather custom stream (max every 15 min).',
    enable: 'Enabled', unit: 'Temperature unit', c: 'Celsius', f: 'Fahrenheit', sg: 'Specific gravity',
    og: 'Original gravity (optional)', vol: 'Batch volume (optional)', url: 'Stream URL',
    saved: 'Saved', err: 'Error',
  },
  da: {
    title: 'Airlock-opsætning', support: 'Airlock-understøttelse', supportSub: 'Vis airlocks i appen og modtag airlock-data.',
    on: 'Aktiv', off: 'Inaktiv', select: 'Vælg en airlock…', none: 'Ingen airlocks endnu.',
    label: 'Navn', save: 'Gem', gf: 'Grainfather', bf: 'Brewfather',
    gfSub: 'Send denne airlocks data til Grainfather-webappen (højst hvert 15. min).',
    bfSub: 'Send denne airlocks data til en Brewfather custom stream (højst hvert 15. min).',
    enable: 'Aktiv', unit: 'Temperaturenhed', c: 'Celsius', f: 'Fahrenheit', sg: 'Specifik vægtfylde',
    og: 'Original gravity (valgfri)', vol: 'Batchvolumen (valgfri)', url: 'Stream-URL',
    saved: 'Gemt', err: 'Fejl',
  },
}

type Msg = { ok: boolean; text: string } | null
type Airlock = Record<string, string | undefined> & { id: string }

async function post(path: string, body: unknown) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const d = await r.json().catch(() => ({}))
  if (!r.ok || d.status !== 'ok') throw new Error(d.error || `HTTP ${r.status}`)
}

export function AirlockSetupPage() {
  const { lang } = useI18n()
  const s = D[lang]
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [list, setList] = useState<Airlock[]>([])
  const [sel, setSel] = useState('')
  const [msg, setMsg] = useState<Msg>(null)
  const [label, setLabel] = useState('')
  const [gf, setGf] = useState({ on: false, unit: 'celsius', sg: '1', url: '' })
  const [bf, setBf] = useState({ on: false, unit: 'celsius', sg: '1', og: '', vol: '', url: '' })

  const flash = (ok: boolean, text: string) => { setMsg({ ok, text }); setTimeout(() => setMsg(null), 3500) }
  const run = async (fn: () => Promise<void>, okText: string) => {
    try { await fn(); flash(true, okText) } catch (e) { flash(false, `${s.err}: ${(e as Error).message}`) }
  }

  const loadList = useCallback(() => {
    fetch('/api/airlocks').then((r) => r.json()).then(setList).catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/config').then((r) => r.json()).then((c) => setEnabled(c.airlock_enabled !== false)).catch(() => setEnabled(true))
    loadList()
    const t = setInterval(loadList, 10000)
    return () => clearInterval(t)
  }, [loadList])

  // Seed forms once per selection (not on polling, so edits aren't clobbered).
  useEffect(() => {
    if (!sel) return
    fetch(`/api/airlocks/${encodeURIComponent(sel)}`).then((r) => r.json()).then((d: Airlock) => {
      setLabel((d.label || '').trim())
      setGf({
        on: d.grainfather_enabled === 'true',
        unit: d.grainfather_unit === 'fahrenheit' ? 'fahrenheit' : 'celsius',
        sg: d.grainfather_specific_gravity ? String(d.grainfather_specific_gravity) : '1',
        url: d.grainfather_url || '',
      })
      setBf({
        on: d.brewfather_enabled === 'true',
        unit: d.brewfather_temp_unit === 'fahrenheit' ? 'fahrenheit' : 'celsius',
        sg: d.brewfather_sg ? String(d.brewfather_sg) : '1',
        og: d.brewfather_og || '', vol: d.brewfather_batch_volume || '', url: d.brewfather_url || '',
      })
    }).catch(() => {})
  }, [sel])

  const toggleSupport = (v: boolean) =>
    run(async () => { await post('/api/config/airlock-enabled', { enabled: v }).catch(async (e) => {
      // endpoint returns status ok; surface anything else
      throw e
    }); setEnabled(v) }, s.saved)

  const base = `/api/airlocks/${encodeURIComponent(sel)}`
  const lbl = 'mb-1 block text-xs font-medium text-text-muted'
  const unitSel = (v: string, set: (u: string) => void) => (
    <select className="input-pers" value={v} onChange={(e) => set(e.target.value)}>
      <option value="celsius">{s.c}</option><option value="fahrenheit">{s.f}</option>
    </select>
  )
  const check = (v: boolean, set: (b: boolean) => void) => (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} /> {s.enable}
    </label>
  )

  return (
    <main className="container-pers pb-16">
      <section className="py-10 text-center">
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl">{s.title}</h1>
      </section>

      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        {msg && (
          <div className={`rounded-xl border px-4 py-2 text-sm ${msg.ok ? 'border-success/40 bg-success/[0.08] text-success' : 'border-warn/40 bg-warn/[0.08] text-warn'}`}>
            {msg.ok ? '✓ ' : ''}{msg.text}
          </div>
        )}

        <div className="card-pers">
          <h2 className="font-serif text-lg font-semibold">{s.support}</h2>
          <p className="mb-4 mt-0.5 text-sm italic text-text-muted">{s.supportSub}</p>
          <div className="flex gap-3">
            {[true, false].map((v) => (
              <button key={String(v)} disabled={enabled === null} onClick={() => void toggleSupport(v)}
                className={`rounded-xl border px-5 py-2 font-serif text-sm font-medium ${enabled === v ? 'border-accent bg-accent/[0.10] text-accent' : 'border-border text-text-muted hover:text-text'}`}>
                {v ? s.on : s.off}
              </button>
            ))}
          </div>
        </div>

        <div className="card-pers">
          <select className="input-pers" value={sel} onChange={(e) => setSel(e.target.value)}>
            <option value="">{s.select}</option>
            {list.map((a) => <option key={a.id} value={a.id}>{a.label?.trim() || a.id}</option>)}
          </select>
          {list.length === 0 && <p className="mt-3 text-sm italic text-text-muted">{s.none}</p>}
        </div>

        {sel && (
          <>
            <div className="card-pers">
              <label className={lbl}>{s.label}</label>
              <div className="flex gap-2">
                <input className="input-pers" value={label} onChange={(e) => setLabel(e.target.value)} />
                <button className="btn-pers" onClick={() => void run(async () => { await post(`${base}/label`, { value: label.trim() }); loadList() }, s.saved)}>{s.save}</button>
              </div>
            </div>

            <div className="card-pers flex flex-col gap-3">
              <div><h2 className="font-serif text-lg font-semibold">{s.gf}</h2>
                <p className="mt-0.5 text-sm italic text-text-muted">{s.gfSub}</p></div>
              {check(gf.on, (on) => setGf({ ...gf, on }))}
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className={lbl}>{s.unit}</label>{unitSel(gf.unit, (unit) => setGf({ ...gf, unit }))}</div>
                <div><label className={lbl}>{s.sg}</label>
                  <input className="input-pers" value={gf.sg} onChange={(e) => setGf({ ...gf, sg: e.target.value })} /></div>
              </div>
              <div><label className={lbl}>{s.url}</label>
                <input className="input-pers" value={gf.url} onChange={(e) => setGf({ ...gf, url: e.target.value })} /></div>
              <div><button className="btn-primary-pers" onClick={() => void run(() => post(`${base}/grainfather`, {
                enabled: gf.on, unit: gf.unit, specific_gravity: gf.sg.trim() || '1', url: gf.url.trim(),
              }), s.saved)}>{s.save}</button></div>
            </div>

            <div className="card-pers flex flex-col gap-3">
              <div><h2 className="font-serif text-lg font-semibold">{s.bf}</h2>
                <p className="mt-0.5 text-sm italic text-text-muted">{s.bfSub}</p></div>
              {check(bf.on, (on) => setBf({ ...bf, on }))}
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className={lbl}>{s.unit}</label>{unitSel(bf.unit, (unit) => setBf({ ...bf, unit }))}</div>
                <div><label className={lbl}>{s.sg}</label>
                  <input className="input-pers" value={bf.sg} onChange={(e) => setBf({ ...bf, sg: e.target.value })} /></div>
                <div><label className={lbl}>{s.og}</label>
                  <input className="input-pers" value={bf.og} onChange={(e) => setBf({ ...bf, og: e.target.value })} /></div>
                <div><label className={lbl}>{s.vol}</label>
                  <input className="input-pers" value={bf.vol} onChange={(e) => setBf({ ...bf, vol: e.target.value })} /></div>
              </div>
              <div><label className={lbl}>{s.url}</label>
                <input className="input-pers" value={bf.url} onChange={(e) => setBf({ ...bf, url: e.target.value })} /></div>
              <div><button className="btn-primary-pers" onClick={() => void run(() => post(`${base}/brewfather`, {
                enabled: bf.on, unit: bf.unit, specific_gravity: bf.sg.trim() || '1',
                og: bf.og.trim() || null, batch_volume: bf.vol.trim() || null, url: bf.url.trim(),
              }), s.saved)}>{s.save}</button></div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
