// Gameplay/location-mode layer (Architecture §7, docs/LOCATION_HUB_ENCOUNTER_FLOW_SPEC.md):
// tracks which Location Hub the player is currently in, distinct from
// navigationStore's overworld-level "which locations are unlocked/selected."
// Also owns grid-hub exploration state (docs/LOCATION_GRID_EXPLORATION_SPEC.md):
// the player's tile position inside the current hub's grid, and the
// per-hub fog-of-war memory of which tiles have been revealed so far.

import { create } from 'zustand'
import { LOCATION_HUBS, type GridPosition, type HubId, type HubPoi } from '../content/locationHubs'
import { poiAt, tilesWithinRadius } from '../engine/gridMovement'
import type { SerializedGameplayState } from '../engine/saveEngine'

interface GameplayState {
  currentHubId: HubId | null
  playerPosition: GridPosition | null
  /** "x,y" tile keys revealed so far, per hub — persists once revealed (Location Grid Exploration Spec's "Fog persistence" decision). */
  revealedTiles: Partial<Record<HubId, Set<string>>>

  enterHub: (hubId: HubId) => void
  leaveHub: () => void
  /** Moves the player to a tile inside the current hub's grid and reveals fog around it. No-op outside a grid hub. */
  moveTo: (position: GridPosition) => void
  /** The POI (if any) at `position` inside `hubId`'s grid. */
  activePoiAt: (hubId: HubId, position: GridPosition) => HubPoi | null

  /** Bulk-restores state from a save blob (Save/Persistence Layer). */
  hydrate: (state: SerializedGameplayState) => void
  reset: () => void
}

function revealAround(revealed: Set<string>, hubId: HubId, position: GridPosition): Set<string> {
  const hub = LOCATION_HUBS[hubId]
  if (hub.layout !== 'grid') return revealed
  const next = new Set(revealed)
  for (const key of tilesWithinRadius(hub.grid, position, hub.grid.visionRadius ?? 1)) next.add(key)
  return next
}

export const useGameplayStore = create<GameplayState>((set, get) => ({
  currentHubId: null,
  playerPosition: null,
  revealedTiles: {},

  enterHub: (hubId) => {
    const hub = LOCATION_HUBS[hubId]
    const entryTile = hub.layout === 'grid' ? hub.grid.entryTile : null
    set((state) => ({
      currentHubId: hubId,
      playerPosition: entryTile,
      revealedTiles: entryTile
        ? { ...state.revealedTiles, [hubId]: revealAround(state.revealedTiles[hubId] ?? new Set(), hubId, entryTile) }
        : state.revealedTiles,
    }))
  },

  leaveHub: () => set({ currentHubId: null, playerPosition: null }),

  moveTo: (position) => {
    const { currentHubId, revealedTiles } = get()
    if (!currentHubId) return
    set({
      playerPosition: position,
      revealedTiles: { ...revealedTiles, [currentHubId]: revealAround(revealedTiles[currentHubId] ?? new Set(), currentHubId, position) },
    })
  },

  activePoiAt: (hubId, position) => {
    const hub = LOCATION_HUBS[hubId]
    if (hub.layout !== 'grid') return null
    return poiAt(hub.grid, position)
  },

  hydrate: (state) => {
    set({
      currentHubId: state.currentHubId,
      playerPosition: state.playerPosition,
      revealedTiles: Object.fromEntries(
        Object.entries(state.revealedTiles).map(([hubId, keys]) => [hubId, new Set(keys)]),
      ) as Partial<Record<HubId, Set<string>>>,
    })
  },

  reset: () => set({ currentHubId: null, playerPosition: null, revealedTiles: {} }),
}))
