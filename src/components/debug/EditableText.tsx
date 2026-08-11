// In-game live editor for blurb/description/lockedReason strings
// (vite-plugins/debugTextEditPlugin.ts does the actual file write). Renders
// as plain text unless the dev-only text-edit toggle (App.tsx) is on, so
// call sites can wrap real content unconditionally without a runtime cost
// in production builds — the DEV check below strips this to a plain tag.
//
// `value` must be the exact current string from the content module: the
// server matches on `${field}: '${value}'` verbatim to find and replace the
// one place it lives in source, so a stale/derived value here would fail to
// match rather than silently editing the wrong text.

import { useState } from 'react'
import { useDebugTextEditStore } from '../../stores/debugTextEditStore'

type EditableFile = 'locations' | 'locationHubs' | 'districtStreets'
type EditableField = 'blurb' | 'description' | 'lockedReason'

interface EditableTextProps {
  value: string
  file: EditableFile
  field: EditableField
  className?: string
}

export function EditableText({ value, file, field, className }: EditableTextProps) {
  const enabled = useDebugTextEditStore((s) => s.enabled)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!import.meta.env.DEV || !enabled) {
    return <p className={className}>{value}</p>
  }

  if (!editing) {
    return (
      <p
        role="button"
        tabIndex={0}
        title="Click to edit (dev text editor)"
        onClick={() => {
          setDraft(value)
          setError('')
          setEditing(true)
        }}
        className={`${className ?? ''} cursor-text border border-dashed border-chrome-secondary/50 outline-none hover:border-chrome-secondary hover:bg-chrome-secondary/10`}
      >
        {value}
      </p>
    )
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/__debug/save-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file, field, oldValue: value, newValue: draft }),
      })
      const body: { error?: string } = await res.json()
      if (!res.ok) {
        setError(body.error ?? 'Save failed.')
        return
      }
      setEditing(false)
    } catch {
      setError('Save failed — is the dev server running?')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={className}>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        autoFocus
        className="w-full border border-chrome-secondary bg-black/70 p-2 font-body text-sm text-white outline-none"
      />
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || draft === value}
          className="border border-chrome-secondary px-2 py-1 font-display text-[10px] uppercase tracking-widest text-chrome-secondary hover:bg-chrome-secondary/15 disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="border border-white/20 px-2 py-1 font-display text-[10px] uppercase tracking-widest text-white/50 hover:text-white"
        >
          Cancel
        </button>
        {error && <span className="font-body text-xs text-red-400">{error}</span>}
      </div>
    </div>
  )
}
