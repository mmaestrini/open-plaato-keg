import { useEffect, useState } from 'react'
import { api, fmt1, openWS, Keg, Tap } from '../lib/api'
import { useI18n, Key } from '../lib/i18n'
import { useDemoMode, mockKeg } from '../lib/demo'
import { KegScaleSetup } from '../components/KegScaleSetup'

// ─────────────────────────────────────────────────────────────────────
// Kegs page — live hardware data + editable batch details per keg.
// ─────────────────────────────────────────────────────────────────────

export function KegsPage() {
  const { t } = useI18n()
  const { demo } = useDemoMode()
  const [kegs, setKegs] = useState<Keg[] | null>(null)
  const [taps, setTaps] = useState<Tap[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (demo) { setKegs([mockKeg()]); return }
    api.taps().then(setTaps).catch(() => {})
    api.kegs()
      .then((k) => { setKegs(sortKegs(k)); setErr(null) })
      .catch((e) => setErr(String(e)))
  }, [demo])

  useEffect(() => {
    if (demo) return
    const ws = openWS((msg) => {
      if (msg.type !== undefined || typeof msg.id !== 'string') return
      const update = msg as unknown as Keg
      setKegs((prev) => prev && prev.map((k) => (k.id === update.id ? { ...k, ...update } : k)))
    })
    return () => ws.close()
  }, [demo])

  if (err) {
    return (
      <main className="container-pers py-10">
        <div className="card-pers mx-auto max-w-lg text-center">
          <p className="font-serif text-lg">{t('error_loading')}</p>
          <p className="mt-2 text-xs text-text-muted">{err}</p>
        </div>
      </main>
    )
  }

  if (!kegs) {
    return (
      <main className="container-pers py-10">
        <p className="text-center italic text-text-muted">{t('loading')}</p>
      </main>
    )
  }

  if (kegs.length === 0) {
    return (
      <main className="container-pers py-10">
        <div className="card-pers mx-auto max-w-lg text-center">
          <p className="font-serif text-lg">{t('no_kegs')}</p>
          <p className="mx-auto mt-2 max-w-prose text-sm italic text-text-muted">
            {t('no_kegs_sub')}
          </p>
        </div>
        <KegSetupGuide />
      </main>
    )
  }

  return (
    <main className="container-pers pb-16">
      <section className="py-10 text-center">
        <Ornament label={t('kegs_title')} />
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          {t('kegs_title')}
        </h1>
        <p className="mt-2 text-sm italic text-text-muted">{t('kegs_subtitle')}</p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {kegs.map((keg, i) => (
          <KegCard
            key={keg.id}
            keg={keg}
            tap={taps.find((t) => t.keg_id === keg.id) ?? null}
            index={i}
            isDemoData={demo}
            isFirst={i === 0}
            isLast={i === kegs.length - 1}
            onMove={(d) => {
              const next = [...kegs]
              ;[next[i], next[i + d]] = [next[i + d], next[i]]
              setKegs(next)
              if (!demo) void fetch('/api/kegs/order', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ordered_ids: next.map((k) => k.id) }),
              })
            }}
            onDeleted={() => setKegs((prev) => prev && prev.filter((k) => k.id !== keg.id))}
            onUpdate={(updated) =>
              setKegs((prev) => prev ? prev.map((k) => (k.id === updated.id ? updated : k)) : prev)
            }
          />
        ))}
      </div>
      <KegSetupGuide />
    </main>
  )
}

const sortKegs = (ks: Keg[]) => {
  const o = (k: Keg) => parseInt((k as Keg & { my_sort_order?: string }).my_sort_order ?? '', 10)
  return [...ks].sort((a, b) => {
    const x = o(a), y = o(b)
    if (isNaN(x) !== isNaN(y)) return isNaN(x) ? 1 : -1
    return x !== y && !isNaN(x) ? x - y : a.id.localeCompare(b.id)
  })
}

function KegSetupGuide() {
  const { t } = useI18n()
  const steps = [1, 2, 3, 4, 5, 6, 7].map((n) => `kegsetup_${n}` as Key)
  return (
    <details className="card-pers mx-auto mt-8 max-w-2xl">
      <summary className="cursor-pointer font-serif text-lg font-semibold">{t('kegsetup_title')}</summary>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-text-muted">
        {steps.map((k) => <li key={k}>{t(k)}</li>)}
      </ol>
    </details>
  )
}

// ─── KegCard ─────────────────────────────────────────────────────────

type KegCardProps = {
  keg: Keg
  tap: Tap | null
  index: number
  isDemoData: boolean
  isFirst: boolean
  isLast: boolean
  onMove: (delta: -1 | 1) => void
  onDeleted: () => void
  onUpdate: (keg: Keg) => void
}

function KegCard({ keg, tap, index, isDemoData, isFirst, isLast, onMove, onDeleted, onUpdate }: KegCardProps) {
  const { t } = useI18n()

  const pct = parseFloat(keg.percent_of_beer_left ?? '0')
  const isPouring = keg.is_pouring === '1'

  // ── Label rename ─────────────────────────────────────────────────
  const [editingLabel, setEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState('')
  const [savingLabel, setSavingLabel] = useState(false)

  const beginEditLabel = () => {
    if (isDemoData) return
    setLabelDraft(keg.my_label || tap?.name || '')
    setEditingLabel(true)
  }
  const cancelEditLabel = () => { setEditingLabel(false); setLabelDraft('') }
  const handleSaveLabel = async () => {
    if (isDemoData) return
    setSavingLabel(true)
    try {
      await api.renameBeer(keg.id, tap, labelDraft.trim())
      onUpdate({ ...keg, my_label: labelDraft.trim() })
      setEditingLabel(false)
    } catch (e) { alert('Rename failed: ' + String(e)) }
    finally { setSavingLabel(false) }
  }

  // ── Batch details (OG/FG/ABV/style/date) ─────────────────────────
  const [style, setStyle] = useState(keg.my_beer_style ?? '')
  const [og, setOg] = useState(keg.my_og ?? '')
  const [fg, setFg] = useState(keg.my_fg ?? '')
  const [abv, setAbv] = useState(keg.my_abv ?? '')
  const [date, setDate] = useState(keg.my_keg_date ?? '')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  const handleSaveDetails = async () => {
    if (isDemoData) return
    setSaveState('saving')
    try {
      const calls: Promise<unknown>[] = []
      if (style  !== (keg.my_beer_style ?? '')) calls.push(api.setKegBeerStyle(keg.id, style))
      if (og     !== (keg.my_og ?? ''))         calls.push(api.setKegOG(keg.id, og))
      if (fg     !== (keg.my_fg ?? ''))         calls.push(api.setKegFG(keg.id, fg))
      if (date   !== (keg.my_keg_date ?? ''))   calls.push(api.setKegDate(keg.id, date))
      await Promise.all(calls)
      onUpdate({ ...keg, my_beer_style: style, my_og: og, my_fg: fg, my_abv: abv, my_keg_date: date })
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch (e) {
      alert('Save failed: ' + String(e))
      setSaveState('idle')
    }
  }

  const displayName = keg.my_label || tap?.name || t('keg_unnamed', { n: index + 1 })

  return (
    <div className="card-pers relative overflow-hidden">
      {/* Accent strip */}
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-accent/50 to-accent" />

      {/* Title */}
      <div className="mt-2 flex items-start justify-between gap-3">
        {editingLabel ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              autoFocus
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSaveLabel(); else if (e.key === 'Escape') cancelEditLabel() }}
              maxLength={40}
              disabled={savingLabel}
              className="input-pers flex-1 font-serif text-lg"
            />
            <button onClick={() => void handleSaveLabel()} disabled={savingLabel} className="btn-primary-pers py-1.5 text-xs disabled:opacity-50">
              {savingLabel ? '…' : t('save')}
            </button>
            <button onClick={cancelEditLabel} disabled={savingLabel} className="btn-pers py-1.5 text-xs">
              {t('cancel')}
            </button>
          </div>
        ) : (
          <button
            onClick={beginEditLabel}
            disabled={isDemoData}
            title={isDemoData ? undefined : t('keg_rename')}
            className="group inline-flex items-center gap-2 disabled:cursor-default"
          >
            <h2 className="font-serif text-2xl font-semibold">{displayName}</h2>
            {!isDemoData && (
              <span aria-hidden className="text-base text-text-muted opacity-60 transition-colors group-hover:text-accent group-hover:opacity-100">
                ✎
              </span>
            )}
          </button>
        )}

        {isPouring && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-success/40 bg-success/[0.10] px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-widest text-success">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            {t('keg_is_pouring')}
          </span>
        )}
      </div>

      {/* ID + reorder */}
      <div className="mt-0.5 flex items-center justify-between">
        <p className="font-mono text-[0.65rem] text-text-dim">{keg.id.slice(0, 12)}…</p>
        {!isDemoData && (
          <span className="flex gap-1">
            <button onClick={() => onMove(-1)} disabled={isFirst} aria-label="Move up" className="btn-pers px-2 py-0.5 text-xs disabled:opacity-30">↑</button>
            <button onClick={() => onMove(1)} disabled={isLast} aria-label="Move down" className="btn-pers px-2 py-0.5 text-xs disabled:opacity-30">↓</button>
          </span>
        )}
      </div>

      {/* Fill bar */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-text-muted">
          <span className="font-serif font-medium">
            {isNaN(pct) ? '—' : t('keg_pct_left', { pct: pct.toFixed(0) })}
          </span>
          {keg.amount_left && (
            <span>{t('keg_amount_left', { amount: keg.amount_left, unit: keg.beer_left_unit ?? 'L' })}</span>
          )}
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-bg">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent/60 to-accent transition-all duration-700"
            style={{ width: `${Math.min(isNaN(pct) ? 0 : pct, 100)}%` }}
          />
        </div>
      </div>

      {/* Live stats */}
      <div className="mt-4 flex flex-wrap gap-4 border-b border-border pb-4">
        {keg.keg_temperature && (
          <LiveStat label={t('keg_temperature')} value={`${fmt1(keg.keg_temperature)} °C`} />
        )}
        {keg.last_pour && keg.last_pour !== '0' && (
          <LiveStat label={t('keg_last_pour')} value={`${keg.last_pour} ${keg.beer_left_unit ?? 'L'}`} />
        )}
      </div>

      {/* Batch details — editable */}
      <div className="mt-4">
        <h3 className="mb-3 font-serif text-sm font-medium uppercase tracking-widest text-text-muted">
          {t('keg_details')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <DetailField
            label={t('keg_beer_style')}
            value={style}
            onChange={setStyle}
            disabled={isDemoData}
            placeholder="IPA, Stout…"
            colSpan
          />
          <DetailField
            label={t('keg_og')}
            value={og}
            onChange={setOg}
            disabled={isDemoData}
            placeholder="1.065"
          />
          <DetailField
            label={t('keg_fg')}
            value={fg}
            onChange={setFg}
            disabled={isDemoData}
            placeholder="1.012"
          />
          <DetailField
            label={t('keg_abv')}
            value={abv}
            onChange={setAbv}
            disabled={isDemoData}
            placeholder="6.5%"
          />
          <DetailField
            label={t('keg_date_started')}
            value={date}
            onChange={setDate}
            disabled={isDemoData}
            placeholder="DD.MM.YYYY"
          />
        </div>
        {!isDemoData && (
          <button
            onClick={() => void handleSaveDetails()}
            disabled={saveState === 'saving'}
            className="btn-primary-pers mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveState === 'saving'
              ? t('keg_saving')
              : saveState === 'saved'
              ? t('keg_saved')
              : t('keg_save_details')}
          </button>
        )}
      </div>

      <KegScaleSetup keg={keg} disabled={isDemoData} onDeleted={onDeleted} />
    </div>
  )
}

function LiveStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[0.65rem] font-medium uppercase tracking-widest text-text-muted">{label}</div>
      <div className="mt-0.5 font-serif text-base font-semibold">{value}</div>
    </div>
  )
}

function DetailField({
  label, value, onChange, disabled, placeholder, colSpan,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled: boolean
  placeholder?: string
  colSpan?: boolean
}) {
  return (
    <div className={colSpan ? 'col-span-2' : ''}>
      <label className="mb-1 block text-xs font-medium text-text-muted">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="input-pers disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  )
}

function Ornament({ label }: { label: string }) {
  return (
    <div className="mb-3 flex items-center justify-center gap-3 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-accent">
      <span className="h-px w-12 bg-gradient-to-r from-transparent via-accent to-transparent" />
      <span>{label}</span>
      <span className="h-px w-12 bg-gradient-to-r from-transparent via-accent to-transparent" />
    </div>
  )
}
