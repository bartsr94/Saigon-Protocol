import { create } from 'zustand'
import { THOUGHT_SLOT_CAPACITY, THOUGHTS, type ThoughtId } from '../content/thoughts'
import type { InsightId } from '../content/insights'
import { hydrateThoughtState, type SerializedThoughtState } from '../engine/thoughtEngine'

interface ThoughtState {
  unlockedThoughtIds: Set<ThoughtId>
  enabledThoughtIds: Set<ThoughtId>

  unlockThought: (id: ThoughtId) => void
  enableThought: (id: ThoughtId) => void
  disableThought: (id: ThoughtId) => void

  isUnlocked: (id: ThoughtId) => boolean
  isEnabled: (id: ThoughtId) => boolean
  /** Sum of insightBonuses[].amount across every enabled thought targeting this Insight (insightStore.rollCheck). */
  insightBonusFor: (insightId: InsightId) => number

  hydrate: (state: SerializedThoughtState) => void
  reset: () => void
}

const INITIAL_THOUGHT_STATE = {
  unlockedThoughtIds: new Set<ThoughtId>(),
  enabledThoughtIds: new Set<ThoughtId>(),
}

export const useThoughtStore = create<ThoughtState>((set, get) => ({
  ...INITIAL_THOUGHT_STATE,

  unlockThought: (id) => {
    if (get().unlockedThoughtIds.has(id)) return
    set({ unlockedThoughtIds: new Set(get().unlockedThoughtIds).add(id) })
  },

  enableThought: (id) => {
    const { unlockedThoughtIds, enabledThoughtIds } = get()
    if (!unlockedThoughtIds.has(id) || enabledThoughtIds.has(id)) return
    if (enabledThoughtIds.size >= THOUGHT_SLOT_CAPACITY) return
    set({ enabledThoughtIds: new Set(enabledThoughtIds).add(id) })
  },

  disableThought: (id) => {
    if (!get().enabledThoughtIds.has(id)) return
    const next = new Set(get().enabledThoughtIds)
    next.delete(id)
    set({ enabledThoughtIds: next })
  },

  isUnlocked: (id) => get().unlockedThoughtIds.has(id),
  isEnabled: (id) => get().enabledThoughtIds.has(id),

  insightBonusFor: (insightId) => {
    let bonus = 0
    for (const id of get().enabledThoughtIds) {
      const def = THOUGHTS[id]
      for (const b of def.insightBonuses ?? []) {
        if (b.insightId === insightId) bonus += b.amount
      }
    }
    return bonus
  },

  hydrate: (state) => {
    set(hydrateThoughtState(state))
  },

  reset: () => {
    set({
      unlockedThoughtIds: new Set(),
      enabledThoughtIds: new Set(),
    })
  },
}))
