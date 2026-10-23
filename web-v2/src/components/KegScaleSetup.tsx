import { useEffect, useState } from 'react'
import { useI18n } from '../lib/i18n'
import type { Keg } from '../lib/api'

// Scale setup for one keg (port of legacy setup.html). Collapsible.

type WideKeg = Keg & {
  unit?: string; temperature_offset?: string; empty_keg_weight?: string
  max_keg_volume?: string; known_weight?: string; keg_mode_c02_beer?: string
  sensitivity?: string; my_display_mode?: string; my_co2_capacity?: string
  chip_temperature_string?: string; leak_detection?: string
}

const D = {
  en: {
    title: 'Scale setup', units: 'Units & mode', unitSystem: 'Unit system', metric: 'Metric', us: 'US',
    measure: 'Measure mode', weight: 'Weight', volume: 'Volume',
    sens: 'Sensitivity (experimental, higher = smaller pours)', sensNames: ['Very low', 'Low', 'Medium', 'High'],
    display: 'Dashboard display', bigWeight: 'Big weight', bigPercent: 'Big percent',
    calib: 'Calibration', tare: 'Tare', tareHelp: 'Zero the scale with an empty keg on it',
    setEmpty: 'Set empty', setEmptyHelp: 'Store the current weight as empty keg reference',
    resetPour: 'Reset last pour', resetPourHelp: 'Clear a spurious last pour reading',
    emptyW: 'Empty keg weight', knownW: 'Calibrate with known weight', calibrate: 'Calibrate',
    tempOff: 'Temperature offset', maxVol: 'Max keg volume', set: 'Set',
    mode: 'Keg mode (experimental)', beer: 'Beer', co2: 'CO₂', co2Cap: 'CO₂ cylinder capacity',
    status: 'Status', fw: 'Firmware', wifi: 'WiFi signal', chipT: 'Chip temperature', leak: 'Leak',
    leakYes: 'Leak detected', leakNo: 'No leak',
    ota: 'Manual firmware update (OTA)', otaWarn: 'Own risk: wrong firmware can permanently brick the scale.',
    otaBtn: 'Update firmware', otaNone: 'No firmware files found', otaConfirm: 'Start firmware update using {f}?',
    otaSent: 'OTA command sent. The device may reboot.',
    danger: 'Remove scale', dangerHelp: 'Removes the saved record (auth token and local settings). The scale can reconnect later.',
    del: 'Forget scale', delConfirm: 'Forget this saved scale and all its local settings?\n\n{id}',
    ok: 'Done', enter: 'Enter a value', err: 'Error',
  },
  da: {
    title: 'Vægopsætning', units: 'Enheder & visning', unitSystem: 'Enhedssystem', metric: 'Metrisk', us: 'US',
    measure: 'Målemetode', weight: 'Vægt', volume: 'Volumen',
    sens: 'Følsomhed (eksperimentel, højere = mindre hæld)', sensNames: ['Meget lav', 'Lav', 'Medium', 'Høj'],
    display: 'Dashboard-visning', bigWeight: 'Stor vægt', bigPercent: 'Stor procent',
    calib: 'Kalibrering', tare: 'Tarer', tareHelp: 'Nulstil vægten med tom fustage på',
    setEmpty: 'Sæt tom', setEmptyHelp: 'Gem nuværende vægt som tom-reference',
    resetPour: 'Nulstil sidste hæld', resetPourHelp: 'Ryd en falsk sidste-hæld-måling',
    emptyW: 'Tom fustagevægt', knownW: 'Kalibrer med kendt vægt', calibrate: 'Kalibrer',
    tempOff: 'Temperaturkorrektion', maxVol: 'Maks fustagevolumen', set: 'Sæt',
    mode: 'Fustagetilstand (eksperimentel)', beer: 'Øl', co2: 'CO₂', co2Cap: 'CO₂-flaskens kapacitet',
    status: 'Status', fw: 'Firmware', wifi: 'WiFi-signal', chipT: 'Chip-temperatur', leak: 'Lækage',
    leakYes: 'Lækage registreret', leakNo: 'Ingen lækage',
    ota: 'Manuel firmwareopdatering (OTA)', otaWarn: 'På eget ansvar: forkert firmware kan ødelægge vægten permanent.',
    otaBtn: 'Opdater firmware', otaNone: 'Ingen firmwarefiler fundet', otaConfirm: 'Start firmwareopdatering med {f}?',
    otaSent: 'OTA-kommando sendt. Enheden kan genstarte.',
    danger: 'Fjern vægt', dangerHelp: 'Fjerner den gemte post (auth-token og lokale indstillinger). Vægten kan forbinde igen senere.',
    del: 'Glem vægt', delConfirm: 'Glem denne gemte vægt og alle lokale indstillinger?\n\n{id}',
    ok: 'Udført', enter: 'Indtast en værdi', err: 'Fejl',
  },
}

export function KegScaleSetup({ keg, disabled, onDeleted }: {
  keg: Keg; disabled: boolean; onDeleted: () => void
}) {
  const { lang } = useI18n()
  const s = D[lang === 'da' ? 'da' : 'en']
  const k = keg as WideKeg
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [vals, setVals] = useState({
    empty: k.empty_keg_weight ?? '', known: k.known_weight ?? '', temp: k.temperature_offset ?? '',
    max: k.max_keg_volume ?? '', co2: k.my_co2_capacity ?? '',
  })
  // Optimistic local copies of choice values (sensitivity is not echoed by the API).
  const [pick, setPick] = useState<Record<string, string>>({})
  const [fws, setFws] = useState<{ name: string; path: string; size: number }[] | null>(null)
  const [fw, setFw] = useState('')

  useEffect(() => {
    if (!open || fws || disabled) return
    fetch('/api/firmwares').then((r) => r.json())
      .then((d) => { const l = d.firmwares ?? []; setFws(l); setFw(l[0]?.path ?? '') })
      .catch(() => setFws([]))
  }, [open, fws, disabled])

  const isUS = (pick.unit ?? k.unit) === '2'
  const bu = k.beer_left_unit
  const cur = {
    unit: pick.unit ?? k.unit,
    measure: pick.measure ?? (bu === 'lbs' || bu === 'kg' ? '1' : bu === 'gal' || bu === 'litre' ? '2' : ''),
    mode: pick.mode ?? k.keg_mode_c02_beer,
    sens: pick.sens ?? k.sensitivity,
    display: pick.display ?? (k.my_display_mode === 'percent_primary' ? 'percent_primary' : 'weight_primary'),
  }

  const post = async (path: string, body: unknown = {}) => {
    const r = await fetch(`/api/kegs/${encodeURIComponent(keg.id)}/${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok || d.error) throw new Error(String(d.error ?? r.status))
    return d
  }
  const run = async (fn: () => Promise<unknown>, okText = s.ok) => {
    setBusy(true)
    try { await fn(); setMsg({ ok: true, text: okText }) }
    catch (e) { setMsg({ ok: false, text: `${s.err}: ${(e as Error).message}` }) }
    finally { setBusy(false) }
  }
  const choose = (field: string, path: string, value: string) =>
    run(async () => { await post(path, { value }); setPick((p) => ({ ...p, [field]: value })) })
  const withRelease = (cmd: string) =>
    run(async () => { await post(cmd); await new Promise((r) => setTimeout(r, 1000)); await post(`${cmd}-release`) })
  const numeric = (field: keyof typeof vals, path: string) =>
    vals[field].trim() === '' ? setMsg({ ok: false, text: s.enter }) : run(() => post(path, { value: vals[field].trim() }))

  const off = disabled || busy
  const Choice = ({ field, path, opts }: { field: string; path: string; opts: [string, string][] }) => (
    <div className="flex flex-wrap gap-2">
      {opts.map(([v, label]) => (
        <button key={v} disabled={off} onClick={() => void choose(field, path, v)}
          className={`${(cur as Record<string, string | undefined>)[field] === v ? 'btn-primary-pers' : 'btn-pers'} py-1.5 text-xs disabled:opacity-50`}>
          {label}
        </button>
      ))}
    </div>
  )
  // Choice buttons whose stored value is pin number ("1"/"2") map from the sent word.
  const Pin = ({ field, path, opts }: { field: 'unit' | 'measure' | 'mode'; path: string; opts: [string, string, string][] }) => (
    <div className="flex flex-wrap gap-2">
      {opts.map(([word, pin, label]) => (
        <button key={word} disabled={off}
          onClick={() => void run(async () => { await post(path, { value: word }); setPick((p) => ({ ...p, [field]: pin })) })}
          className={`${cur[field] === pin ? 'btn-primary-pers' : 'btn-pers'} py-1.5 text-xs disabled:opacity-50`}>
          {label}
        </button>
      ))}
    </div>
  )
  const Label = ({ children }: { children: string }) => (
    <div className="mb-1 text-xs font-medium text-text-muted">{children}</div>
  )
  const NumRow = ({ label, field, path, unit, btn }: { label: string; field: keyof typeof vals; path: string; unit: string; btn?: string }) => (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input type="number" step="0.01" value={vals[field]} disabled={off}
          onChange={(e) => setVals((v) => ({ ...v, [field]: e.target.value }))}
          className="input-pers flex-1 disabled:opacity-50" />
        <span className="text-xs text-text-muted">{unit}</span>
        <button disabled={off} onClick={() => void numeric(field, path)} className="btn-primary-pers py-1.5 text-xs disabled:opacity-50">
          {btn ?? s.set}
        </button>
      </div>
    </div>
  )

  return (
    <details className="mt-4 border-t border-border pt-4" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="cursor-pointer font-serif text-sm font-medium uppercase tracking-widest text-text-muted">{s.title}</summary>
      <div className="mt-4 space-y-5">
        {msg && (
          <p className={`rounded-lg border px-3 py-2 text-xs ${msg.ok ? 'border-success/40 text-success' : 'border-red-500/40 text-red-500'}`}>{msg.text}</p>
        )}

        <section className="space-y-3">
          <h4 className="font-serif text-base font-semibold">{s.units}</h4>
          <div><Label>{s.unitSystem}</Label>
            <Pin field="unit" path="unit" opts={[['metric', '1', s.metric], ['us', '2', s.us]]} /></div>
          <div><Label>{s.measure}</Label>
            <Pin field="measure" path="measure-unit" opts={[['weight', '1', s.weight], ['volume', '2', s.volume]]} /></div>
          <div><Label>{s.sens}</Label>
            <div className="flex flex-wrap gap-2">
              {s.sensNames.map((n, i) => (
                <button key={n} disabled={off}
                  onClick={() => void run(async () => { await post('sensitivity', { value: String(i + 1) }); setPick((p) => ({ ...p, sens: String(i + 1) })) })}
                  className={`${cur.sens === String(i + 1) ? 'btn-primary-pers' : 'btn-pers'} py-1.5 text-xs disabled:opacity-50`}>{n}</button>
              ))}
            </div></div>
          <div><Label>{s.display}</Label>
            <Choice field="display" path="display-mode" opts={[['weight_primary', s.bigWeight], ['percent_primary', s.bigPercent]]} /></div>
        </section>

        <section className="space-y-3">
          <h4 className="font-serif text-base font-semibold">{s.calib}</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div><button disabled={off} onClick={() => void withRelease('tare')} className="btn-pers w-full py-1.5 text-xs disabled:opacity-50">{s.tare}</button>
              <p className="mt-1 text-[0.65rem] text-text-dim">{s.tareHelp}</p></div>
            <div><button disabled={off} onClick={() => void withRelease('empty-keg')} className="btn-pers w-full py-1.5 text-xs disabled:opacity-50">{s.setEmpty}</button>
              <p className="mt-1 text-[0.65rem] text-text-dim">{s.setEmptyHelp}</p></div>
            <div><button disabled={off} onClick={() => void run(() => post('reset-last-pour'))} className="btn-pers w-full py-1.5 text-xs disabled:opacity-50">{s.resetPour}</button>
              <p className="mt-1 text-[0.65rem] text-text-dim">{s.resetPourHelp}</p></div>
          </div>
          {NumRow({ label: s.emptyW, field: "empty", path: "empty-keg-weight", unit: isUS ? 'lbs' : 'kg' })}
          {NumRow({ label: s.knownW, field: "known", path: "calibrate-known-weight", unit: isUS ? 'lbs' : 'kg', btn: s.calibrate })}
          {NumRow({ label: s.tempOff, field: "temp", path: "temperature-offset", unit: isUS ? '°F' : '°C' })}
          {NumRow({ label: s.maxVol, field: "max", path: "max-keg-volume", unit: isUS ? 'gal' : 'L' })}
        </section>

        <section className="space-y-3">
          <h4 className="font-serif text-base font-semibold">{s.mode}</h4>
          <Pin field="mode" path="keg-mode" opts={[['beer', '1', s.beer], ['co2', '2', s.co2]]} />
          {cur.mode === '2' && NumRow({ label: s.co2Cap, field: "co2", path: "co2-capacity", unit: isUS ? 'lbs' : 'kg' })}
        </section>

        <section className="space-y-1 text-xs text-text-muted">
          <h4 className="font-serif text-base font-semibold text-text">{s.status}</h4>
          <p>{s.fw}: {keg.firmware_version ?? '—'}</p>
          <p>{s.wifi}: {keg.wifi_signal_strength ?? '—'}</p>
          <p>{s.chipT}: {k.chip_temperature_string ?? '—'}</p>
          <p>{s.leak}: {k.leak_detection === '1' ? s.leakYes : k.leak_detection === '0' ? s.leakNo : '—'}</p>
        </section>

        <section className="space-y-2">
          <h4 className="font-serif text-base font-semibold">{s.ota}</h4>
          <p className="text-xs text-red-500">{s.otaWarn}</p>
          <select value={fw} onChange={(e) => setFw(e.target.value)} disabled={off || !fws?.length} className="input-pers">
            {fws?.length ? fws.map((f) => <option key={f.path} value={f.path}>{f.name} ({Math.round(f.size / 1024)} KB)</option>) : <option>{fws ? s.otaNone : '…'}</option>}
          </select>
          <button disabled={off || !fw}
            onClick={() => {
              const name = fws?.find((f) => f.path === fw)?.name ?? fw
              if (confirm(s.otaConfirm.replace('{f}', name))) void run(() => post('ota', { path: fw }), s.otaSent)
            }}
            className="btn-pers py-1.5 text-xs disabled:opacity-50">{s.otaBtn}</button>
        </section>

        <section className="space-y-2">
          <h4 className="font-serif text-base font-semibold">{s.danger}</h4>
          <p className="text-xs text-text-muted">{s.dangerHelp}</p>
          <button disabled={off}
            onClick={() => {
              if (confirm(s.delConfirm.replace('{id}', keg.id)))
                void run(async () => { await post('delete'); onDeleted() })
            }}
            className="btn-pers py-1.5 text-xs text-red-500 disabled:opacity-50">{s.del}</button>
        </section>
      </div>
    </details>
  )
}
