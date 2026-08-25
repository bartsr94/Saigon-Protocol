// Pure save-blob shape and helpers for Conversation View's met/topic-state
// tracking (UI_PASS_SPEC.md §4.3) — same pure/impure split as
// caseEngine.ts; conversationStore.ts is the reactive layer.

import type { LocationId } from '../content/locations'
import type { NpcId } from '../content/npcs'
import type { StoryLine } from './storyEngine'

/**
 * Serialized ink Story state (`story.state.ToJson()`) for a met NPC's topic
 * loop at one specific location, plus the `currentLines` batch that was
 * showing when it was captured — ink's own state doesn't reliably round-trip
 * a usable `currentText` for every knot shape (see storyStore.ts's
 * `hydrateFromRestoredState`), so the lines have to be stashed alongside the
 * ink state itself rather than reconstructed from it on resume.
 */
export interface SavedConversationState {
  ink: string
  lines: StoryLine[]
}

/**
 * `stateByNpc` is keyed by this composite (`<locationId>::<npcId>`), not by
 * `npcId` alone — an NPC who holds a topic loop at more than one location
 * (Ophelia: `turtleLakePlaza` before she relocates, then `opheliaApartment`)
 * would otherwise have her apartment visit resume Turtle Lake's serialized
 * ink state, since inkjs's `state.LoadJson()` position pointers are only
 * valid against the compiled story they came from.
 */
export function conversationStateKey(locationId: LocationId, npcId: NpcId): string {
  return `${locationId}::${npcId}`
}

export interface SerializedConversationState {
  metNpcIds: NpcId[]
  stateByNpc: Partial<Record<string, SavedConversationState>>
}

interface ConversationSetState {
  metNpcIds: Set<NpcId>
  stateByNpc: Partial<Record<string, SavedConversationState>>
}

export function serializeConversationState(state: ConversationSetState): SerializedConversationState {
  return {
    metNpcIds: [...state.metNpcIds],
    stateByNpc: { ...state.stateByNpc },
  }
}

export function hydrateConversationState(state: SerializedConversationState): ConversationSetState {
  return {
    metNpcIds: new Set(state.metNpcIds),
    stateByNpc: { ...state.stateByNpc },
  }
}
