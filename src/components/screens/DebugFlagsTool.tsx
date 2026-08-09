// Dev-only casefileStore flag toggler (DebugOverlay). Ink has no wiring yet
// to set flags itself, so this is the way to flip one for testing —
// e.g. checkpoint's `checkpoint-inner-wing-unlocked` locked-door flag
// (content/locationHubs.ts) — without waiting on a real unlock trigger to
// be authored.

import { useState } from 'react'
import { useCasefileStore } from '../../stores/casefileStore'
import { CyberButton } from '../ui'

const INPUT_CLASS =
  'flex-1 border border-white/20 bg-black/50 px-2 py-1 font-body text-xs text-white outline-none focus:border-chrome-secondary'

export function DebugFlagsTool() {
  const flags = useCasefileStore((s) => s.flags)
  const setFlag = useCasefileStore((s) => s.setFlag)
  const clearFlag = useCasefileStore((s) => s.clearFlag)
  const [flagInput, setFlagInput] = useState('')

  const sortedFlags = [...flags].sort()

  function handleSet() {
    const flag = flagInput.trim()
    if (!flag) return
    setFlag(flag)
    setFlagInput('')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          value={flagInput}
          onChange={(e) => setFlagInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSet()}
          placeholder="flag id, e.g. checkpoint-inner-wing-unlocked"
          className={INPUT_CLASS}
        />
        <CyberButton className="!px-3 !py-1.5 !text-xs" disabled={flagInput.trim().length === 0} onClick={handleSet}>
          Set
        </CyberButton>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-display text-xs uppercase tracking-widest text-white/60">Set flags ({sortedFlags.length})</h3>
        {sortedFlags.length === 0 && <p className="font-body text-sm text-white/35">None set.</p>}
        {sortedFlags.map((flag) => (
          <div key={flag} className="flex items-center justify-between gap-3 border border-white/10 bg-white/5 px-3 py-2">
            <span className="font-body text-xs text-white/80">{flag}</span>
            <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={() => clearFlag(flag)}>
              Clear
            </CyberButton>
          </div>
        ))}
      </div>
    </div>
  )
}
