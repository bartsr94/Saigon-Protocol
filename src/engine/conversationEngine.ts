// Pure save-blob shape and helpers for Conversation View's met/topic-state
// tracking (UI_PASS_SPEC.md §4.3) — same pure/impure split as
// casefileEngine.ts; conversationStore.ts is the reactive layer.

import type { NpcId } from '../content/npcs'

export interface SerializedConversationState {
  metNpcIds: NpcId[]
  /** Serialized ink Story state (`story.state.ToJson()`) per met NPC, so a repeat conversation resumes exactly where it was left. */
  stateByNpc: Partial<Record<NpcId, string>>
}

interface ConversationSetState {
  metNpcIds: Set<NpcId>
  stateByNpc: Partial<Record<NpcId, string>>
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
