// Overworld/Navigation (UI_DESIGN §6.3). Presented as a card list — the
// presentation-agnostic fallback Architecture §2 calls for; the illustrated-
// diorama treatment is separate future art-direction work.

import { useNavigationStore } from '../../stores/navigationStore'
import { useStoryStore } from '../../stores/storyStore'
import { useSaveStore } from '../../stores/saveStore'
import { useAudioStore } from '../../stores/audioStore'
import { useUiStore } from '../../stores/uiStore'
import { LOCATIONS, LOCATION_IDS, type LocationId } from '../../content/locations'
import { LOCATION_STORY_JSON } from '../../content/locationStories'
import { GlitchText, Panel } from '../ui'
import { NavRail } from './NavRail'

export function OverworldScreen() {
  const unlockedLocationIds = useNavigationStore((s) => s.unlockedLocationIds)
  const selectLocation = useNavigationStore((s) => s.selectLocation)
  const loadStory = useStoryStore((s) => s.loadStory)
  const openOverlay = useUiStore((s) => s.openOverlay)

  function handleSelect(id: LocationId) {
    selectLocation(id)
    loadStory(LOCATION_STORY_JSON[id])
    // Location's baseline mood (docs/AUDIO_VOICEOVER_SPEC.md), instant on
    // selection, before the ink content's own first-line tags (if any) take over.
    useAudioStore.getState().enterLocation(LOCATIONS[id])
    // Autosave checkpoint (Save/Persistence Layer): capture the fresh
    // scene's opening state right after handing off to the Story Engine.
    useSaveStore.getState().autosave()
  }

  return (
    <div className="flex h-svh w-full">
      <NavRail
        className="shrink-0 p-4"
        onChar={() => openOverlay('character')}
        onCase={() => openOverlay('casefile')}
        onMenu={() => openOverlay('settings')}
      />

      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="mb-6 font-display text-xl font-bold uppercase tracking-widest text-chrome-primary">
          <GlitchText text="Overworld" />
        </h1>
        <div className="grid max-w-3xl grid-cols-2 gap-4">
          {LOCATION_IDS.map((id) => {
            const def = LOCATIONS[id]
            const unlocked = unlockedLocationIds.has(id)
            return (
              <button
                key={id}
                type="button"
                disabled={!unlocked}
                onClick={() => handleSelect(id)}
                className="text-left disabled:cursor-not-allowed"
              >
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
    </div>
  )
}
