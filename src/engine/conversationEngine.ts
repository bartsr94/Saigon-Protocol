// Pure save-blob shape and helpers for Conversation View's met/topic-state
// tracking (UI_PASS_SPEC.md §4.3) — same pure/impure split as
// casefileEngine.ts; conversationStore.ts is the reactive layer.

import type { NpcId } from '../content/npcs'
import type { StoryLine } from './storyEngine'

/**
 * Serialized ink Story state (`story.state.ToJson()`) for a met NPC, plus
 * the `currentLines` batch that was showing when it was captured — ink's
 * own state doesn't reliably round-trip a usable `currentText` for every
 * knot shape (see storyStore.ts's `hydrateFromRestoredState`), so the lines
 * have to be stashed alongside the ink state itself rather than
 * reconstructed from it on resume.
 */
export interface SavedConversationState {
  ink: string
  lines: StoryLine[]
}

export interface SerializedConversationState {
  metNpcIds: NpcId[]
  stateByNpc: Partial<Record<NpcId, SavedConversationState>>
}

interface ConversationSetState {
  metNpcIds: Set<NpcId>
  stateByNpc: Partial<Record<NpcId, SavedConversationState>>
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
