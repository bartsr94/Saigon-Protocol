// Relationship System (SAIGON_PROTOCOL_ARCHITECTURE.md §14): per-NPC affinity
// score. Same shape as thoughtStore.ts; a "full record, always defined"
// store rather than the unlocked/enabled Set pattern case/thought use,
// since affinity isn't something an NPC has or doesn't have — it's always
// at least 0/stranger.

import { create } from 'zustand'
import type { NpcId } from '../content/npcs'
import { clampAffinity, createInitialRelationshipState, type SerializedRelationshipState } from '../engine/relationshipEngine'

interface RelationshipState {
  affinity: Record<NpcId, number>

  adjustAffinity: (npcId: NpcId, delta: number) => void

  hydrate: (state: SerializedRelationshipState) => void
  reset: () => void
}

export const useRelationshipStore = create<RelationshipState>((set, get) => ({
  affinity: createInitialRelationshipState(),

  adjustAffinity: (npcId, delta) => {
    const current = get().affinity
    const next = clampAffinity(current[npcId] + delta)
    if (next === current[npcId]) return
    set({ affinity: { ...current, [npcId]: next } })
  },

  hydrate: (state) => {
    set({ affinity: { ...state } })
  },

  reset: () => {
    set({ affinity: createInitialRelationshipState() })
  },
}))
