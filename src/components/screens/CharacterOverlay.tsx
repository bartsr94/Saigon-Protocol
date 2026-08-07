// Character / Insights overlay (docs/GAME_GUIDE.md §2) — the closest thing to a
// character sheet: portrait, archetype + backstory, and all seven Insights
// with current level, color, and tagline.

import { ARCHETYPES } from '../../content/archetypes'
import { INSIGHT_IDS, INSIGHT_MAX, INSIGHTS } from '../../content/insights'
import { useInsightStore } from '../../stores/insightStore'
import { useUiStore } from '../../stores/uiStore'
import { CyberButton, Panel, PipTrack, PortraitFrame } from '../ui'

function initials(name: string): string {
  return name.replace('The ', '').slice(0, 2).toUpperCase()
}

export function CharacterOverlay() {
  const closeOverlay = useUiStore((s) => s.closeOverlay)
  const archetype = useInsightStore((s) => s.archetype)
  const playerName = useInsightStore((s) => s.playerName)
  const levels = useInsightStore((s) => s.levels)

  if (!archetype) return null
  const def = ARCHETYPES[archetype]

  return (
    <Panel size="lg" className="flex max-h-[85vh] w-full max-w-3xl flex-col gap-5 p-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold uppercase tracking-widest text-chrome-primary">Detective File</h1>
        <CyberButton onClick={closeOverlay}>Close</CyberButton>
      </div>

      <div className="flex gap-5">
        <PortraitFrame src={def.portraitSrc} alt={def.name} fallbackText={initials(def.name)} size="lg" />
        <div className="flex flex-col gap-1">
          <span className="font-display text-lg font-bold uppercase tracking-wide text-white">{playerName || 'Unnamed'}</span>
          <span className="font-display text-sm uppercase tracking-widest text-chrome-secondary">{def.name}</span>
          <p className="mt-2 font-body text-sm text-white/60">{def.backstory}</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto border-t border-white/10 pt-4">
        {INSIGHT_IDS.map((id) => {
          const insight = INSIGHTS[id]
          const isStrength = def.strength === id
          const isWeakness = def.weakness === id
          return (
            <div key={id} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <span
                  className="w-36 shrink-0 font-display text-sm font-bold uppercase tracking-widest"
                  style={{ color: insight.color, textShadow: `0 0 5px ${insight.color}` }}
                >
                  {insight.name}
                </span>
                <PipTrack current={levels[id]} max={INSIGHT_MAX} color={insight.color} />
                {isStrength && <span className="font-display text-[0.6rem] uppercase tracking-widest text-white/50">Strength</span>}
                {isWeakness && <span className="font-display text-[0.6rem] uppercase tracking-widest text-white/50">Weakness</span>}
              </div>
              <p className="pl-[9.75rem] font-body text-xs text-white/50">{insight.tagline}</p>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
