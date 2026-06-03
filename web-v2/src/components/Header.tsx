import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
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
        <NavLink to="/" className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-deep text-lg shadow-glow">
            🍺
          </span>
          <div className="font-serif leading-tight">
            <div className="text-base">{t('brand_name')}</div>
            <div className="mt-0.5 text-[0.65rem] uppercase tracking-[0.18em] text-text-muted">
              {t('brand_sub')}{version && ` · v${version}`}
            </div>
          </div>
        </NavLink>

        {/* Nav */}
        <nav className="order-3 flex w-full flex-1 items-center gap-0 overflow-x-auto pb-1 md:order-none md:w-auto md:pb-0">
          <RouterNavLink to="/">{t('nav_tap_room')}</RouterNavLink>
          <RouterNavLink to="/airlocks">{t('nav_cellar')}</RouterNavLink>
          <RouterNavLink to="/kegs">{t('nav_kegs')}</RouterNavLink>
          <RouterNavLink to="/history">{t('nav_history')}</RouterNavLink>
          <RouterNavLink to="/settings">{t('nav_settings')}</RouterNavLink>
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2.5">
          <LangToggle lang={lang} onChange={setLang} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

function RouterNavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}  // only mark "/" active when exactly at root
      className={({ isActive }) =>
        `whitespace-nowrap border-b-2 px-3.5 py-2 font-serif text-sm font-medium transition-colors ${
          isActive
            ? 'border-accent text-accent'
            : 'border-transparent text-text-muted hover:text-text'
        }`
      }
    >
      {children}
    </NavLink>
  )
}
