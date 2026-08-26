// Corruption tally (docs/CORRUPT_DETECTIVE_THOUGHTS_SPEC.md) — a single
// global count of distinct corrupt actions the player has taken, backing
// the "Everyone's Got a Price" thought's multi-action unlock. Set-based
// (not a bare counter) so `mark_corrupt_action` is idempotent per action id,
// same dedup shape evidence/notes already get for free from Set membership.

import { create } from 'zustand'
import { hydrateCorruptionState, type SerializedCorruptionState } from '../engine/corruptionEngine'

interface CorruptionState {
  markedActionIds: Set<string>

  markCorruptAction: (actionId: string) => void
  corruptionCount: () => number

  hydrate: (state: SerializedCorruptionState) => void
  reset: () => void
}

export const useCorruptionStore = create<CorruptionState>((set, get) => ({
  markedActionIds: new Set<string>(),

  markCorruptAction: (actionId) => {
    if (get().markedActionIds.has(actionId)) return
    set({ markedActionIds: new Set(get().markedActionIds).add(actionId) })
  },

  corruptionCount: () => get().markedActionIds.size,

  hydrate: (state) => {
    set(hydrateCorruptionState(state))
  },

  reset: () => {
    set({ markedActionIds: new Set() })
  },
}))
