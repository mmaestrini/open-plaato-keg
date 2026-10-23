import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '../lib/i18n'

const D = {
  en: {
    title: 'Transfer scales', add: 'Add scale', id: 'Scale ID', label: 'Label (optional)', addBtn: 'Add',
    select: 'Select a scale…', status: 'Status', weight: 'Raw weight (kg)', fill: 'Fill', updated: 'Last update',
    never: 'no data yet', now: 'just now', label2: 'Label', save: 'Save', empty: 'Empty keg weight (kg)',
    tare: 'Tare (use current weight)', target: 'Target weight (kg)', del: 'Delete scale',
    confirmDel: (id: string) => `Delete scale "${id}"? This cannot be undone.`,
    confirmTare: (w: string) => `Set empty keg weight to ${w} kg?`,
    saved: 'Saved', added: 'Scale added', deleted: 'Scale deleted', idReq: 'Scale ID is required',
    badNum: 'Enter a valid number', noData: 'No weight data yet', none: 'No scales yet.', err: 'Error',
  },
  da: {
    title: 'Overførselsvægte', add: 'Tilføj vægt', id: 'Vægt-ID', label: 'Navn (valgfrit)', addBtn: 'Tilføj',
    select: 'Vælg en vægt…', status: 'Status', weight: 'Rå vægt (kg)', fill: 'Fyldning', updated: 'Sidst opdateret',
    never: 'ingen data endnu', now: 'lige nu', label2: 'Navn', save: 'Gem', empty: 'Tom fadvægt (kg)',
    tare: 'Tarér (brug aktuel vægt)', target: 'Målvægt (kg)', del: 'Slet vægt',
    confirmDel: (id: string) => `Slet vægt "${id}"? Det kan ikke fortrydes.`,
    confirmTare: (w: string) => `Sæt tom fadvægt til ${w} kg?`,
    saved: 'Gemt', added: 'Vægt tilføjet', deleted: 'Vægt slettet', idReq: 'Vægt-ID er påkrævet',
    badNum: 'Indtast et gyldigt tal', noData: 'Ingen vægtdata endnu', none: 'Ingen vægte endnu.', err: 'Fejl',
  },
}

type Scale = {
  id: string; label?: string; raw_weight?: number | null; fill_percent?: number | null
  last_updated?: number | null; empty_keg_weight?: number | null; target_weight?: number | null
}
type Msg = { ok: boolean; text: string } | null

async function post(path: string, body?: unknown) {
  const r = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const d = await r.json().catch(() => ({}))
  if (!r.ok || d.status !== 'ok') throw new Error(d.error || `HTTP ${r.status}`)
}

export function TransferScalesPage() {
  const { lang } = useI18n()
  const s = D[lang]
  const [scales, setScales] = useState<Scale[]>([])
  const [sel, setSel] = useState('')
  const [cur, setCur] = useState<Scale | null>(null)
  const [label, setLabel] = useState('')
  const [empty, setEmpty] = useState('')
  const [target, setTarget] = useState('')
  const [newId, setNewId] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [msg, setMsg] = useState<Msg>(null)

  const flash = (ok: boolean, text: string) => { setMsg({ ok, text }); setTimeout(() => setMsg(null), 3500) }
  const run = async (fn: () => Promise<void>, okText: string) => {
    try { await fn(); flash(true, okText) } catch (e) { flash(false, `${s.err}: ${(e as Error).message}`) }
  }

  const loadList = useCallback(() => {
    fetch('/api/transfer-scales').then((r) => r.json()).then(setScales).catch(() => {})
  }, [])

  // Load selected scale; only seed the form fields when the selection changes or `seed` is set.
  const loadOne = useCallback(async (id: string, seed: boolean) => {
    try {
      const d: Scale = await fetch(`/api/transfer-scales/${encodeURIComponent(id)}`).then((r) => r.json())
      setCur(d)
      if (seed) {
        setLabel(d.label || '')
        setEmpty(d.empty_keg_weight != null ? String(d.empty_keg_weight) : '')
        setTarget(d.target_weight != null ? String(d.target_weight) : '')
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadList() }, [loadList])
  useEffect(() => {
    if (!sel) { setCur(null); return }
    void loadOne(sel, true)
    const t = setInterval(() => void loadOne(sel, false), 5000)
    return () => clearInterval(t)
  }, [sel, loadOne])

  const cfg = (body: object) => post(`/api/transfer-scales/${encodeURIComponent(sel)}/config`, body)
  const num = (v: string) => { const n = parseFloat(v); if (isNaN(n)) throw new Error(s.badNum); return n }

  const ago = (ts?: number | null) => {
    if (!ts) return s.never
    const a = Math.floor(Date.now() / 1000) - ts
    return a < 5 ? s.now : a < 60 ? `${a}s` : a < 3600 ? `${Math.floor(a / 60)}m` : `${Math.floor(a / 3600)}h`
  }

  const tare = () => {
    const raw = cur?.raw_weight
    if (raw == null) return flash(false, s.noData)
    if (!confirm(s.confirmTare(Number(raw).toFixed(3)))) return
    void run(async () => { await cfg({ empty_keg_weight: raw }); await loadOne(sel, true) }, s.saved)
  }

  const del = () => {
    if (!confirm(s.confirmDel(sel))) return
    void run(async () => { await post(`/api/transfer-scales/${encodeURIComponent(sel)}/delete`); setSel(''); loadList() }, s.deleted)
  }

  const add = () => {
    const id = newId.trim()
    if (!id) return flash(false, s.idReq)
    void run(async () => {
      await post(`/api/transfer-scales/${encodeURIComponent(id)}/config`, { label: newLabel.trim() || null })
      setNewId(''); setNewLabel(''); loadList()
    }, s.added)
  }

  const lbl = 'mb-1 block text-xs font-medium text-text-muted'

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
          <h2 className="font-serif text-lg font-semibold">{s.add}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div><label className={lbl}>{s.id}</label>
              <input className="input-pers" value={newId} onChange={(e) => setNewId(e.target.value)} /></div>
            <div><label className={lbl}>{s.label}</label>
              <input className="input-pers" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} /></div>
          </div>
          <button onClick={add} className="btn-primary-pers mt-4">{s.addBtn}</button>
        </div>

        <div className="card-pers">
          <select className="input-pers" value={sel} onChange={(e) => setSel(e.target.value)}>
            <option value="">{s.select}</option>
            {scales.map((x) => (
              <option key={x.id} value={x.id}>{x.label?.trim() ? `${x.label.trim()} (${x.id})` : x.id}</option>
            ))}
          </select>
          {scales.length === 0 && <p className="mt-3 text-sm italic text-text-muted">{s.none}</p>}
        </div>

        {sel && cur && (
          <>
            <div className="card-pers">
              <h2 className="font-serif text-lg font-semibold">{s.status}</h2>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div><div className="text-xs text-text-muted">{s.weight}</div>
                  <div className="font-serif text-xl">{cur.raw_weight != null ? Number(cur.raw_weight).toFixed(3) : '—'}</div></div>
                <div><div className="text-xs text-text-muted">{s.fill}</div>
                  <div className="font-serif text-xl">{cur.fill_percent != null ? `${Number(cur.fill_percent).toFixed(1)}%` : '—'}</div></div>
                <div><div className="text-xs text-text-muted">{s.updated}</div>
                  <div className="font-serif text-xl">{ago(cur.last_updated)}</div></div>
              </div>
            </div>

            <div className="card-pers flex flex-col gap-4">
              <div>
                <label className={lbl}>{s.label2}</label>
                <div className="flex gap-2">
                  <input className="input-pers" value={label} onChange={(e) => setLabel(e.target.value)} />
                  <button className="btn-pers" onClick={() => void run(async () => { await cfg({ label: label.trim() }); loadList() }, s.saved)}>{s.save}</button>
                </div>
              </div>
              <div>
                <label className={lbl}>{s.empty}</label>
                <div className="flex gap-2">
                  <input className="input-pers" type="number" step="0.001" value={empty} onChange={(e) => setEmpty(e.target.value)} />
                  <button className="btn-pers" onClick={() => void run(async () => { await cfg({ empty_keg_weight: num(empty) }); await loadOne(sel, false) }, s.saved)}>{s.save}</button>
                  <button className="btn-pers whitespace-nowrap" onClick={tare}>{s.tare}</button>
                </div>
              </div>
              <div>
                <label className={lbl}>{s.target}</label>
                <div className="flex gap-2">
                  <input className="input-pers" type="number" step="0.001" value={target} onChange={(e) => setTarget(e.target.value)} />
                  <button className="btn-pers" onClick={() => void run(async () => { await cfg({ target_weight: num(target) }); await loadOne(sel, false) }, s.saved)}>{s.save}</button>
                </div>
              </div>
              <div><button className="btn-pers text-warn" onClick={del}>{s.del}</button></div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
