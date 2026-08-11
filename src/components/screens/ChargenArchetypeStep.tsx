// Character Creation step 1: archetype + portrait select (docs/GAME_GUIDE.md
// §2.2 step 1). Split view — archetype commits its baseline Insight spread
// to insightStore immediately, same as before; portrait is a fully
// independent choice from a flat gallery, and neither selection clears the
// other. Continue is gated on both being made.

import { ARCHETYPE_IDS, ARCHETYPES, type ArchetypeId } from '../../content/archetypes'
import { INSIGHTS } from '../../content/insights'
import { PORTRAIT_IDS, PORTRAITS, type PortraitId } from '../../content/portraits'
import { useInsightStore } from '../../stores/insightStore'
import { CyberButton, Panel, PortraitFrame } from '../ui'

export interface ChargenArchetypeStepProps {
  onNext: () => void
}

function initials(name: string): string {
  return name.replace('The ', '').slice(0, 2).toUpperCase()
}

export function ChargenArchetypeStep({ onNext }: ChargenArchetypeStepProps) {
  const archetype = useInsightStore((s) => s.archetype)
  const portraitId = useInsightStore((s) => s.portraitId)
  const selectArchetype = useInsightStore((s) => s.selectArchetype)
  const selectPortrait = useInsightStore((s) => s.selectPortrait)

  function handleSelectArchetype(id: ArchetypeId) {
    selectArchetype(id)
  }

  function handleSelectPortrait(id: PortraitId) {
    selectPortrait(id)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-white/60">Archetype</h2>
          {ARCHETYPE_IDS.map((id) => {
            const def = ARCHETYPES[id]
            const selected = archetype === id
            return (
              <button key={id} type="button" onClick={() => handleSelectArchetype(id)} className="text-left">
                <Panel
                  size="sm"
                  accent={selected ? 'var(--color-chrome-secondary)' : 'var(--color-chrome-primary)'}
                  className="flex h-full gap-4 p-4 transition-colors hover:!border-chrome-secondary"
                >
                  <PortraitFrame alt={def.name} fallbackText={initials(def.name)} size="sm" />
                  <div className="flex flex-col gap-1.5">
                    <div className="font-display text-sm font-bold uppercase tracking-wide text-white">{def.name}</div>
                    <div className="font-body text-xs text-white/60">{def.backstory}</div>
                    <div className="flex gap-3 font-display text-[0.6rem] font-bold uppercase tracking-widest">
                      {def.strength && <span style={{ color: INSIGHTS[def.strength].color }}>+ {INSIGHTS[def.strength].name}</span>}
                      {def.weakness && <span className="text-vitality">− {INSIGHTS[def.weakness].name}</span>}
                    </div>
                  </div>
                </Panel>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-white/60">Portrait</h2>
          <Panel size="sm" className="p-4">
            <div className="grid grid-cols-3 gap-3">
              {PORTRAIT_IDS.map((id) => {
                const def = PORTRAITS[id]
                const selected = portraitId === id
                return (
                  <button key={id} type="button" onClick={() => handleSelectPortrait(id)} aria-label={`Portrait ${def.label}`}>
                    <PortraitFrame
                      src={def.src}
                      alt={`Portrait ${def.label}`}
                      fallbackText={def.label}
                      accent={selected ? 'var(--color-chrome-secondary)' : 'var(--color-chrome-primary)'}
                      size="md"
                    />
                  </button>
                )
              })}
            </div>
          </Panel>
        </div>
      </div>

      <div className="flex justify-end">
        <CyberButton onClick={onNext} disabled={!archetype || !portraitId} tag="GO">
          Continue
        </CyberButton>
      </div>
    </div>
  )
}
