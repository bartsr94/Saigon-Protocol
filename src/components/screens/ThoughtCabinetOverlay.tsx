// Thought Cabinet overlay (Progression System plan). Mirrors CasesOverlay's
// tab structure: "Unlocked" (owned, not currently enabled — Enable button,
// disabled once THOUGHT_SLOT_CAPACITY is reached) and "Enabled" (currently
// active — Disable button, shows the perception-shift text plus any Insight
// bonus).

import { useMemo, useState, type ReactNode } from 'react'
import { INSIGHTS } from '../../content/insights'
import { THOUGHT_IDS, THOUGHT_SLOT_CAPACITY, THOUGHTS, type ThoughtId } from '../../content/thoughts'
import { useThoughtStore } from '../../stores/thoughtStore'
import { useUiStore } from '../../stores/uiStore'
import { CyberButton, Panel } from '../ui'

export function ThoughtCabinetOverlay() {
  const closeOverlay = useUiStore((s) => s.closeOverlay)
  const unlockedThoughtIds = useThoughtStore((s) => s.unlockedThoughtIds)
  const enabledThoughtIds = useThoughtStore((s) => s.enabledThoughtIds)
  const enableThought = useThoughtStore((s) => s.enableThought)
  const disableThought = useThoughtStore((s) => s.disableThought)
  const [tab, setTab] = useState<'unlocked' | 'enabled'>('unlocked')

  const availableIds = useMemo(
    () => THOUGHT_IDS.filter((id) => unlockedThoughtIds.has(id) && !enabledThoughtIds.has(id)),
    [unlockedThoughtIds, enabledThoughtIds],
  )
  const enabledIds = useMemo(() => THOUGHT_IDS.filter((id) => enabledThoughtIds.has(id)), [enabledThoughtIds])
  const atCapacity = enabledThoughtIds.size >= THOUGHT_SLOT_CAPACITY

  return (
    <Panel size="lg" className="flex w-full max-w-3xl flex-col gap-4 p-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <CyberButton className={tab === 'unlocked' ? '!border-chrome-secondary !text-white' : ''} onClick={() => setTab('unlocked')}>
            Unlocked
          </CyberButton>
          <CyberButton className={tab === 'enabled' ? '!border-chrome-secondary !text-white' : ''} onClick={() => setTab('enabled')}>
            Enabled ({enabledThoughtIds.size}/{THOUGHT_SLOT_CAPACITY})
          </CyberButton>
        </div>
        <CyberButton onClick={closeOverlay}>Close</CyberButton>
      </div>

      {tab === 'unlocked' ? (
        <div className="flex-1 space-y-3 overflow-y-auto">
          {availableIds.length === 0 && (
            <p className="font-body text-sm text-white/35">
              {unlockedThoughtIds.size === 0 ? 'No thoughts unlocked yet.' : 'All unlocked thoughts are currently enabled.'}
            </p>
          )}
          {availableIds.map((id) => (
            <ThoughtRow
              key={id}
              id={id}
              description={THOUGHTS[id].unlockedDescription}
              action={
                <CyberButton disabled={atCapacity} onClick={() => enableThought(id)}>
                  Enable
                </CyberButton>
              }
            />
          ))}
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto">
          {enabledIds.length === 0 && <p className="font-body text-sm text-white/35">No thoughts enabled.</p>}
          {enabledIds.map((id) => (
            <ThoughtRow
              key={id}
              id={id}
              description={THOUGHTS[id].enabledDescription}
              action={<CyberButton onClick={() => disableThought(id)}>Disable</CyberButton>}
            />
          ))}
        </div>
      )}
    </Panel>
  )
}

function ThoughtRow({ id, description, action }: { id: ThoughtId; description: string; action: ReactNode }) {
  const def = THOUGHTS[id]
  const bonuses = def.insightBonuses ?? []
  return (
    <div className="flex items-start justify-between gap-4 border-l-2 border-chrome-primary pl-3">
      <div>
        <h4 className="font-display text-sm font-bold uppercase tracking-wide text-chrome-primary">{def.name}</h4>
        <p className="mt-1 font-body text-sm text-white/70">{description}</p>
        {bonuses.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {bonuses.map((bonus) => (
              <span
                key={bonus.insightId}
                className="inline-block border px-1.5 py-0.5 font-display text-[0.65rem] uppercase tracking-widest"
                style={{ color: INSIGHTS[bonus.insightId].color, borderColor: INSIGHTS[bonus.insightId].color }}
              >
                {bonus.amount > 0 ? `+${bonus.amount}` : bonus.amount} {INSIGHTS[bonus.insightId].name}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  )
}
