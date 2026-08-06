// Dev harness only — exercises navigationStore end to end, and is the seam
// that hands off from the Overworld to the Story Engine (Architecture §2)
// before any real illustrated-diorama presentation gets built on top of it.

import { useNavigationStore } from '../../stores/navigationStore'
import { useStoryStore } from '../../stores/storyStore'
import { LOCATIONS, LOCATION_IDS } from '../../content/locations'
import demoStoryJson from '../../../content/ink/demo.json'
import { GlitchText, Panel } from '../ui'

export function NavigationHarness() {
  const unlockedLocationIds = useNavigationStore((s) => s.unlockedLocationIds)
  const selectLocation = useNavigationStore((s) => s.selectLocation)
  const loadStory = useStoryStore((s) => s.loadStory)

  function handleSelect(id: (typeof LOCATION_IDS)[number]) {
    selectLocation(id)
    loadStory(demoStoryJson)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-8">
      <h2 className="font-display text-sm font-bold uppercase tracking-widest text-chrome-primary">
        <GlitchText text="Overworld" />
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {LOCATION_IDS.map((id) => {
          const def = LOCATIONS[id]
          const unlocked = unlockedLocationIds.has(id)
          return (
            <button key={id} type="button" disabled={!unlocked} onClick={() => handleSelect(id)} className="text-left disabled:cursor-not-allowed">
              <Panel
                size="sm"
                accent={unlocked ? 'var(--color-chrome-primary)' : 'rgba(255,255,255,0.15)'}
                className={`h-full p-4 transition-colors ${unlocked ? 'hover:!border-chrome-secondary' : 'opacity-40'}`}
              >
                <div className="font-display text-sm font-bold uppercase tracking-wide text-white">
                  {def.name}
                  {!unlocked && <span className="text-white/50"> (locked)</span>}
                </div>
                <div className="mt-1 font-body text-xs text-white/60">{def.blurb}</div>
              </Panel>
            </button>
          )
        })}
      </div>
    </div>
  )
}
