import { create } from 'zustand'
import type { CaseNoteId, EvidenceId } from '../content/casefile'
import { hydrateCasefileState, type SerializedCasefileState } from '../engine/casefileEngine'

interface CasefileState {
  evidenceIds: Set<EvidenceId>
  noteIds: Set<CaseNoteId>
  flags: Set<string>

  addEvidence: (id: EvidenceId) => void
  unlockNote: (id: CaseNoteId) => void
  setFlag: (flag: string) => void

  hasEvidence: (id: EvidenceId) => boolean
  hasNote: (id: CaseNoteId) => boolean
  hasFlag: (flag: string) => boolean

  hydrate: (state: SerializedCasefileState) => void
  reset: () => void
}

const INITIAL_CASEFILE_STATE = {
  evidenceIds: new Set<EvidenceId>(),
  noteIds: new Set<CaseNoteId>(),
  flags: new Set<string>(),
}

export const useCasefileStore = create<CasefileState>((set, get) => ({
  ...INITIAL_CASEFILE_STATE,

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

  hasEvidence: (id) => get().evidenceIds.has(id),
  hasNote: (id) => get().noteIds.has(id),
  hasFlag: (flag) => get().flags.has(flag),

  hydrate: (state) => {
    set(hydrateCasefileState(state))
  },

  reset: () => {
    set({
      evidenceIds: new Set(),
      noteIds: new Set(),
      flags: new Set(),
    })
  },
}))
