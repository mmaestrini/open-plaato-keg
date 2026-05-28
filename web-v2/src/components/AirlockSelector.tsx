import type { Airlock } from '../lib/api'
import { useI18n } from '../lib/i18n'

type Props = {
  airlocks: Airlock[]
  selectedId: string
  onChange: (id: string) => void
}

/**
 * Compact tab-style picker showing all airlocks. Each tab is the airlock's
 * label (or "Airlock N" fallback). Currently-selected one is highlighted.
 *
 * Hidden when there's only one airlock (no point picking).
 */
export function AirlockSelector({ airlocks, selectedId, onChange }: Props) {
  const { t } = useI18n()

  if (airlocks.length < 2) return null

  return (
    <div className="mx-auto mb-4 flex max-w-fit gap-1 rounded-full border border-border bg-bg-elev/40 p-1">
      {airlocks.map((a, i) => {
        const label =
          (a.label && a.label.trim()) ||
          t('airlock_unnamed', { n: i + 1 })
        const active = a.id === selectedId
        return (
          <button
            key={a.id}
            onClick={() => onChange(a.id)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 font-serif text-sm font-medium tracking-wide transition-colors ${
              active
                ? 'bg-accent text-bg'
                : 'text-text-muted hover:bg-bg-card-h hover:text-text'
            }`}
            title={a.id}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
