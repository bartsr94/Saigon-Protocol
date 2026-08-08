// Location Hub routing (Architecture §7, docs/LOCATION_HUB_ENCOUNTER_FLOW_SPEC.md):
// resolves the current hub and dispatches to one of its two presentations —
// HubGridView for hubs with a walkable grid, HubCardListView for hubs that
// haven't earned one yet (docs/LOCATION_GRID_EXPLORATION_SPEC.md).

import { BACKGROUNDS } from '../../content/backgrounds'
import { LOCATION_HUBS } from '../../content/locationHubs'
import { LOCATIONS, type LocationId } from '../../content/locations'
import { useAudioStore } from '../../stores/audioStore'
import { useGameplayStore } from '../../stores/gameplayStore'
import { useNavigationStore } from '../../stores/navigationStore'
import { useSaveStore } from '../../stores/saveStore'
import { useStoryStore } from '../../stores/storyStore'
import { useUiStore } from '../../stores/uiStore'
import { LOCATION_STORY_JSON } from '../../content/locationStories'
import { HubCardListView } from './HubCardListView'
import { HubGridView } from './HubGridView'
import { NavRail } from './NavRail'

export function LocationHubScreen() {
  const currentHubId = useGameplayStore((s) => s.currentHubId)
  const leaveHub = useGameplayStore((s) => s.leaveHub)
  const openOverlay = useUiStore((s) => s.openOverlay)
  const returnToOverworld = useNavigationStore((s) => s.returnToOverworld)
  const selectLocation = useNavigationStore((s) => s.selectLocation)
  const loadStory = useStoryStore((s) => s.loadStory)

  const hub = currentHubId ? LOCATION_HUBS[currentHubId] : null
  const background = hub?.backgroundId ? BACKGROUNDS[hub.backgroundId] : null

  function enterStory(id: LocationId) {
    selectLocation(id)
    loadStory(LOCATION_STORY_JSON[id], undefined, id)
    useAudioStore.getState().enterLocation(LOCATIONS[id])
    useSaveStore.getState().autosave()
  }

  function handleReturnToMap() {
    leaveHub()
    returnToOverworld()
    useAudioStore.getState().enterOverworld()
    useSaveStore.getState().autosave()
  }

  if (!hub || !currentHubId) return null

  return (
    <div className="flex h-svh w-full">
      <NavRail
        className="shrink-0 p-4"
        onChar={() => openOverlay('character')}
        onMap={handleReturnToMap}
        onCase={() => openOverlay('casefile')}
        onMenu={() => openOverlay('settings')}
      />

      {hub.layout === 'grid' ? (
        <HubGridView hub={hub} background={background} onEnterStory={enterStory} />
      ) : (
        <HubCardListView hub={hub} background={background} onEnterStory={enterStory} onReturnToMap={handleReturnToMap} />
      )}
    </div>
  )
}
