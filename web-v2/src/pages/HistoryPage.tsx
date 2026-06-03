import { useEffect, useMemo, useState } from 'react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { api, Airlock, LogEntry, Range } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { useDemoMode, mockAirlock, mockHistory } from '../lib/demo'
import { useThemeColors } from '../lib/themeColors'

// ─────────────────────────────────────────────────────────────────────
// History page — fermentation charts for all airlocks with CSV export.
// ─────────────────────────────────────────────────────────────────────

export function HistoryPage() {
  const { t } = useI18n()
  const { demo } = useDemoMode()
  const [airlocks, setAirlocks] = useState<Airlock[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [range, setRange] = useState<Range>('7d')

  useEffect(() => {
    if (demo) { setAirlocks([mockAirlock()]); return }
    api.airlocks()
      .then((a) => { setAirlocks(a); setErr(null) })
      .catch((e) => setErr(String(e)))
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

  if (!airlocks) {
    return (
      <main className="container-pers py-10">
        <p className="text-center italic text-text-muted">{t('loading')}</p>
      </main>
    )
  }

  if (airlocks.length === 0) {
    return (
      <main className="container-pers py-10">
        <div className="card-pers mx-auto max-w-lg text-center">
          <p className="font-serif text-lg">{t('no_airlocks')}</p>
          <p className="mx-auto mt-2 max-w-prose text-sm italic text-text-muted">{t('no_airlocks_sub')}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container-pers pb-16">
      <section className="py-10 text-center">
        <Ornament label={t('history_title')} />
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          {t('history_title')}
        </h1>
        <p className="mt-2 text-sm italic text-text-muted">{t('history_subtitle')}</p>
      </section>

      {/* Global range picker */}
      <div className="mb-8 flex justify-center">
        <RangeSegment range={range} onChange={setRange} />
      </div>

      <div className="flex flex-col gap-6">
        {airlocks.map((airlock, i) => (
          <AirlockHistoryCard
            key={airlock.id}
            airlock={airlock}
            index={i}
            range={range}
            isDemoData={demo}
          />
        ))}
      </div>
    </main>
  )
}

// ─── AirlockHistoryCard ───────────────────────────────────────────────

function AirlockHistoryCard({
  airlock, index, range, isDemoData,
}: {
  airlock: Airlock
  index: number
  range: Range
  isDemoData: boolean
}) {
  const { t } = useI18n()
  const [history, setHistory] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    if (isDemoData) {
      setHistory(mockHistory(range))
      setLoading(false)
      return
    }
    api.airlockHistory(airlock.id, range)
      .then((h) => setHistory(h))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [airlock.id, range, isDemoData])

  const label = airlock.label || t('airlock_unnamed', { n: index + 1 })
  const csvUrl = `/api/airlocks/${airlock.id}/log/csv?range=${range}`

  return (
    <div className="card-pers">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold">{label}</h2>
          <p className="mt-0.5 font-mono text-[0.65rem] text-text-dim">
            {airlock.id.slice(0, 12)}…
          </p>
        </div>
        {!isDemoData && (
          <a
            href={csvUrl}
            download
            className="btn-pers flex items-center gap-1.5 text-xs"
          >
            ↓ {t('history_download_csv')}
          </a>
        )}
      </header>

      <div className="h-56">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm italic text-text-muted">
            {t('history_loading')}
          </div>
        ) : history.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm italic text-text-muted">
            {t('history_no_data')}
          </div>
        ) : (
          <HistoryChart history={history} />
        )}
      </div>
    </div>
  )
}

// ─── HistoryChart ─────────────────────────────────────────────────────

function HistoryChart({ history }: { history: LogEntry[] }) {
  const colors = useThemeColors()

  const data = useMemo(
    () =>
      history
        .map((e) => ({
          t: e.timestamp * 1000,
          bpm: e.bubbles_per_min ? Number(e.bubbles_per_min) : 0,
        }))
        .sort((a, b) => a.t - b.t),
    [history],
  )

  const yMax = useMemo(() => {
    const m = data.reduce((acc, p) => Math.max(acc, p.bpm), 0)
    return Math.max(m * 1.15, 2)
  }, [data])

  const span = data.length > 1 ? data[data.length - 1].t - data[0].t : 0

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
        <defs>
          <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.accent} stopOpacity={0.35} />
            <stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.border} strokeDasharray="2 4" vertical={false} opacity={0.5} />
        <XAxis
          dataKey="t"
          type="number"
          domain={['dataMin', 'dataMax']}
          scale="time"
          tickFormatter={(ts) => {
            const d = new Date(ts)
            return span < 36 * 3_600_000
              ? d.toLocaleString([], { hour: '2-digit', minute: '2-digit' })
              : d.toLocaleString([], { month: 'short', day: 'numeric' })
          }}
          stroke={colors.textMuted}
          tick={{ fontSize: 11, fontFamily: 'Fraunces, serif', fill: colors.textMuted }}
          tickLine={false}
          axisLine={false}
          minTickGap={40}
        />
        <YAxis
          domain={[0, yMax]}
          stroke={colors.textMuted}
          tick={{ fontSize: 11, fontFamily: 'Fraunces, serif', fill: colors.textMuted }}
          tickFormatter={(v: number) => (v >= 100 ? v.toFixed(0) : v.toFixed(1))}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: colors.bgElev,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            color: colors.text,
          }}
          labelStyle={{ color: colors.text, fontFamily: 'Fraunces, serif', fontWeight: 600 }}
          itemStyle={{ color: colors.text }}
          labelFormatter={(ts) =>
            new Date(Number(ts)).toLocaleString([], {
              month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })
          }
          formatter={(v: number) => [`${v.toFixed(1)} bpm`, '']}
        />
        <Area
          type="monotone"
          dataKey="bpm"
          stroke={colors.accent}
          strokeWidth={2}
          fill="url(#histGrad)"
          isAnimationActive={false}
          connectNulls
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────────

function RangeSegment({ range, onChange }: { range: Range; onChange: (r: Range) => void }) {
  const { t } = useI18n()
  const options: { value: Range; label: string }[] = [
    { value: '24h', label: t('range_1d') },
    { value: '3d',  label: t('range_3d') },
    { value: '7d',  label: t('range_7d') },
    { value: '30d', label: '30d' },
  ]
  return (
    <div className="inline-flex rounded-full border border-border p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-4 py-1.5 font-serif text-sm font-medium tracking-wide transition-all ${
            range === o.value ? 'bg-accent text-bg' : 'bg-transparent text-text-muted hover:text-text'
          }`}
        >
          {o.label}
        </button>
      ))}
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
