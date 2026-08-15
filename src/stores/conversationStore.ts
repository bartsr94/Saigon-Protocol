// Conversation View (UI_PASS_SPEC.md §4): tracks which NPCs the player has
// met (their first-encounter scene has ended) and each met NPC's own
// persistent ink Story state, so repeat "Talk" visits resume topic mode
// instead of replaying the scene. A met NPC's saved state is what tells
// LocationHubScreen a fresh first encounter apart from a conversation to
// resume — deliberately no separate "has saved state" flag to keep in sync
// with `metNpcIds`, since an NPC can be met before ever actually reaching
// their topics knot (the first-encounter scene itself might not save any
// per-NPC ink state at all).

import { create } from 'zustand'
import type { NpcId } from '../content/npcs'
import {
  hydrateConversationState,
  type SavedConversationState,
  type SerializedConversationState,
} from '../engine/conversationEngine'
import type { StoryLine } from '../engine/storyEngine'

interface ConversationState {
  metNpcIds: Set<NpcId>
  stateByNpc: Partial<Record<NpcId, SavedConversationState>>

  markMet: (npcId: NpcId) => void
  hasMet: (npcId: NpcId) => boolean
  saveConversationState: (npcId: NpcId, ink: string, lines: StoryLine[]) => void
  getConversationState: (npcId: NpcId) => SavedConversationState | undefined

  hydrate: (state: SerializedConversationState) => void
  reset: () => void
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  metNpcIds: new Set(),
  stateByNpc: {},

  markMet: (npcId) => {
    if (get().metNpcIds.has(npcId)) return
    set({ metNpcIds: new Set(get().metNpcIds).add(npcId) })
  },

  hasMet: (npcId) => get().metNpcIds.has(npcId),

  saveConversationState: (npcId, ink, lines) => {
    set({ stateByNpc: { ...get().stateByNpc, [npcId]: { ink, lines } } })
  },

  getConversationState: (npcId) => get().stateByNpc[npcId],

  hydrate: (state) => {
    set(hydrateConversationState(state))
  },

  reset: () => {
    set({ metNpcIds: new Set(), stateByNpc: {} })
  },
}))
