import type { CaseId, CaseNoteId, EvidenceId } from '../content/cases'

export interface SerializedCaseState {
  evidenceIds: EvidenceId[]
  noteIds: CaseNoteId[]
  flags: string[]
  activeCaseIds: CaseId[]
  completedCaseIds: CaseId[]
  /** Composite `${caseId}::${objectiveId}` keys — see caseStore.ts. */
  completedObjectiveIds: string[]
}

interface CaseSetState {
  evidenceIds: Set<EvidenceId>
  noteIds: Set<CaseNoteId>
  flags: Set<string>
  activeCaseIds: Set<CaseId>
  completedCaseIds: Set<CaseId>
  completedObjectiveIds: Set<string>
}

export function serializeCaseState(state: CaseSetState): SerializedCaseState {
  return {
    evidenceIds: [...state.evidenceIds],
    noteIds: [...state.noteIds],
    flags: [...state.flags],
    activeCaseIds: [...state.activeCaseIds],
    completedCaseIds: [...state.completedCaseIds],
    completedObjectiveIds: [...state.completedObjectiveIds],
  }
}

/** `?? []` on the three case-tracking fields lets a pre-Cases-rework save hydrate without crashing. */
export function hydrateCaseState(state: SerializedCaseState): CaseSetState {
  return {
    evidenceIds: new Set(state.evidenceIds),
    noteIds: new Set(state.noteIds),
    flags: new Set(state.flags),
    activeCaseIds: new Set(state.activeCaseIds ?? []),
    completedCaseIds: new Set(state.completedCaseIds ?? []),
    completedObjectiveIds: new Set(state.completedObjectiveIds ?? []),
  }
}
