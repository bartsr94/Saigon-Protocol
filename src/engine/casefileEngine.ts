import type { CaseNoteId, EvidenceId } from '../content/casefile'

export interface SerializedCasefileState {
  evidenceIds: EvidenceId[]
  noteIds: CaseNoteId[]
  flags: string[]
}

interface CasefileSetState {
  evidenceIds: Set<EvidenceId>
  noteIds: Set<CaseNoteId>
  flags: Set<string>
}

export function serializeCasefileState(state: CasefileSetState): SerializedCasefileState {
  return {
    evidenceIds: [...state.evidenceIds],
    noteIds: [...state.noteIds],
    flags: [...state.flags],
  }
}

export function hydrateCasefileState(state: SerializedCasefileState): CasefileSetState {
  return {
    evidenceIds: new Set(state.evidenceIds),
    noteIds: new Set(state.noteIds),
    flags: new Set(state.flags),
  }
}
