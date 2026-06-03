import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useI18n, Lang, Key } from '../lib/i18n'
import { loadNotifSettings, saveNotifSettings, NotifSettings } from '../lib/notifications'

// ─────────────────────────────────────────────────────────────────────
// Settings page — language, display, notifications, Brewfather, about.
// ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { t } = useI18n()

  return (
    <main className="container-pers pb-16">
      <section className="py-10 text-center">
        <Ornament label={t('settings_title')} />
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          {t('settings_title')}
        </h1>
      </section>

      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <LanguageSection />
        <DisplaySection />
        <NotificationsSection />
        <BrewfatherSection />
        <AboutSection />
      </div>
    </main>
  )
}

// ─── Language ─────────────────────────────────────────────────────────

function LanguageSection() {
  const { t, lang, setLang } = useI18n()

  return (
    <Section title={t('settings_language')}>
      <div className="flex gap-4">
        <LangOption
          value="en"
          current={lang}
          label={t('settings_lang_en')}
          onSelect={setLang}
        />
        <LangOption
          value="da"
          current={lang}
          label={t('settings_lang_da')}
          onSelect={setLang}
        />
      </div>
    </Section>
  )
}

function LangOption({
  value, current, label, onSelect,
}: {
  value: Lang
  current: Lang
  label: string
  onSelect: (l: Lang) => void
}) {
  const active = value === current
  return (
    <button
      onClick={() => onSelect(value)}
      className={`flex items-center gap-2 rounded-xl border px-5 py-3 font-serif text-sm font-medium transition-colors ${
        active
          ? 'border-accent bg-accent/[0.10] text-accent'
          : 'border-border text-text-muted hover:border-border-s hover:text-text'
      }`}
    >
      <span className={`h-3 w-3 rounded-full border-2 ${active ? 'border-accent bg-accent' : 'border-text-muted'}`} />
      {label}
    </button>
  )
}

// ─── Display ──────────────────────────────────────────────────────────

function DisplaySection() {
  const { t } = useI18n()
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  useEffect(() => {
    api.config()
      .then((c) => { if (c.time_format) setTimeFormat(c.time_format) })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaveState('saving')
    try {
      await api.setTimeFormat(timeFormat)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('idle')
    }
  }

  return (
    <Section title={t('settings_display')}>
      <label className="mb-2 block text-sm font-medium text-text-muted">{t('settings_time_format')}</label>
      <div className="flex flex-col gap-2">
        <RadioRow
          checked={timeFormat === '12h'}
          onChange={() => setTimeFormat('12h')}
          label={t('settings_time_12h')}
        />
        <RadioRow
          checked={timeFormat === '24h'}
          onChange={() => setTimeFormat('24h')}
          label={t('settings_time_24h')}
        />
      </div>
      <SaveButton state={saveState} onSave={() => void handleSave()} t={t} />
    </Section>
  )
}

// ─── Notifications ────────────────────────────────────────────────────

function NotificationsSection() {
  const { t } = useI18n()
  const [s, setS] = useState<NotifSettings>(() => loadNotifSettings())
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  const handleSave = () => {
    setSaveState('saving')
    saveNotifSettings(s)
    setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 2000)
  }

  return (
    <Section title={t('notifications_title')} sub={t('settings_notifications_sub')}>
      {/* Push */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium">{t('push_label')}</div>
          <div className="mt-0.5 text-xs italic text-text-dim">{t('settings_ntfy_sub')}</div>
        </div>
        <Toggle checked={s.push_enabled} onChange={(v) => setS({ ...s, push_enabled: v })} />
      </div>
      {s.push_enabled && (
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-text-muted">{t('settings_ntfy_topic')}</label>
          <input
            type="text"
            value={s.ntfy_topic}
            onChange={(e) => setS({ ...s, ntfy_topic: e.target.value })}
            placeholder={t('settings_ntfy_placeholder')}
            className="input-pers"
          />
        </div>
      )}

      {/* Email */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium">{t('email_label')}</div>
          <div className="mt-0.5 text-xs italic text-text-dim">{t('settings_email_sub')}</div>
        </div>
        <Toggle checked={s.email_enabled} onChange={(v) => setS({ ...s, email_enabled: v })} />
      </div>
      {s.email_enabled && (
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-text-muted">{t('settings_email_addr')}</label>
          <input
            type="email"
            value={s.email}
            onChange={(e) => setS({ ...s, email: e.target.value })}
            placeholder={t('settings_email_placeholder')}
            className="input-pers"
          />
        </div>
      )}

      {/* Threshold */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-text-muted">
          {t('settings_threshold_bpm')}
        </label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={s.threshold_bpm}
          onChange={(e) => setS({ ...s, threshold_bpm: parseFloat(e.target.value) || 0 })}
          className="input-pers w-28"
        />
      </div>

      <SaveButton state={saveState} onSave={handleSave} t={t} />
    </Section>
  )
}

// ─── Brewfather ───────────────────────────────────────────────────────

function BrewfatherSection() {
  const { t } = useI18n()
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [userId, setUserId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  useEffect(() => {
    api.brewfatherStatus()
      .then((r) => setConfigured(r.configured))
      .catch(() => setConfigured(false))
  }, [])

  const handleSave = async () => {
    if (!userId || !apiKey) return
    setSaveState('saving')
    try {
      await api.setBrewfatherConfig(userId, apiKey)
      setConfigured(true)
      setUserId('')
      setApiKey('')
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2500)
    } catch {
      setSaveState('idle')
    }
  }

  return (
    <Section title={t('settings_brewfather')} sub={t('settings_brewfather_sub')}>
      {configured === true && saveState !== 'saved' && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/[0.08] px-3 py-1 text-xs font-medium text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          {t('settings_bf_configured')}
        </div>
      )}
      {saveState === 'saved' && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/[0.08] px-3 py-1 text-xs font-medium text-success">
          ✓ {t('settings_saved')}
        </div>
      )}
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{t('settings_bf_user_id')}</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder={configured ? '••••••••' : ''}
            className="input-pers"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">{t('settings_bf_api_key')}</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={configured ? '••••••••' : ''}
            className="input-pers"
          />
        </div>
        <button
          onClick={() => void handleSave()}
          disabled={!userId || !apiKey || saveState === 'saving'}
          className="btn-primary-pers disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saveState === 'saving' ? '…' : t('settings_bf_connect')}
        </button>
      </div>
    </Section>
  )
}

// ─── About ────────────────────────────────────────────────────────────

function AboutSection() {
  const { t } = useI18n()
  const [info, setInfo] = useState<{ version: string; status: string } | null>(null)

  useEffect(() => {
    api.alive()
      .then((d) => setInfo(d))
      .catch(() => setInfo({ version: '—', status: 'offline' }))
  }, [])

  const online = info?.status === 'ok'

  return (
    <Section title={t('settings_about')}>
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-text-muted">{t('settings_server_version')}</span>
          <span className="font-serif font-medium">{info ? `v${info.version}` : t('settings_server_unknown')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Server</span>
          <span className={`inline-flex items-center gap-1.5 font-medium ${online ? 'text-success' : 'text-warn'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-success' : 'bg-warn'}`} />
            {info
              ? online ? t('settings_server_online') : t('settings_server_offline')
              : t('settings_server_unknown')}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Open source</span>
          <a
            href="https://github.com/DarkJaeger/open-plaato-keg"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-accent hover:underline"
          >
            DarkJaeger/open-plaato-keg ↗
          </a>
        </div>
      </div>
    </Section>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────────

function Section({
  title, sub, children,
}: {
  title: string
  sub?: string
  children: React.ReactNode
}) {
  return (
    <div className="card-pers">
      <h2 className="font-serif text-lg font-semibold">{title}</h2>
      {sub && <p className="mb-4 mt-0.5 text-sm italic text-text-muted">{sub}</p>}
      <div className={sub ? '' : 'mt-4'}>{children}</div>
    </div>
  )
}

function RadioRow({
  checked, onChange, label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      onClick={onChange}
      className="flex items-center gap-3 py-1.5 text-left text-sm"
    >
      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${checked ? 'border-accent bg-accent/20' : 'border-text-muted'}`}>
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
      </span>
      <span>{label}</span>
    </button>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-border-s'}`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-text shadow transition-all ${checked ? 'left-[1.4rem] bg-bg' : 'left-1'}`}
      />
    </button>
  )
}

function SaveButton({
  state, onSave, t,
}: {
  state: 'idle' | 'saving' | 'saved'
  onSave: () => void
  t: (k: Key) => string
}) {
  return (
    <button
      onClick={onSave}
      disabled={state !== 'idle'}
      className="btn-primary-pers mt-4 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {state === 'saving'
        ? '…'
        : state === 'saved'
        ? `${t('settings_saved')} ✓`
        : t('settings_save')}
    </button>
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
