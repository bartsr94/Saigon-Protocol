// Dev-only relationshipStore affinity cheat (DebugOverlay). ink can nudge
// affinity via `adjust_affinity` once content calls it, but there's no
// content doing that yet — this is the way to set/test a score directly,
// same "cheat tool ahead of real content" role DebugFlagsTool plays for
// case flags.

import { useState } from 'react'
import { useRelationshipStore } from '../../stores/relationshipStore'
import { NPCS, NPC_IDS } from '../../content/npcs'
import { CyberButton } from '../ui'

const INPUT_CLASS =
  'w-16 border border-white/20 bg-black/50 px-2 py-1 text-center font-body text-xs text-white outline-none focus:border-chrome-secondary'

const STEP_BUTTONS = [-5, -1, 1, 5]

export function DebugRelationshipTool() {
  const affinity = useRelationshipStore((s) => s.affinity)
  const adjustAffinity = useRelationshipStore((s) => s.adjustAffinity)
  const [customDelta, setCustomDelta] = useState<Record<string, string>>({})

  return (
    <div className="flex flex-col gap-1">
      <h3 className="font-display text-xs uppercase tracking-widest text-white/60">
        Affinity (-10 rival &mdash; +10 love interest)
      </h3>
      {NPC_IDS.map((id) => (
        <div key={id} className="flex items-center justify-between gap-3 border border-white/10 bg-white/5 px-3 py-2">
          <span className="font-body text-xs text-white/80">{NPCS[id].name}</span>
          <div className="flex items-center gap-2">
            <span className="w-8 text-center font-display text-sm text-chrome-secondary">{affinity[id]}</span>
            {STEP_BUTTONS.map((delta) => (
              <CyberButton key={delta} className="!px-2 !py-1 !text-xs" onClick={() => adjustAffinity(id, delta)}>
                {delta > 0 ? `+${delta}` : delta}
              </CyberButton>
            ))}
            <input
              value={customDelta[id] ?? ''}
              onChange={(e) => setCustomDelta((prev) => ({ ...prev, [id]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                const delta = Number(customDelta[id])
                if (!Number.isFinite(delta) || delta === 0) return
                adjustAffinity(id, delta)
                setCustomDelta((prev) => ({ ...prev, [id]: '' }))
              }}
              placeholder="±n"
              className={INPUT_CLASS}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
