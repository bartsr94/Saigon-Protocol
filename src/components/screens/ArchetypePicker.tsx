// The bridge between Title and the game: archetype select only (UI_DESIGN
// §6.2 step 1). The free-point-spend and backstory/confirm steps aren't
// built — full Character Creation wasn't in scope for this pass — so
// picking an archetype takes its baseline Insight spread as final and
// drops straight into the Overworld.

import { ARCHETYPE_IDS, ARCHETYPES, type ArchetypeId } from '../../content/archetypes'
import { useInsightStore } from '../../stores/insightStore'
import { useUiStore } from '../../stores/uiStore'
import { GlitchText, Panel } from '../ui'

export function ArchetypePicker() {
  const selectArchetype = useInsightStore((s) => s.selectArchetype)
  const goToGame = useUiStore((s) => s.goToGame)

  function handleSelect(id: ArchetypeId) {
    selectArchetype(id)
    goToGame()
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center gap-6 p-8">
      <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-chrome-primary">
        <GlitchText text="Pick an archetype" />
      </h1>
      <div className="grid grid-cols-2 gap-4">
        {ARCHETYPE_IDS.map((id) => {
          const def = ARCHETYPES[id]
          return (
            <button key={id} type="button" onClick={() => handleSelect(id)} className="text-left">
              <Panel size="sm" className="h-full p-5 transition-colors hover:!border-chrome-secondary">
                <div className="font-display text-base font-bold uppercase tracking-wide text-white">{def.name}</div>
                <div className="mt-2 font-body text-sm text-white/60">{def.backstory}</div>
              </Panel>
            </button>
          )
        })}
      </div>
    </div>
  )
}
