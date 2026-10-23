import { useCallback, useRef, useState } from 'react'

export const SWATCHES = [
  '#f5e642', '#f5a623', '#e8721a', '#c0531a', '#8b3a0f', '#e8c96a', '#d4a843', '#b08a30', '#7a5c18', '#4a3010',
  '#6fb8d4', '#4a90d9', '#2d5fa3', '#1a3a6b', '#7bc47b', '#4a9e4a', '#2d6b2d', '#e87070', '#c0404a', '#8b1a24',
  '#3a2a1a', '#241810', '#0a0808', '#f0f0f0', '#c8c8d8',
]

export async function postJson(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let data: any = null
  try { data = JSON.parse(text) } catch { /* not json */ }
  if (!res.ok) throw new Error(data?.error ?? (text || res.statusText))
  return data
}

export async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const handleUrl = (f: string) => `/uploads/tap-handles/${encodeURIComponent(f)}`

export function useToast() {
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const timer = useRef<number>()
  const show = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), 4000)
  }, [])
  const node = toast && (
    <div
      role="status"
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border px-4 py-2 text-sm font-medium shadow-lg bg-surface ${
        toast.ok ? 'border-success/40 text-success' : 'border-red-500/50 text-red-600'
      }`}
    >
      {toast.msg}
    </div>
  )
  return { show, node }
}

export function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-text-muted">{label}</label>
      {children}
    </div>
  )
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="#f5a623" className="input-pers max-w-[180px]" />
        <span className="h-8 w-8 rounded-full border border-black/10" style={{ background: value }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SWATCHES.map((c) => (
          <button
            type="button"
            key={c}
            title={c}
            onClick={() => onChange(c)}
            className={`h-6 w-6 rounded-full border ${value === c ? 'ring-2 ring-accent ring-offset-1' : 'border-black/10'}`}
            style={{ background: c }}
          />
        ))}
      </div>
    </Field>
  )
}

export function Ornament({ label }: { label: string }) {
  return <div className="mb-2 text-xs uppercase tracking-[0.3em] text-text-muted">{label}</div>
}
