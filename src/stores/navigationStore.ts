// Overworld/Navigation Layer (Architecture §7): tracks which locations exist,
// which are unlocked, and which is selected. No knowledge of storyStore or
// inkjs — the Story Engine handoff happens at the component layer, keeping
// this system's responsibility singular.

import { create } from 'zustand'
import { LOCATIONS, LOCATION_IDS, type LocationId } from '../content/locations'
import type { SerializedNavigationState } from '../engine/saveEngine'

interface NavigationState {
  unlockedLocationIds: Set<LocationId>
  selectedLocationId: LocationId | null

  unlockLocation: (id: LocationId) => void
  selectLocation: (id: LocationId) => void
  returnToOverworld: () => void

  /** Bulk-restores state from a save blob (Save/Persistence Layer). */
  hydrate: (state: SerializedNavigationState) => void
}

function defaultUnlockedLocationIds(): Set<LocationId> {
  return new Set(LOCATION_IDS.filter((id) => LOCATIONS[id].unlockedByDefault))
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  unlockedLocationIds: defaultUnlockedLocationIds(),
  selectedLocationId: null,

  unlockLocation: (id) => {
    set({ unlockedLocationIds: new Set(get().unlockedLocationIds).add(id) })
  },

  selectLocation: (id) => {
    if (!get().unlockedLocationIds.has(id)) return
    set({ selectedLocationId: id })
  },

  returnToOverworld: () => {
    set({ selectedLocationId: null })
  },

  hydrate: (state) => {
    set({
      unlockedLocationIds: new Set(state.unlockedLocationIds),
      selectedLocationId: state.selectedLocationId,
    })
  },
}))
