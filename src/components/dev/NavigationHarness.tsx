// Dev harness only — exercises navigationStore end to end, and is the seam
// that hands off from the Overworld to the Story Engine (Architecture §2)
// before any real illustrated-diorama presentation gets built on top of it.

import { useNavigationStore } from '../../stores/navigationStore'
import { useStoryStore } from '../../stores/storyStore'
import { LOCATIONS, LOCATION_IDS } from '../../content/locations'
import demoStoryJson from '../../../content/ink/demo.json'

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
      <h2 className="text-sm font-medium text-neutral-200">Overworld</h2>
      <div className="grid grid-cols-2 gap-3">
        {LOCATION_IDS.map((id) => {
          const def = LOCATIONS[id]
          const unlocked = unlockedLocationIds.has(id)
          return (
            <button
              key={id}
              type="button"
              disabled={!unlocked}
              onClick={() => handleSelect(id)}
              className="rounded border border-neutral-700 p-4 text-left hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-neutral-700"
            >
              <div className="font-medium text-neutral-100">
                {def.name}
                {!unlocked && <span className="text-neutral-500"> (locked)</span>}
              </div>
              <div className="mt-1 text-xs text-neutral-400">{def.blurb}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
