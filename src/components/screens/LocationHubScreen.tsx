// Location Hub routing (Architecture §7's Location Hub Layer):
// resolves the current hub and dispatches to one of its two presentations —
// HubGridView for hubs with a walkable grid, HubCardListView for hubs that
// haven't earned one yet.

import { BACKGROUNDS } from '../../content/backgrounds'
import { LOCATION_HUBS, type HubInteraction } from '../../content/locationHubs'
import { LOCATIONS, type LocationId } from '../../content/locations'
import { useAudioStore } from '../../stores/audioStore'
import { useConversationStore } from '../../stores/conversationStore'
import { useGameplayStore } from '../../stores/gameplayStore'
import { useNavigationStore } from '../../stores/navigationStore'
import { useSaveStore } from '../../stores/saveStore'
import { useStoryStore } from '../../stores/storyStore'
import { useUiStore } from '../../stores/uiStore'
import { LOCATION_STORY_JSON } from '../../content/locationStories'
import { useDebugMapEditStore } from '../../stores/debugMapEditStore'
import { HubCardListView } from './HubCardListView'
import { HubGridView } from './HubGridView'
import { NavRail } from './NavRail'

export function LocationHubScreen() {
  const currentHubId = useGameplayStore((s) => s.currentHubId)
  const editingMap = useDebugMapEditStore((s) => s.editingMap)
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

  // Grid-hub POI interactions carry an npcId/topicsKnot that
  // HubCardListView's characters/actions don't (UI_PASS_SPEC.md §4) — a met NPC with
  // authored topics routes to Conversation View (resuming their saved
  // state, or jumping to their topics knot fresh) instead of replaying the
  // scene. Everything else (inspect actions, un-met or topic-less NPCs)
  // behaves exactly like `enterStory` above, just also threading `npcId`
  // through so DialogueScreen can mark a first-time NPC met when the scene ends.
  function enterHubInteraction(interaction: HubInteraction) {
    const { storyLocationId, npcId, topicsKnot, sceneKnot } = interaction
    selectLocation(storyLocationId)

    if (npcId && topicsKnot && useConversationStore.getState().hasMet(npcId)) {
      const savedState = useConversationStore.getState().getConversationState(npcId)
      loadStory(LOCATION_STORY_JSON[storyLocationId], savedState, storyLocationId, {
        mode: 'conversation',
        npcId,
        entryKnot: savedState ? undefined : topicsKnot,
        topicsKnot,
      })
    } else {
      loadStory(LOCATION_STORY_JSON[storyLocationId], undefined, storyLocationId, {
        mode: 'scene',
        npcId: topicsKnot ? npcId : undefined,
        entryKnot: sceneKnot,
        topicsKnot,
      })
    }

    useAudioStore.getState().enterLocation(LOCATIONS[storyLocationId])
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
        onThoughts={() => openOverlay('thoughtCabinet')}
        onMenu={() => openOverlay('settings')}
        mapDisabled={!atEntry}
        mapTitle="Return to the entrance to leave."
        disabled={editingMap}
      />

      {hub.layout === 'grid' ? (
        <HubGridView hub={hub} background={background} onEnterInteraction={enterHubInteraction} onReturnToMap={handleReturnToMap} atEntry={atEntry} />
      ) : (
        <HubCardListView hub={hub} background={background} onEnterStory={enterStory} onReturnToMap={handleReturnToMap} />
      )}
    </div>
  )
}
