// Location Hub routing (Architecture §7's Location Hub Layer):
// resolves the current hub and dispatches to one of its two presentations —
// HubGridView for hubs with a walkable grid, HubCardListView for hubs that
// haven't earned one yet.

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
  const currentDistrictId = useGameplayStore((s) => s.currentDistrictId)
  const playerPosition = useGameplayStore((s) => s.playerPosition)
  const leaveHub = useGameplayStore((s) => s.leaveHub)
  const openOverlay = useUiStore((s) => s.openOverlay)
  const returnToOverworld = useNavigationStore((s) => s.returnToOverworld)
  const selectLocation = useNavigationStore((s) => s.selectLocation)
  const loadStory = useStoryStore((s) => s.loadStory)

  const hub = currentHubId ? LOCATION_HUBS[currentHubId] : null
  const background = hub?.backgroundId ? BACKGROUNDS[hub.backgroundId] : null

  // Card-list hubs have no walkable grid, so there's no entry tile to gate
  // on — only a grid hub requires standing back at the entrance to leave.
  const entryTile = hub?.layout === 'grid' ? hub.grid.entryTile : null
  const position = playerPosition ?? entryTile
  const atEntry = !entryTile || (position?.x === entryTile.x && position?.y === entryTile.y)

  function enterStory(id: LocationId) {
    selectLocation(id)
    loadStory(LOCATION_STORY_JSON[id], undefined, id)
    useAudioStore.getState().enterLocation(LOCATIONS[id])
    useSaveStore.getState().autosave()
  }

  // "Map" pops one layer at a time (Architecture §7's District Street
  // Layer): a Hub entered from within a district street
  // (currentDistrictId still set) returns to that street, not all the way
  // to the Overworld — leaveHub() alone lets App.tsx's routing fall through
  // to DistrictStreetScreen. A Hub entered directly (no street map for its
  // district yet) still jumps straight to the Overworld as before.
  function handleReturnToMap() {
    leaveHub()
    if (!currentDistrictId) returnToOverworld()
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
        mapDisabled={!atEntry}
        mapTitle="Return to the entrance to leave."
      />

      {hub.layout === 'grid' ? (
        <HubGridView hub={hub} background={background} onEnterStory={enterStory} onReturnToMap={handleReturnToMap} atEntry={atEntry} />
      ) : (
        <HubCardListView hub={hub} background={background} onEnterStory={enterStory} onReturnToMap={handleReturnToMap} />
      )}
    </div>
  )
}
