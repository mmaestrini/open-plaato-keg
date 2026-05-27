import { useEffect, useState } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { LangToggle } from './LangToggle'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'

export function Header() {
  const { lang, setLang, t } = useI18n()
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    api.alive().then((d) => setVersion(d.version)).catch(() => {})
  }, [])

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg-elev/90 backdrop-blur">
      <div className="container-pers flex flex-wrap items-center justify-between gap-3 py-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-deep text-lg shadow-glow">
            🍺
          </span>
          <div className="font-serif leading-tight">
            <div className="text-base">{t('brand_name')}</div>
            <div className="mt-0.5 text-[0.65rem] uppercase tracking-[0.18em] text-text-muted">
              {t('brand_sub')}{version && ` · v${version}`}
            </div>
          </div>
        </div>

        {/* Nav (wraps on mobile to its own row, order:3) */}
        <nav className="order-3 flex w-full flex-1 items-center gap-0 overflow-x-auto pb-1 md:order-none md:w-auto md:pb-0">
          <NavLink href="/v2/">{t('nav_tap_room')}</NavLink>
          <NavLink href="/v2/airlocks" active>{t('nav_cellar')}</NavLink>
          <NavLink href="/v2/kegs">{t('nav_kegs')}</NavLink>
          <NavLink href="/v2/history">{t('nav_history')}</NavLink>
          <NavLink href="/v2/settings">{t('nav_settings')}</NavLink>
        </nav>

        {/* Right cluster: language + theme */}
        <div className="ml-auto flex items-center gap-2.5">
          <LangToggle lang={lang} onChange={setLang} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

function NavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={`whitespace-nowrap border-b-2 px-3.5 py-2 font-serif text-sm font-medium transition-colors ${
        active ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text'
      }`}
    >
      {children}
    </a>
  )
}
