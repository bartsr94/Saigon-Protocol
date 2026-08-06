// Character Creation step 1: archetype select (UI_DESIGN §6.2 step 1).
// Selecting an archetype commits its baseline Insight spread to
// insightStore immediately — the free-point-spend step (next) operates on
// that real state, not a preview copy.

import { ARCHETYPE_IDS, ARCHETYPES, type ArchetypeId } from '../../content/archetypes'
import { INSIGHTS } from '../../content/insights'
import { useInsightStore } from '../../stores/insightStore'
import { Panel, PortraitFrame } from '../ui'

export interface ChargenArchetypeStepProps {
  onNext: () => void
}

function initials(name: string): string {
  return name.replace('The ', '').slice(0, 2).toUpperCase()
}

export function ChargenArchetypeStep({ onNext }: ChargenArchetypeStepProps) {
  const archetype = useInsightStore((s) => s.archetype)
  const selectArchetype = useInsightStore((s) => s.selectArchetype)

  function handleSelect(id: ArchetypeId) {
    selectArchetype(id)
    onNext()
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {ARCHETYPE_IDS.map((id) => {
        const def = ARCHETYPES[id]
        const selected = archetype === id
        return (
          <button key={id} type="button" onClick={() => handleSelect(id)} className="text-left">
            <Panel
              size="sm"
              accent={selected ? 'var(--color-chrome-secondary)' : 'var(--color-chrome-primary)'}
              className="flex h-full gap-4 p-5 transition-colors hover:!border-chrome-secondary"
            >
              <PortraitFrame src={def.portraitSrc} alt={def.name} fallbackText={initials(def.name)} size="md" />
              <div className="flex flex-col gap-2">
                <div className="font-display text-base font-bold uppercase tracking-wide text-white">{def.name}</div>
                <div className="font-body text-sm text-white/60">{def.backstory}</div>
                <div className="flex gap-3 font-display text-[0.65rem] font-bold uppercase tracking-widest">
                  {def.strength && <span style={{ color: INSIGHTS[def.strength].color }}>+ {INSIGHTS[def.strength].name}</span>}
                  {def.weakness && <span className="text-vitality">− {INSIGHTS[def.weakness].name}</span>}
                </div>
              </div>
            </Panel>
          </button>
        )
      })}
    </div>
  )
}
