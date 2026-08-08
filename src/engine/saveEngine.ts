// Pure save-blob shape and helpers for the Save/Persistence Layer
// (Architecture §8, docs/GAME_GUIDE.md §7). No localStorage access
// here — that's saveStore's job, mirroring storyEngine.ts's pure/impure
// split.

import { ARCHETYPES, type ArchetypeId } from '../content/archetypes'
import type { GridPosition, HubId } from '../content/locationHubs'
import type { SerializedCasefileState } from './casefileEngine'
import type { InsightId } from '../content/insights'
import { LOCATIONS, type LocationId } from '../content/locations'

// Bumped to 5 when grid-hub exploration state (player position, per-hub
// fog-of-war) was added (docs/LOCATION_GRID_EXPLORATION_SPEC.md). There is
// still no migration path; older saves are treated as absent rather than
// partially restored.
export const SAVE_FORMAT_VERSION = 5
export const AUTOSAVE_SLOT_ID = 'autosave'
export const SAVE_KEY_PREFIX = 'saigon-protocol:save:'

export type SaveSlotKind = 'autosave' | 'manual'

export interface SerializedInsightState {
  archetype: ArchetypeId | null
  playerName: string
  levels: Record<InsightId, number>
  freePointsRemaining: number
  vitality: { current: number; max: number }
  composure: { current: number; max: number }
  consumedRedChecks: string[]
  failState: 'vitality' | 'composure' | null
}

export interface SerializedNavigationState {
  unlockedLocationIds: LocationId[]
  selectedLocationId: LocationId | null
}

/** Grid-hub exploration state (docs/LOCATION_GRID_EXPLORATION_SPEC.md) — which hub, where the player stands in it, and which of its tiles have been revealed. `revealedTiles` uses "x,y" tile keys, one array per hub, since fog-of-war persists per hub for the life of the save. */
export interface SerializedGameplayState {
  currentHubId: HubId | null
  playerPosition: GridPosition | null
  revealedTiles: Partial<Record<HubId, string[]>>
}

export interface SaveBlob {
  version: number
  savedAt: number
  name: string
  kind: SaveSlotKind
  insight: SerializedInsightState
  navigation: SerializedNavigationState
  gameplay: SerializedGameplayState
  casefile: SerializedCasefileState
  /** null when saved with no active scene (e.g. standing on the Overworld). */
  inkStateJson: string | null
  /** Which compiled story inkStateJson belongs to ('intro' or a LocationId) — storyStore.activeStoryId at save time. Null alongside a null inkStateJson. */
  activeStoryId: string | null
}

export interface SaveSlotMeta {
  id: string
  kind: SaveSlotKind
  name: string
  savedAt: number
  playerName: string
  archetypeName: string
  locationName: string | null
}

export function storageKey(slotId: string): string {
  return `${SAVE_KEY_PREFIX}${slotId}`
}

/** Corrupt JSON or a version mismatch is treated as "no save" rather than thrown. */
export function parseSaveBlob(raw: string | null): SaveBlob | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as SaveBlob
    if (parsed?.version !== SAVE_FORMAT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

export function summarizeSlot(id: string, blob: SaveBlob): SaveSlotMeta {
  return {
    id,
    kind: blob.kind,
    name: blob.name,
    savedAt: blob.savedAt,
    playerName: blob.insight.playerName,
    archetypeName: blob.insight.archetype ? ARCHETYPES[blob.insight.archetype].name : 'Unknown',
    locationName: blob.navigation.selectedLocationId ? LOCATIONS[blob.navigation.selectedLocationId].name : null,
  }
}
