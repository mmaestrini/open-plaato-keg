import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../lib/i18n'
import { ColorField, Field, Ornament, getJson, handleUrl, postJson, useToast } from '../components/BeerFormBits'

type Tap = {
  id: string; tap_number?: number | null; name?: string; brewery?: string; style?: string; abv?: string; ibu?: string
  color?: string; description?: string; tasting_notes?: string; expiration_date?: string
  keg_id?: string | null; handle_image?: string | null; device_id?: string | null
}
type KegLite = { id: string; my_label?: string; beer_left_unit?: string; amount_left?: string }
type Handle = { filename: string }
type Bev = { id: string; name?: string; brewery?: string; style?: string; abv?: string; ibu?: string; color?: string; description?: string; tasting_notes?: string }

const D = {
  en: {
    title: 'Tap Setup', sub: 'Configure beer info and tasting notes for each tap.', taps: 'Taps', add: '+ Add Tap',
    none: 'No taps yet', pick: 'Select a tap to edit, or add a new one', newTap: 'New Tap', editing: 'Editing',
    del: 'Delete Tap', delConfirm: 'Delete this tap? This cannot be undone.', deleted: 'Tap deleted', saved: 'Tap saved',
    saveFail: 'Save failed', delFail: 'Delete failed', nameReq: 'Beer name is required', unnamed: 'Unnamed', tap: 'Tap',
    lib: 'Load from Beverage Library (optional)', selBev: '— select a beverage —', load: 'Load', loaded: 'Loaded from beverage library', selFirst: 'Select a beverage first',
    tapNo: 'Tap #', name: 'Beer name', brewery: 'Brewery', style: 'Style', abv: 'ABV %', ibu: 'IBU', color: 'Beer colour',
    desc: 'Description', notes: 'Tasting notes', keg: 'Linked keg sensor', noKeg: 'No sensor linked', kegHelp: 'The keg scale that provides live fill/temperature data for this tap',
    kegDate: 'Date kegged', kegDateHelp: 'Saved to the linked keg. Link a sensor to edit.', exp: 'Expiration date',
    handle: 'Tap handle image', noHandle: 'No image', device: 'open-tap device ID (max 6 chars)',
    deviceHelp: 'For an open-tap ESP32 display: the device calls GET /get_keg/{id} every 10 s.', deviceCallout: 'Enter {id} as the Keg ID in your open-tap WiFi setup screen.',
    save: 'Save Tap', cancel: 'Cancel', loading: 'Loading…', loadErr: 'Could not load data',
    tab_taps: 'Taps', tab_handles: 'Tap handles', scale: 'Scale',
    hUpload: 'Upload new handle', hPick: 'Click to select a JPG file, or drop it here', hRule: 'Must be exactly 200×200 px and .jpg',
    hUp: 'Upload', hUploaded: 'Uploaded', hNone: 'No tap handles uploaded yet', hDel: 'Delete', hDelConfirm: 'Delete "{f}"? Any taps using it will lose their image.',
    hNotJpg: 'File must be a .jpg image', hSize: 'Image must be exactly 200×200 px (got {w}×{h})', hUnreadable: 'Could not read image file', hExisting: 'Uploaded handles',
  },
  da: {
    title: 'Hanekonfiguration', sub: 'Indstil ølinfo og smagsnoter for hver hane.', taps: 'Haner', add: '+ Tilføj hane',
    none: 'Ingen haner endnu', pick: 'Vælg en hane for at redigere, eller tilføj en ny', newTap: 'Ny hane', editing: 'Redigerer',
    del: 'Slet hane', delConfirm: 'Slet denne hane? Det kan ikke fortrydes.', deleted: 'Hane slettet', saved: 'Hane gemt',
    saveFail: 'Kunne ikke gemme', delFail: 'Kunne ikke slette', nameReq: 'Ølnavn er påkrævet', unnamed: 'Unavngivet', tap: 'Hane',
    lib: 'Hent fra ølbibliotek (valgfrit)', selBev: '— vælg en øl —', load: 'Hent', loaded: 'Hentet fra ølbibliotek', selFirst: 'Vælg en øl først',
    tapNo: 'Hane #', name: 'Ølnavn', brewery: 'Bryggeri', style: 'Stil', abv: 'ABV %', ibu: 'IBU', color: 'Ølfarve',
    desc: 'Beskrivelse', notes: 'Smagsnoter', keg: 'Tilknyttet fadsensor', noKeg: 'Ingen sensor tilknyttet', kegHelp: 'Fadvægten der leverer live fyldning/temperatur til denne hane',
    kegDate: 'Fadningsdato', kegDateHelp: 'Gemmes på det tilknyttede fad. Tilknyt en sensor for at redigere.', exp: 'Udløbsdato',
    handle: 'Hanehåndtag-billede', noHandle: 'Intet billede', device: 'open-tap enheds-ID (maks. 6 tegn)',
    deviceHelp: 'Til en open-tap ESP32-skærm: enheden kalder GET /get_keg/{id} hvert 10. sekund.', deviceCallout: 'Indtast {id} som Keg ID i open-taps WiFi-opsætning.',
    save: 'Gem hane', cancel: 'Annuller', loading: 'Indlæser…', loadErr: 'Kunne ikke indlæse data',
    tab_taps: 'Haner', tab_handles: 'Hanehåndtag', scale: 'Vægt',
    hUpload: 'Upload nyt håndtag', hPick: 'Klik for at vælge en JPG-fil, eller slip den her', hRule: 'Skal være præcis 200×200 px og .jpg',
    hUp: 'Upload', hUploaded: 'Uploadet', hNone: 'Ingen hanehåndtag uploadet endnu', hDel: 'Slet', hDelConfirm: 'Slet "{f}"? Haner der bruger det mister deres billede.',
    hNotJpg: 'Filen skal være et .jpg-billede', hSize: 'Billedet skal være præcis 200×200 px (er {w}×{h})', hUnreadable: 'Kunne ikke læse billedfilen', hExisting: 'Uploadede håndtag',
  },
}

const blank = (n: number): Tap => ({
  id: 'tap_' + Date.now(), tap_number: n, name: '', brewery: '', style: '', abv: '', ibu: '', color: '#c9a849',
  description: '', tasting_notes: '', keg_id: '', handle_image: '', device_id: '', expiration_date: '',
})

export function TapSetupPage() {
  const { lang } = useI18n()
  const d = D[lang === 'da' ? 'da' : 'en']
  const [tab, setTab] = useState<'taps' | 'handles'>('taps')
  const [taps, setTaps] = useState<Tap[] | null>(null)
  const [kegs, setKegs] = useState<KegLite[]>([])
  const [handles, setHandles] = useState<Handle[]>([])
  const [bevs, setBevs] = useState<Bev[]>([])
  const [err, setErr] = useState('')
  const [cur, setCur] = useState<Tap | null>(null)
  const toast = useToast()

  const load = useCallback(async () => {
    try {
      const [t, k, h, b] = await Promise.all([
        getJson<Tap[]>('/api/taps'), getJson<KegLite[]>('/api/kegs'),
        getJson<Handle[]>('/api/tap-handles'), getJson<Bev[]>('/api/beverages'),
      ])
      setTaps(t); setKegs(k); setHandles(h); setBevs(b); setErr('')
    } catch (e) { setErr(String(e)) }
  }, [])
  useEffect(() => { void load() }, [load])

  if (err) return <main className="container-pers py-10"><div className="card-pers mx-auto max-w-lg text-center"><p className="font-serif text-lg">{d.loadErr}</p><p className="mt-2 text-xs text-text-muted">{err}</p></div></main>
  if (!taps) return <main className="container-pers py-10"><p className="text-center italic text-text-muted">{d.loading}</p></main>

  const tabBtn = (k: 'taps' | 'handles', label: string) => (
    <button onClick={() => setTab(k)} className={tab === k ? 'btn-primary-pers' : 'btn-pers'}>{label}</button>
  )

  return (
    <main className="container-pers pb-16">
      <section className="py-10 text-center">
        <Ornament label={d.title} />
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl">{d.title}</h1>
        <p className="mt-2 text-sm italic text-text-muted">{d.sub}</p>
        <div className="mt-5 flex justify-center gap-2">{tabBtn('taps', d.tab_taps)}{tabBtn('handles', d.tab_handles)}</div>
      </section>

      {tab === 'handles' ? (
        <HandlesSection d={d} handles={handles} reload={load} toast={toast.show} />
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          <div className="card-pers h-fit">
            <h2 className="mb-3 font-serif text-lg font-semibold">{d.taps}</h2>
            {taps.length === 0 && <p className="text-sm text-text-muted">{d.none}</p>}
            <div className="flex flex-col gap-2">
              {taps.map((t) => (
                <button key={t.id} onClick={() => setCur({ ...t })}
                  className={`flex items-center gap-3 rounded-lg border p-2 text-left ${cur?.id === t.id ? 'border-accent' : 'border-black/10'}`}>
                  <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: t.color || '#c9a849' }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{d.tap} {t.tap_number ?? '?'} — {t.name || d.unnamed}</span>
                    <span className="block truncate text-xs text-text-muted">{t.style}{t.abv ? ` · ${t.abv}%` : ''}</span>
                  </span>
                </button>
              ))}
            </div>
            <button className="btn-primary-pers mt-4 w-full"
              onClick={() => setCur(blank(taps.reduce((m, t) => Math.max(m, t.tap_number || 0), 0) + 1))}>{d.add}</button>
          </div>

          {cur ? (
            <TapEditor key={cur.id} d={d} tap={cur} isNew={!taps.some((t) => t.id === cur.id)} kegs={kegs} handles={handles} bevs={bevs}
              toast={toast.show}
              onSaved={async (t) => { await load(); setCur(t) }}
              onClose={() => setCur(null)}
              onDeleted={async () => { setCur(null); await load() }} />
          ) : (
            <div className="card-pers flex items-center justify-center py-16 text-center italic text-text-muted">{d.pick}</div>
          )}
        </div>
      )}
      {toast.node}
    </main>
  )
}

type DD = typeof D.en

function TapEditor({ d, tap, isNew, kegs, handles, bevs, toast, onSaved, onClose, onDeleted }: {
  d: DD; tap: Tap; isNew: boolean; kegs: KegLite[]; handles: Handle[]; bevs: Bev[]
  toast: (m: string, ok?: boolean) => void; onSaved: (t: Tap) => Promise<void>; onClose: () => void; onDeleted: () => Promise<void>
}) {
  const [f, setF] = useState<Tap>(tap)
  const [kegDate, setKegDate] = useState('')
  const [bevId, setBevId] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof Tap) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }))

  // keg date lives on the keg, not the tap (same as legacy page)
  useEffect(() => {
    setKegDate('')
    if (!f.keg_id) return
    getJson<{ my_keg_date?: string }>(`/api/kegs/${encodeURIComponent(f.keg_id)}`)
      .then((k) => setKegDate((k.my_keg_date || '').trim()))
      .catch((e) => toast(`${d.loadErr}: ${e.message}`, false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.keg_id])

  const loadBev = () => {
    const b = bevs.find((x) => x.id === bevId)
    if (!b) return toast(d.selFirst, false)
    setF((p) => ({
      ...p, name: b.name || p.name, brewery: b.brewery || p.brewery, style: b.style || p.style, abv: b.abv || p.abv,
      ibu: b.ibu || p.ibu, color: b.color || p.color, description: b.description || p.description, tasting_notes: b.tasting_notes || p.tasting_notes,
    }))
    toast(d.loaded)
  }

  const save = async () => {
    const name = (f.name ?? '').trim()
    if (!name) return toast(d.nameReq, false)
    setBusy(true)
    const body = {
      tap_number: Number(f.tap_number) || 1, name, brewery: (f.brewery ?? '').trim(), style: (f.style ?? '').trim(),
      abv: String(f.abv ?? '').trim(), ibu: String(f.ibu ?? '').trim(), color: (f.color ?? '').trim() || '#c9a849',
      description: (f.description ?? '').trim(), tasting_notes: (f.tasting_notes ?? '').trim(),
      expiration_date: (f.expiration_date ?? '').trim(), keg_id: f.keg_id || null, handle_image: f.handle_image || null,
      device_id: (f.device_id ?? '').trim().slice(0, 6) || null,
    }
    try {
      if (body.keg_id) await postJson(`/api/kegs/${encodeURIComponent(body.keg_id)}/date`, { value: kegDate.trim() })
      await postJson(`/api/taps/${encodeURIComponent(f.id)}`, body)
      toast(d.saved)
      await onSaved({ ...f, ...body })
    } catch (e) { toast(`${d.saveFail}: ${(e as Error).message}`, false) }
    finally { setBusy(false) }
  }

  const del = async () => {
    if (!window.confirm(d.delConfirm)) return
    try { await postJson(`/api/taps/${encodeURIComponent(f.id)}/delete`); toast(d.deleted); await onDeleted() }
    catch (e) { toast(`${d.delFail}: ${(e as Error).message}`, false) }
  }

  return (
    <div className="card-pers flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold">{isNew || !f.name ? d.newTap : `${d.editing}: ${f.name}`}</h2>
        {!isNew && <button onClick={() => void del()} className="btn-pers text-xs text-red-600">{d.del}</button>}
      </div>

      <Field label={d.lib}>
        <div className="flex gap-2">
          <select value={bevId} onChange={(e) => setBevId(e.target.value)} className="input-pers flex-1">
            <option value="">{d.selBev}</option>
            {bevs.map((b) => <option key={b.id} value={b.id}>{b.name}{b.style ? ` (${b.style})` : ''}{b.abv ? ` · ${b.abv}%` : ''}</option>)}
          </select>
          <button type="button" onClick={loadBev} className="btn-pers">{d.load}</button>
        </div>
      </Field>

      <div className="grid gap-3 md:grid-cols-[6rem_1fr]">
        <Field label={d.tapNo}><input type="number" min={1} max={99} value={f.tap_number ?? ''} onChange={set('tap_number')} className="input-pers" /></Field>
        <Field label={d.name}><input value={f.name ?? ''} onChange={set('name')} className="input-pers" /></Field>
      </div>
      <Field label={d.brewery}><input value={f.brewery ?? ''} onChange={set('brewery')} className="input-pers" /></Field>
      <div className="grid gap-3 md:grid-cols-[1fr_7rem_7rem]">
        <Field label={d.style}><input value={f.style ?? ''} onChange={set('style')} className="input-pers" /></Field>
        <Field label={d.abv}><input type="number" step="0.1" min={0} max={25} value={f.abv ?? ''} onChange={set('abv')} className="input-pers" /></Field>
        <Field label={d.ibu}><input type="number" step="1" min={0} max={300} value={f.ibu ?? ''} onChange={set('ibu')} className="input-pers" /></Field>
      </div>
      <ColorField label={d.color} value={f.color ?? ''} onChange={(v) => setF((p) => ({ ...p, color: v }))} />
      <Field label={d.desc}><textarea rows={2} value={f.description ?? ''} onChange={set('description')} className="input-pers" /></Field>
      <Field label={d.notes}><textarea rows={2} value={f.tasting_notes ?? ''} onChange={set('tasting_notes')} className="input-pers" /></Field>

      <Field label={d.keg}>
        <select value={f.keg_id ?? ''} onChange={set('keg_id')} className="input-pers">
          <option value="">{d.noKeg}</option>
          {kegs.map((k, i) => (
            <option key={k.id} value={k.id}>
              {(k.my_label || '').trim() || `${d.scale} ${i + 1}`} {k.beer_left_unit || ''} {k.amount_left ? `(${parseFloat(k.amount_left).toFixed(1)})` : ''}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-text-muted">{d.kegHelp}</p>
      </Field>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label={d.kegDate}>
          <input value={kegDate} disabled={!f.keg_id} onChange={(e) => setKegDate(e.target.value)} placeholder="25.03.2025" className="input-pers disabled:opacity-50" />
          <p className="mt-1 text-xs text-text-muted">{d.kegDateHelp}</p>
        </Field>
        <Field label={d.exp}><input value={f.expiration_date ?? ''} onChange={set('expiration_date')} placeholder="25.05.2025" className="input-pers" /></Field>
      </div>

      <Field label={d.handle}>
        <div className="flex items-center gap-3">
          <select value={f.handle_image ?? ''} onChange={set('handle_image')} className="input-pers flex-1">
            <option value="">{d.noHandle}</option>
            {handles.map((h) => <option key={h.filename} value={h.filename}>{h.filename}</option>)}
          </select>
          {f.handle_image && <img src={handleUrl(f.handle_image)} alt="" className="h-16 w-16 rounded-md bg-black/5 object-contain" />}
        </div>
      </Field>

      <Field label={d.device}>
        <input value={f.device_id ?? ''} maxLength={6} onChange={set('device_id')} placeholder="tap1" className="input-pers max-w-[160px] font-mono" />
        <p className="mt-1 text-xs text-text-muted">{d.deviceHelp}</p>
        {(f.device_id ?? '').trim() && (
          <p className="mt-2 rounded-md border border-accent/30 bg-accent/[0.08] p-2 text-xs">
            {d.deviceCallout.replace('{id}', (f.device_id ?? '').trim())}
          </p>
        )}
      </Field>

      <div className="flex gap-2">
        <button onClick={() => void save()} disabled={busy} className="btn-primary-pers disabled:opacity-50">{busy ? '…' : d.save}</button>
        <button onClick={onClose} className="btn-pers">{d.cancel}</button>
      </div>
    </div>
  )
}

function HandlesSection({ d, handles, reload, toast }: { d: DD; handles: Handle[]; reload: () => Promise<void>; toast: (m: string, ok?: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const clear = () => { setFile(null); setDims(null); if (preview) URL.revokeObjectURL(preview); setPreview(''); if (input.current) input.current.value = '' }

  const pick = (f?: File) => {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.jpg')) return toast(d.hNotJpg, false)
    const url = URL.createObjectURL(f)
    const img = new Image()
    img.onload = () => { setFile(f); setPreview(url); setDims({ w: img.naturalWidth, h: img.naturalHeight }) }
    img.onerror = () => { URL.revokeObjectURL(url); toast(d.hUnreadable, false) }
    img.src = url
  }
  const ok = dims?.w === 200 && dims?.h === 200

  const upload = async () => {
    if (!file || !ok) return
    setBusy(true)
    try {
      const form = new FormData(); form.append('image', file)
      const res = await fetch('/api/tap-handles/upload', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? res.statusText)
      toast(`${d.hUploaded}: ${data.filename}`); clear(); await reload()
    } catch (e) { toast((e as Error).message, false) }
    finally { setBusy(false) }
  }

  const del = async (fn: string) => {
    if (!window.confirm(d.hDelConfirm.replace('{f}', fn))) return
    try { await postJson(`/api/tap-handles/${encodeURIComponent(fn)}/delete`); toast(`${d.hDel}: ${fn}`); await reload() }
    catch (e) { toast((e as Error).message, false) }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="card-pers">
        <h2 className="mb-3 font-serif text-lg font-semibold">{d.hUpload}</h2>
        <div onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]) }}
          className="cursor-pointer rounded-xl border-2 border-dashed border-black/20 p-8 text-center">
          <p className="text-sm font-medium">{d.hPick}</p>
          <p className="mt-1 text-xs text-text-muted">{d.hRule}</p>
          <input ref={input} type="file" accept=".jpg,image/jpeg" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </div>
        {file && dims && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <img src={preview} alt="" className="h-24 w-24 rounded-md bg-black/5 object-contain" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-medium">{file.name}</p>
              <p className="text-xs text-text-muted">{dims.w} × {dims.h} px</p>
              {!ok && <p className="text-xs text-red-600">{d.hSize.replace('{w}', String(dims.w)).replace('{h}', String(dims.h))}</p>}
            </div>
            <button onClick={() => void upload()} disabled={!ok || busy} className="btn-primary-pers disabled:opacity-50">{busy ? '…' : d.hUp}</button>
            <button onClick={clear} className="btn-pers">{d.cancel}</button>
          </div>
        )}
      </div>

      <div className="card-pers">
        <h2 className="mb-3 font-serif text-lg font-semibold">{d.hExisting}</h2>
        {handles.length === 0 ? <p className="text-sm text-text-muted">{d.hNone}</p> : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {handles.map((h) => (
              <div key={h.filename} className="rounded-lg border border-black/10 p-2 text-center">
                <img src={handleUrl(h.filename)} alt={h.filename} className="mx-auto h-24 w-24 object-contain" />
                <div className="mt-2 flex items-center justify-between gap-1">
                  <span className="truncate text-xs" title={h.filename}>{h.filename}</span>
                  <button onClick={() => void del(h.filename)} className="btn-pers px-2 py-0.5 text-xs text-red-600" title={d.hDel}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
