import type { Lang } from '../lib/i18n'

type Props = {
  lang: Lang
  onChange: (lang: Lang) => void
}

export function LangToggle({ lang, onChange }: Props) {
  return (
    <div className="inline-flex gap-1.5" role="group" aria-label="Language">
      {(['en', 'da'] as const).map((code) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          aria-pressed={lang === code}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full border font-serif text-xs font-semibold tracking-wider transition-colors ${
            lang === code
              ? 'border-accent bg-accent/[0.14] text-accent'
              : 'border-border bg-transparent text-text-muted hover:text-text'
          }`}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
