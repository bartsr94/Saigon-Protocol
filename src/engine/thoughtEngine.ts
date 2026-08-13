import type { ThoughtId } from '../content/thoughts'

export interface SerializedThoughtState {
  unlockedThoughtIds: ThoughtId[]
  enabledThoughtIds: ThoughtId[]
}

interface ThoughtSetState {
  unlockedThoughtIds: Set<ThoughtId>
  enabledThoughtIds: Set<ThoughtId>
}

export function serializeThoughtState(state: ThoughtSetState): SerializedThoughtState {
  return {
    unlockedThoughtIds: [...state.unlockedThoughtIds],
    enabledThoughtIds: [...state.enabledThoughtIds],
  }
}

export function hydrateThoughtState(state: SerializedThoughtState): ThoughtSetState {
  return {
    unlockedThoughtIds: new Set(state.unlockedThoughtIds),
    enabledThoughtIds: new Set(state.enabledThoughtIds),
  }
}
