import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api, Airlock, LogEntry, Range, openWS } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { useDemoMode, mockHistory, mockAirlock } from '../lib/demo'
import { useThemeColors } from '../lib/themeColors'

type Props = {
  airlockId: string
}

export function AirlockDetail({ airlockId }: Props) {
  const { t, lang } = useI18n()
  const { demo, toggle: toggleDemo } = useDemoMode()
  const [airlock, setAirlock] = useState<Airlock | null>(null)
  const [range, setRange] = useState<Range>('3d')
  const [history, setHistory] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  // Initial load (real API, or synthetic when in demo mode)
  useEffect(() => {
    setLoading(true)
    if (demo) {
      setAirlock(mockAirlock(airlockId))
      setHistory(mockHistory(range))
      setErr(null)
      setLoading(false)
      return
    }
    Promise.all([api.airlock(airlockId), api.airlockHistory(airlockId, range)])
      .then(([a, h]) => {
        setAirlock(a)
        setHistory(h)
        setErr(null)
      })
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false))
  }, [airlockId, range, demo])

  // Live WebSocket updates (real mode only; demo data is static)
  useEffect(() => {
    if (demo) return
    const ws = openWS((msg) => {
      if (msg.type === 'airlock' && msg.data?.id === airlockId) {
        setAirlock((a) => ({ ...(a ?? { id: airlockId }), ...msg.data }))
      }
    })
    return () => ws.close()
  }, [airlockId, demo])

  const stats = useMemo(() => deriveStats(history), [history])

  if (loading && !airlock) return <Page>{t('loading')}</Page>
  if (err) return <Page>{t('error_loading')}</Page>
  if (!airlock) return <Page>{t('error_loading')}</Page>

  const label = airlock.label || airlockId.slice(0, 8) + '…'
  const status = inferStatus(airlock)

  return (
    <main className="container-pers pb-16">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="py-10 text-center">
        <Ornament label={t('page_breadcrumb_airlocks')} />
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          {label}
        </h1>
        <p className="mx-auto mt-2 max-w-prose text-sm italic text-text-muted">
          {airlock.id.slice(0, 8)}… · {history.length} readings in last {range}
        </p>
        <StatusPill kind={status} label={t(`page_status_${status}` as const)} />
        {demo && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-warn/40 bg-warn/[0.10] px-3 py-1 font-mono text-[0.65rem] uppercase tracking-widest text-warn">
            <span className="h-1.5 w-1.5 rounded-full bg-warn" />
            Demo mode — synthetic data
          </div>
        )}
      </section>

      {/* ── KPIs ─────────────────────────────────────────── */}
      <section className="mb-6 grid gap-5 md:grid-cols-3">
        <KpiCard
          label={t('kpi_total_bubbles')}
          unit={t('kpi_total_bubbles_sub')}
          value={airlock.total_bubble_count ?? '—'}
          delta={stats.last24h ? `↑ ${stats.last24h} ${lang === 'da' ? 'sidste 24 timer' : 'in last 24h'}` : undefined}
          deltaKind="up"
          extra={
            <button className="btn-pers mt-3 text-xs">
              {t('reset_counter')}
            </button>
          }
        />
        <KpiCard
          label={t('kpi_bpm')}
          unit={t('kpi_bpm_sub')}
          value={airlock.bubbles_per_min ?? '0.0'}
          delta={
            stats.bpmDelta != null
              ? `${stats.bpmDelta >= 0 ? '↑' : '↓'} ${Math.abs(stats.bpmDelta).toFixed(1)} ${
                  lang === 'da' ? 'fra 1t gennemsnit' : 'from 1h avg'
                }`
              : undefined
          }
          deltaKind={stats.bpmDelta != null && stats.bpmDelta >= 0 ? 'up' : 'down'}
        />
        <KpiCard
          label={t('kpi_temperature')}
          unit="°C"
          value={airlock.temperature ?? '—'}
          delta={lang === 'da' ? 'stabil' : 'stable'}
        />
      </section>

      {/* ── Main chart ───────────────────────────────────── */}
      <section className="card-pers mb-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg font-semibold">{t('chart_title')}</h2>
            <p className="mt-0.5 text-sm italic text-text-muted">{t('chart_subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDemo}
              className={`rounded-full border px-3 py-1.5 font-serif text-xs font-medium tracking-wide transition-colors ${
                demo
                  ? 'border-warn/50 bg-warn/[0.10] text-warn hover:bg-warn/[0.16]'
                  : 'border-border text-text-muted hover:text-text hover:bg-bg-card-h'
              }`}
            >
              {demo ? 'Showing demo · click for real' : 'Show example data'}
            </button>
            <RangeSegment range={range} onChange={setRange} t={t} />
          </div>
        </header>
        <div className="h-72">
          <ChartArea history={history} />
        </div>
      </section>

      {/* ── Two-col: alerts + activity ──────────────────── */}
      <section className="grid gap-5 md:grid-cols-[1fr_360px]">
        <NotificationsCard t={t} lang={lang} />
        <ActivityCard t={t} />
      </section>
    </main>
  )
}

// ──────────────────────────────────────────────────────────
// Subcomponents
// ──────────────────────────────────────────────────────────

function Page({ children }: { children: React.ReactNode }) {
  return (
    <main className="container-pers py-10">
      <div className="card-pers">{children}</div>
    </main>
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

function StatusPill({ kind, label }: { kind: 'fermenting' | 'idle' | 'done'; label: string }) {
  const color =
    kind === 'fermenting'
      ? 'border-accent text-accent bg-accent/[0.14]'
      : kind === 'done'
      ? 'border-success text-success bg-success/[0.14]'
      : 'border-text-muted text-text-muted bg-text-muted/[0.10]'
  return (
    <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-serif text-sm tracking-wide ${color}`}>
      <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-current" />
      {label}
    </div>
  )
}

function KpiCard({
  label,
  unit,
  value,
  delta,
  deltaKind,
  extra,
}: {
  label: string
  unit: string
  value: string
  delta?: string
  deltaKind?: 'up' | 'down'
  extra?: React.ReactNode
}) {
  return (
    <div className="card-pers relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(var(--accent)/0.14),transparent_50%)]" />
      <div className="relative">
        <div className="font-serif text-xs font-medium uppercase tracking-widest text-text-muted">
          {label}
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="font-serif text-4xl font-semibold leading-none">{value}</span>
          <span className="text-sm italic text-text-muted">{unit}</span>
        </div>
        {delta && (
          <div className={`mt-2.5 text-sm ${deltaKind === 'up' ? 'text-success' : deltaKind === 'down' ? 'text-warn' : 'text-text-muted'}`}>
            {delta}
          </div>
        )}
        {extra}
      </div>
    </div>
  )
}

function RangeSegment({ range, onChange, t }: { range: Range; onChange: (r: Range) => void; t: ReturnType<typeof useI18n>['t'] }) {
  const options: { value: Range; key: 'range_1d' | 'range_3d' | 'range_7d' }[] = [
    { value: '24h', key: 'range_1d' },
    { value: '3d', key: 'range_3d' },
    { value: '7d', key: 'range_7d' },
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
          {t(o.key)}
        </button>
      ))}
    </div>
  )
}

function ChartArea({ history }: { history: LogEntry[] }) {
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

  // Compute y-axis max so a flat-at-zero series still has visible space.
  const yMax = useMemo(() => {
    const m = data.reduce((acc, p) => Math.max(acc, p.bpm), 0)
    return Math.max(m * 1.15, 2)
  }, [data])

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-text-muted">
        <p className="italic">No data yet — waiting for first reading.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
        <defs>
          <linearGradient id="bpmGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.accent} stopOpacity={0.4} />
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
            // For ranges within ~36h, show hour. Else show day.
            const span = data[data.length - 1].t - data[0].t
            if (span < 36 * 3600 * 1000) {
              return d.toLocaleString([], { hour: '2-digit', minute: '2-digit' })
            }
            return d.toLocaleString([], { month: 'short', day: 'numeric' })
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
          tickLine={false}
          axisLine={false}
          width={36}
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
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          }
          formatter={(v: number) => [`${(typeof v === 'number' ? v.toFixed(1) : v)} bubbles/min`, '']}
        />
        <Area
          type="monotone"
          dataKey="bpm"
          stroke={colors.accent}
          strokeWidth={2.5}
          fill="url(#bpmGrad)"
          isAnimationActive={true}
          animationDuration={600}
          connectNulls
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function NotificationsCard({ t, lang }: { t: ReturnType<typeof useI18n>['t']; lang: string }) {
  const [push, setPush] = useState(true)
  const [email, setEmail] = useState(false)

  return (
    <div className="card-pers">
      <h3 className="font-serif text-lg font-semibold">{t('notifications_title')}</h3>
      <p className="mb-5 mt-0.5 text-sm italic text-text-muted">{t('notifications_sub')}</p>

      <label className="mb-4 block">
        <span className="mb-1.5 block font-serif text-sm font-medium tracking-wide text-text-muted">
          {t('threshold_label')}
        </span>
        <input type="number" defaultValue="2.0" step="0.1" className="input-pers" />
      </label>

      <SwitchRow checked={push} onChange={setPush} label={t('push_label')} sub={t('push_sub')} />
      <SwitchRow checked={email} onChange={setEmail} label={t('email_label')} sub={t('email_sub')} />

      <button className="btn-primary-pers mt-4 w-full">{t('save_notifications')}</button>

      {lang === 'da' && (
        <p className="mt-3 text-xs italic text-text-dim">
          Funktionen er endnu ikke aktiv — kommer i en kommende opdatering.
        </p>
      )}
    </div>
  )
}

function SwitchRow({
  checked,
  onChange,
  label,
  sub,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  sub: string
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 py-2.5 text-left"
    >
      <span
        className={`relative h-5 w-10 flex-shrink-0 rounded-full transition-colors ${
          checked ? 'bg-accent' : 'bg-border-s'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-text shadow transition-all ${
            checked ? 'left-[1.4rem] bg-bg' : 'left-0.5'
          }`}
        />
      </span>
      <span>
        <div className="text-sm font-medium">{label}</div>
        <div className="mt-0.5 text-xs italic text-text-dim">{sub}</div>
      </span>
    </button>
  )
}

function ActivityCard({ t }: { t: ReturnType<typeof useI18n>['t'] }) {
  // For v1, no real activity feed yet — show placeholder. Replace with
  // real backend "events" feed when implemented.
  return (
    <div className="card-pers">
      <h3 className="font-serif text-lg font-semibold">{t('activity_title')}</h3>
      <p className="mb-2 mt-0.5 text-sm italic text-text-muted">{t('activity_sub')}</p>
      <p className="py-6 text-center text-sm italic text-text-dim">{t('activity_no_events')}</p>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function deriveStats(history: LogEntry[]) {
  if (history.length === 0) return { bpmDelta: null, last24h: null }

  const now = Date.now() / 1000
  const oneHourAgo = now - 3600
  const oneDayAgo = now - 86400

  const lastHourBpm = history
    .filter((e) => e.timestamp >= oneHourAgo && e.bubbles_per_min)
    .map((e) => Number(e.bubbles_per_min))
  const lastHourAvg = lastHourBpm.length
    ? lastHourBpm.reduce((a, b) => a + b, 0) / lastHourBpm.length
    : null

  const latestBpm = Number(history[history.length - 1].bubbles_per_min ?? 0)
  const bpmDelta = lastHourAvg != null ? latestBpm - lastHourAvg : null

  // Total bubble delta in last 24h is hard to compute precisely from BPM-only
  // log entries — leave null and we'll surface it when backend exposes it.
  const last24h = history.filter((e) => e.timestamp >= oneDayAgo).length

  return { bpmDelta, last24h: last24h || null }
}

function inferStatus(a: Airlock): 'fermenting' | 'idle' | 'done' {
  const bpm = a.bubbles_per_min ? Number(a.bubbles_per_min) : 0
  if (bpm >= 1.0) return 'fermenting'
  if (bpm > 0) return 'idle'
  return 'idle'
}
