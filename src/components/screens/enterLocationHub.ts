// Shared "step into a Location Hub" sequence (Architecture §7). Used both
// from the Overworld's flat location list (districts without a District
// Street map yet) and from a District Street POI once you've walked to it
// — same four steps either way, so this exists to keep OverworldScreen.tsx
// and DistrictStreetView.tsx from each hand-rolling their own copy.

import { LOCATIONS, type LocationId } from '../../content/locations'
import { useAudioStore } from '../../stores/audioStore'
import { useGameplayStore } from '../../stores/gameplayStore'
import { useNavigationStore } from '../../stores/navigationStore'
import { useSaveStore } from '../../stores/saveStore'

export function enterLocationHub(id: LocationId): void {
  useNavigationStore.getState().selectLocation(id)
  useGameplayStore.getState().enterHub(id)
  // Hub's baseline mood (docs/GAME_GUIDE.md), instant on entry, before any
  // encounter scene inside that location takes over with its own tags.
  useAudioStore.getState().enterLocation(LOCATIONS[id])
  // Autosave checkpoint (Save/Persistence Layer): capture the current hub
  // entry so scene selection can happen from inside the location later.
  useSaveStore.getState().autosave()
}
