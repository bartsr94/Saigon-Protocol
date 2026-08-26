// Corruption tally (docs/CORRUPT_DETECTIVE_THOUGHTS_SPEC.md): a Set of
// marked corrupt-action ids, dedup'd so replaying the same corrupt choice on
// a repeat visit doesn't inflate the count. General enough to back any
// future "did this enough times" thought, not just the corruption branch.
// Pure module, mirrors thoughtEngine.ts's role.

export interface SerializedCorruptionState {
  markedActionIds: string[]
}

interface CorruptionSetState {
  markedActionIds: Set<string>
}

export function serializeCorruptionState(state: CorruptionSetState): SerializedCorruptionState {
  return { markedActionIds: [...state.markedActionIds] }
}

export function hydrateCorruptionState(state: SerializedCorruptionState): CorruptionSetState {
  return { markedActionIds: new Set(state.markedActionIds) }
}
