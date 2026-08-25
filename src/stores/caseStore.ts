import { create } from 'zustand'
import type { CaseId, CaseNoteId, EvidenceId } from '../content/cases'
import { hydrateCaseState, type SerializedCaseState } from '../engine/caseEngine'

function objectiveKey(caseId: CaseId, objectiveId: string): string {
  return `${caseId}::${objectiveId}`
}

interface CaseState {
  evidenceIds: Set<EvidenceId>
  noteIds: Set<CaseNoteId>
  flags: Set<string>
  activeCaseIds: Set<CaseId>
  completedCaseIds: Set<CaseId>
  completedObjectiveIds: Set<string>

  addEvidence: (id: EvidenceId) => void
  unlockNote: (id: CaseNoteId) => void
  setFlag: (flag: string) => void
  /** Debug-console counterpart to `setFlag` — production content only ever sets flags forward. */
  clearFlag: (flag: string) => void

  /** Idempotent — marks a case Active. No-op if already active or already completed. */
  startCase: (id: CaseId) => void
  /** Idempotent — marks one objective done within a case. Does not itself complete the case. */
  completeObjective: (caseId: CaseId, objectiveId: string) => void
  /** Idempotent — moves a case from Active to Completed. */
  completeCase: (id: CaseId) => void

  hasEvidence: (id: EvidenceId) => boolean
  hasNote: (id: CaseNoteId) => boolean
  hasFlag: (flag: string) => boolean
  isCaseActive: (id: CaseId) => boolean
  isCaseCompleted: (id: CaseId) => boolean
  isObjectiveComplete: (caseId: CaseId, objectiveId: string) => boolean

  hydrate: (state: SerializedCaseState) => void
  reset: () => void
}

const INITIAL_CASE_STATE = {
  evidenceIds: new Set<EvidenceId>(),
  noteIds: new Set<CaseNoteId>(),
  flags: new Set<string>(),
  activeCaseIds: new Set<CaseId>(),
  completedCaseIds: new Set<CaseId>(),
  completedObjectiveIds: new Set<string>(),
}

export const useCaseStore = create<CaseState>((set, get) => ({
  ...INITIAL_CASE_STATE,

  addEvidence: (id) => {
    if (get().evidenceIds.has(id)) return
    set({ evidenceIds: new Set(get().evidenceIds).add(id) })
  },

  unlockNote: (id) => {
    if (get().noteIds.has(id)) return
    set({ noteIds: new Set(get().noteIds).add(id) })
  },

  setFlag: (flag) => {
    if (get().flags.has(flag)) return
    set({ flags: new Set(get().flags).add(flag) })
  },

  clearFlag: (flag) => {
    if (!get().flags.has(flag)) return
    const next = new Set(get().flags)
    next.delete(flag)
    set({ flags: next })
  },

  startCase: (id) => {
    if (get().activeCaseIds.has(id) || get().completedCaseIds.has(id)) return
    set({ activeCaseIds: new Set(get().activeCaseIds).add(id) })
  },

  completeObjective: (caseId, objectiveId) => {
    const key = objectiveKey(caseId, objectiveId)
    if (get().completedObjectiveIds.has(key)) return
    set({ completedObjectiveIds: new Set(get().completedObjectiveIds).add(key) })
  },

  completeCase: (id) => {
    if (get().completedCaseIds.has(id)) return
    const nextActive = new Set(get().activeCaseIds)
    nextActive.delete(id)
    set({ activeCaseIds: nextActive, completedCaseIds: new Set(get().completedCaseIds).add(id) })
  },

  hasEvidence: (id) => get().evidenceIds.has(id),
  hasNote: (id) => get().noteIds.has(id),
  hasFlag: (flag) => get().flags.has(flag),
  isCaseActive: (id) => get().activeCaseIds.has(id),
  isCaseCompleted: (id) => get().completedCaseIds.has(id),
  isObjectiveComplete: (caseId, objectiveId) => get().completedObjectiveIds.has(objectiveKey(caseId, objectiveId)),

  hydrate: (state) => {
    set(hydrateCaseState(state))
  },

  reset: () => {
    set({
      evidenceIds: new Set(),
      noteIds: new Set(),
      flags: new Set(),
      activeCaseIds: new Set(),
      completedCaseIds: new Set(),
      completedObjectiveIds: new Set(),
    })
  },
}))
