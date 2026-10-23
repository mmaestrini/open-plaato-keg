import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '../lib/i18n'
import { ColorField, Field, Ornament, getJson, postJson, useToast } from '../components/BeerFormBits'

type Bev = {
  id: string; name?: string; brewery?: string; style?: string; abv?: string; ibu?: string; color?: string
  description?: string; tasting_notes?: string; og?: string; fg?: string; source?: string
  brewfather_batch_id?: string; created_at?: string
}
type Batch = { id: string; name: string; style: string; abv: number | null; status: string }

const D = {
  en: {
    title: 'Beverage Library', sub: 'Store reusable beer recipes. Pick from the library when configuring a tap.', list: 'Beverages', search: 'Search…',
    none: 'No beverages yet', add: '+ New Beverage', pick: 'Select a beverage to edit, or add a new one', newBev: 'New Beverage', editing: 'Editing',
    del: 'Delete', delConfirm: 'Delete this beverage? This cannot be undone.', deleted: 'Deleted', saved: 'Saved', saveFail: 'Save failed', delFail: 'Delete failed',
    nameReq: 'Name is required', unnamed: 'Unnamed', name: 'Name', brewery: 'Brewery', style: 'Style', abv: 'ABV %', ibu: 'IBU', color: 'Beer colour',
    desc: 'Description', notes: 'Tasting notes', og: 'OG', fg: 'FG', save: 'Save', cancel: 'Cancel', loading: 'Loading…', loadErr: 'Could not load data',
    bf: 'Brewfather Import', bfHelp: 'Import batches from your Brewfather account. Credentials are stored locally and never shared.',
    bfUser: 'User ID', bfKey: 'API Key', bfSave: 'Save credentials', bfSaved: 'Credentials saved', bfConfigured: 'Credentials saved',
    bfBrowse: 'Browse batches', bfNoCreds: 'No credentials saved. Enter your Brewfather User ID and API Key above.', bfNone: 'No batches found.',
    bfImport: 'Import', bfImported: 'Imported', colStatus: 'Status',
  },
  da: {
    title: 'Ølbibliotek', sub: 'Gem genbrugelige ølopskrifter. Vælg fra biblioteket når du sætter en hane op.', list: 'Øl', search: 'Søg…',
    none: 'Ingen øl endnu', add: '+ Ny øl', pick: 'Vælg en øl for at redigere, eller tilføj en ny', newBev: 'Ny øl', editing: 'Redigerer',
    del: 'Slet', delConfirm: 'Slet denne øl? Det kan ikke fortrydes.', deleted: 'Slettet', saved: 'Gemt', saveFail: 'Kunne ikke gemme', delFail: 'Kunne ikke slette',
    nameReq: 'Navn er påkrævet', unnamed: 'Unavngivet', name: 'Navn', brewery: 'Bryggeri', style: 'Stil', abv: 'ABV %', ibu: 'IBU', color: 'Ølfarve',
    desc: 'Beskrivelse', notes: 'Smagsnoter', og: 'OG', fg: 'FG', save: 'Gem', cancel: 'Annuller', loading: 'Indlæser…', loadErr: 'Kunne ikke indlæse data',
    bf: 'Brewfather-import', bfHelp: 'Importér batches fra din Brewfather-konto. Loginoplysninger gemmes lokalt og deles aldrig.',
    bfUser: 'Bruger-ID', bfKey: 'API-nøgle', bfSave: 'Gem loginoplysninger', bfSaved: 'Loginoplysninger gemt', bfConfigured: 'Loginoplysninger gemt',
    bfBrowse: 'Vis batches', bfNoCreds: 'Ingen loginoplysninger gemt. Indtast Bruger-ID og API-nøgle ovenfor.', bfNone: 'Ingen batches fundet.',
    bfImport: 'Importér', bfImported: 'Importeret', colStatus: 'Status',
  },
}
type DD = typeof D.en

const blank = (): Bev => ({ id: 'bev_' + Date.now().toString(16), name: '', brewery: '', style: '', abv: '', ibu: '', color: '#c9a849', description: '', tasting_notes: '', og: '', fg: '', source: 'manual' })

// Same formula as the backend: (OG - FG) * 131.25
const calcAbv = (og?: string, fg?: string) => {
  const re = /^-?\d+(\.\d+)?$/
  if (!og || !fg || !re.test(og.trim()) || !re.test(fg.trim())) return ''
  return (Math.round((parseFloat(og) - parseFloat(fg)) * 131.25 * 100) / 100).toFixed(2).replace(/\.00$/, '')
}

export function BeveragesPage() {
  const { lang } = useI18n()
  const d = D[lang === 'da' ? 'da' : 'en']
  const [bevs, setBevs] = useState<Bev[] | null>(null)
  const [err, setErr] = useState('')
  const [cur, setCur] = useState<Bev | null>(null)
  const [q, setQ] = useState('')
  const toast = useToast()

  const load = useCallback(async () => {
    try { setBevs(await getJson<Bev[]>('/api/beverages')); setErr('') } catch (e) { setErr(String(e)) }
  }, [])
  useEffect(() => { void load() }, [load])

  if (err) return <main className="container-pers py-10"><div className="card-pers mx-auto max-w-lg text-center"><p className="font-serif text-lg">{d.loadErr}</p><p className="mt-2 text-xs text-text-muted">{err}</p></div></main>
  if (!bevs) return <main className="container-pers py-10"><p className="text-center italic text-text-muted">{d.loading}</p></main>

  const ql = q.toLowerCase()
  const shown = ql ? bevs.filter((b) => [b.name, b.style, b.brewery].some((s) => (s || '').toLowerCase().includes(ql))) : bevs

  return (
    <main className="container-pers pb-16">
      <section className="py-10 text-center">
        <Ornament label={d.title} />
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl">{d.title}</h1>
        <p className="mt-2 text-sm italic text-text-muted">{d.sub}</p>
      </section>

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <div className="card-pers h-fit">
          <h2 className="mb-3 font-serif text-lg font-semibold">{d.list}</h2>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.search} className="input-pers mb-3" />
          {shown.length === 0 && <p className="text-sm text-text-muted">{d.none}</p>}
          <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
            {shown.map((b) => (
              <button key={b.id} onClick={() => setCur({ ...b, abv: b.abv || calcAbv(b.og, b.fg) })}
                className={`flex items-center gap-3 rounded-lg border p-2 text-left ${cur?.id === b.id ? 'border-accent' : 'border-black/10'}`}>
                <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: b.color || '#c9a849' }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{b.name || d.unnamed}</span>
                  <span className="block truncate text-xs text-text-muted">{b.style}{b.abv ? ` · ${b.abv}%` : ''}{b.source === 'brewfather' ? ' · BF' : ''}</span>
                </span>
              </button>
            ))}
          </div>
          <button className="btn-primary-pers mt-4 w-full" onClick={() => setCur(blank())}>{d.add}</button>
        </div>

        {cur ? (
          <BevEditor key={cur.id} d={d} bev={cur} isNew={!bevs.some((b) => b.id === cur.id)} toast={toast.show}
            onSaved={async (b) => { await load(); setCur(b) }} onClose={() => setCur(null)}
            onDeleted={async () => { setCur(null); await load() }} />
        ) : (
          <div className="card-pers flex items-center justify-center py-16 text-center italic text-text-muted">{d.pick}</div>
        )}
      </div>

      <Brewfather d={d} toast={toast.show} onImported={load} />
      {toast.node}
    </main>
  )
}

function BevEditor({ d, bev, isNew, toast, onSaved, onClose, onDeleted }: {
  d: DD; bev: Bev; isNew: boolean; toast: (m: string, ok?: boolean) => void
  onSaved: (b: Bev) => Promise<void>; onClose: () => void; onDeleted: () => Promise<void>
}) {
  const [f, setF] = useState<Bev>(bev)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof Bev) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }))
  // OG/FG drive ABV live, like the legacy page (ABV stays editable)
  const setGravity = (k: 'og' | 'fg') => (e: { target: { value: string } }) =>
    setF((p) => { const n = { ...p, [k]: e.target.value }; return { ...n, abv: calcAbv(n.og, n.fg) } })

  const save = async () => {
    const name = (f.name ?? '').trim()
    if (!name) return toast(d.nameReq, false)
    setBusy(true)
    const body = {
      name, brewery: (f.brewery ?? '').trim(), style: (f.style ?? '').trim(), abv: String(f.abv ?? '').trim(), ibu: String(f.ibu ?? '').trim(),
      color: (f.color ?? '').trim() || '#c9a849', description: (f.description ?? '').trim(), tasting_notes: (f.tasting_notes ?? '').trim(),
      og: (f.og ?? '').trim(), fg: (f.fg ?? '').trim(), source: f.source || 'manual',
      brewfather_batch_id: f.brewfather_batch_id || '', created_at: f.created_at || undefined,
    }
    try { await postJson(`/api/beverages/${encodeURIComponent(f.id)}`, body); toast(d.saved); await onSaved({ ...f, ...body }) }
    catch (e) { toast(`${d.saveFail}: ${(e as Error).message}`, false) }
    finally { setBusy(false) }
  }

  const del = async () => {
    if (!window.confirm(d.delConfirm)) return
    try { await postJson(`/api/beverages/${encodeURIComponent(f.id)}/delete`); toast(d.deleted); await onDeleted() }
    catch (e) { toast(`${d.delFail}: ${(e as Error).message}`, false) }
  }

  return (
    <div className="card-pers flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold">{isNew || !f.name ? d.newBev : `${d.editing}: ${f.name}`}</h2>
        {!isNew && <button onClick={() => void del()} className="btn-pers text-xs text-red-600">{d.del}</button>}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label={d.name}><input value={f.name ?? ''} onChange={set('name')} className="input-pers" /></Field>
        <Field label={d.brewery}><input value={f.brewery ?? ''} onChange={set('brewery')} className="input-pers" /></Field>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_7rem_7rem]">
        <Field label={d.style}><input value={f.style ?? ''} onChange={set('style')} className="input-pers" /></Field>
        <Field label={d.abv}><input type="number" step="0.1" min={0} max={25} value={f.abv ?? ''} onChange={set('abv')} className="input-pers" /></Field>
        <Field label={d.ibu}><input type="number" step="1" min={0} max={300} value={f.ibu ?? ''} onChange={set('ibu')} className="input-pers" /></Field>
      </div>
      <ColorField label={d.color} value={f.color ?? ''} onChange={(v) => setF((p) => ({ ...p, color: v }))} />
      <Field label={d.desc}><textarea rows={2} value={f.description ?? ''} onChange={set('description')} className="input-pers" /></Field>
      <Field label={d.notes}><textarea rows={2} value={f.tasting_notes ?? ''} onChange={set('tasting_notes')} className="input-pers" /></Field>
      <div className="grid gap-3 md:grid-cols-4">
        <Field label={d.og}><input value={f.og ?? ''} onChange={setGravity('og')} placeholder="1.060" className="input-pers" /></Field>
        <Field label={d.fg}><input value={f.fg ?? ''} onChange={setGravity('fg')} placeholder="1.012" className="input-pers" /></Field>
      </div>
      <div className="flex gap-2">
        <button onClick={() => void save()} disabled={busy} className="btn-primary-pers disabled:opacity-50">{busy ? '…' : d.save}</button>
        <button onClick={onClose} className="btn-pers">{d.cancel}</button>
      </div>
    </div>
  )
}

function Brewfather({ d, toast, onImported }: { d: DD; toast: (m: string, ok?: boolean) => void; onImported: () => Promise<void> }) {
  const [open, setOpen] = useState(true)
  const [configured, setConfigured] = useState(false)
  const [userId, setUserId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [batches, setBatches] = useState<Batch[] | null>(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState('')

  useEffect(() => {
    getJson<{ configured: boolean }>('/api/config/brewfather').then((c) => setConfigured(c.configured)).catch(() => {})
  }, [])

  const saveCreds = async () => {
    try {
      await postJson('/api/config/brewfather', { user_id: userId.trim(), api_key: apiKey.trim() })
      setConfigured(userId.trim() !== ''); setUserId(''); setApiKey(''); toast(d.bfSaved)
    } catch (e) { toast(`${d.saveFail}: ${(e as Error).message}`, false) }
  }

  const browse = async () => {
    setBusy('browse'); setMsg(''); setBatches(null)
    try {
      const res = await fetch('/api/brewfather/batches')
      const data = await res.json()
      if (!res.ok) setMsg(data.error === 'no_credentials' ? d.bfNoCreds : `Error: ${data.error}`)
      else if (!data.length) setMsg(d.bfNone)
      else setBatches(data)
    } catch (e) { setMsg((e as Error).message) }
    finally { setBusy('') }
  }

  const imp = async (id: string) => {
    setBusy(id)
    try { await postJson(`/api/brewfather/import/${encodeURIComponent(id)}`); toast(d.bfImported); await onImported() }
    catch (e) { toast((e as Error).message, false) }
    finally { setBusy('') }
  }

  return (
    <div className="card-pers mt-6">
      <button className="flex w-full items-center justify-between" onClick={() => setOpen(!open)}>
        <h2 className="font-serif text-lg font-semibold">{d.bf}</h2><span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-xs text-text-muted">{d.bfHelp}</p>
          {configured && <div className="inline-flex w-fit items-center gap-2 rounded-full border border-success/40 bg-success/[0.08] px-3 py-1 text-xs font-medium text-success">✓ {d.bfConfigured}</div>}
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={d.bfUser}><input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder={configured ? '••••••••' : ''} className="input-pers" /></Field>
            <Field label={d.bfKey}><input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={configured ? '••••••••' : ''} className="input-pers" /></Field>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void saveCreds()} disabled={!userId || !apiKey} className="btn-pers disabled:opacity-50">{d.bfSave}</button>
            <button onClick={() => void browse()} disabled={busy === 'browse'} className="btn-primary-pers disabled:opacity-50">{busy === 'browse' ? '…' : d.bfBrowse}</button>
          </div>
          {msg && <p className="text-sm text-text-muted">{msg}</p>}
          {batches && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-text-muted"><tr><th className="py-1">{d.name}</th><th>{d.style}</th><th>ABV</th><th>{d.colStatus}</th><th /></tr></thead>
                <tbody>
                  {batches.map((b) => (
                    <tr key={b.id} className="border-t border-black/10">
                      <td className="py-2 pr-2">{b.name}</td><td className="pr-2">{b.style}</td>
                      <td className="pr-2">{b.abv != null ? `${b.abv}%` : ''}</td><td className="pr-2">{b.status}</td>
                      <td className="text-right"><button onClick={() => void imp(b.id)} disabled={busy === b.id} className="btn-pers px-2 py-1 text-xs disabled:opacity-50">{busy === b.id ? '…' : d.bfImport}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
