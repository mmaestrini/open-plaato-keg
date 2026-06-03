import { useEffect, useState } from 'react'
import { api, Keg, Tap } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { useDemoMode, mockKeg } from '../lib/demo'

// ─────────────────────────────────────────────────────────────────────
// Tap Room — public-facing view of what's currently on tap.
//
// Merges /api/kegs (live hardware data) with /api/taps (beer metadata
// that Per configured manually). If a keg has a matching tap entry,
// the tap's beer name / brewery / style takes precedence over the keg's
// raw hardware fields. If there are no taps configured it falls back to
// showing the raw keg data with its my_label as the beer name.
// ─────────────────────────────────────────────────────────────────────

type TapDisplay = {
  keg: Keg
  tap: Tap | null
}

export function TapRoom() {
  const { t } = useI18n()
  const { demo } = useDemoMode()
  const [displays, setDisplays] = useState<TapDisplay[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (demo) {
      setDisplays([{ keg: mockKeg(), tap: null }])
      return
    }

    Promise.all([api.kegs(), api.taps()])
      .then(([kegs, taps]) => {
        const merged: TapDisplay[] = kegs.map((keg) => ({
          keg,
          tap: taps.find((t) => t.keg_id === keg.id) ?? null,
        }))
        setDisplays(merged)
        setErr(null)
      })
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

  if (!displays) {
    return (
      <main className="container-pers py-10">
        <p className="text-center italic text-text-muted">{t('loading')}</p>
      </main>
    )
  }

  if (displays.length === 0) {
    return (
      <main className="container-pers py-10">
        <div className="card-pers mx-auto max-w-lg text-center">
          <p className="font-serif text-lg">{t('taproom_no_kegs')}</p>
          <p className="mx-auto mt-2 max-w-prose text-sm italic text-text-muted">
            {t('taproom_no_kegs_sub')}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="container-pers pb-16">
      <section className="py-10 text-center">
        <Ornament label={t('taproom_on_tap')} />
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          {t('brand_name')}
        </h1>
        <p className="mt-2 text-sm italic text-text-muted">{t('brand_sub')}</p>
      </section>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {displays.map(({ keg, tap }) => (
          <KegTapCard key={keg.id} keg={keg} tap={tap} />
        ))}
      </div>
    </main>
  )
}

// ─── KegTapCard ───────────────────────────────────────────────────────

function KegTapCard({ keg, tap }: { keg: Keg; tap: Tap | null }) {
  const { t } = useI18n()

  const beerName  = tap?.name  || keg.my_label  || t('taproom_unnamed')
  const brewery   = tap?.brewery || ''
  const style     = tap?.style || keg.my_beer_style || ''
  const abv       = tap?.abv   || keg.my_abv     || ''
  const ibu       = tap?.ibu   || ''
  const tapColor  = tap?.color || '#d4924a'
  const isPouring = keg.is_pouring === '1'

  const pct = parseFloat(keg.percent_of_beer_left ?? '0')
  const amount = keg.amount_left
  const unit   = keg.beer_left_unit ?? 'L'
  const temp   = keg.keg_temperature

  return (
    <div className="card-pers relative overflow-hidden">
      {/* Accent glow strip at top using tap color */}
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${tapColor}88, ${tapColor})` }}
      />

      {/* Header */}
      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-semibold leading-tight">{beerName}</h2>
          {brewery && (
            <p className="mt-0.5 text-sm italic text-text-muted">{brewery}</p>
          )}
        </div>
        {isPouring && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-success/40 bg-success/[0.10] px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-widest text-success">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            {t('taproom_is_pouring')}
          </span>
        )}
      </div>

      {/* Fill bar */}
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs text-text-muted">
          <span className="font-serif font-medium">
            {isNaN(pct) ? '—' : t('taproom_pct_left', { pct: pct.toFixed(0) })}
          </span>
          {amount && (
            <span>{t('taproom_amount_left', { amount, unit })}</span>
          )}
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-bg">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(isNaN(pct) ? 0 : pct, 100)}%`,
              background: `linear-gradient(90deg, ${tapColor}88, ${tapColor})`,
            }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        {temp && (
          <Stat label={t('keg_temperature')} value={`${temp} °C`} />
        )}
        {abv && (
          <Stat label={t('taproom_abv')} value={`${abv}%`} />
        )}
        {ibu && (
          <Stat label={t('taproom_ibu')} value={ibu} />
        )}
        {style && (
          <Stat label={t('taproom_style')} value={style} />
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[0.65rem] font-medium uppercase tracking-widest text-text-muted">{label}</div>
      <div className="mt-0.5 font-serif text-base font-semibold">{value}</div>
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
