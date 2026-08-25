import { beforeEach, describe, expect, it } from 'vitest'
import { useCaseStore } from './caseStore'

describe('caseStore', () => {
  beforeEach(() => {
    useCaseStore.setState(useCaseStore.getInitialState(), true)
  })

  it('starts empty', () => {
    const state = useCaseStore.getState()
    expect(state.evidenceIds.size).toBe(0)
    expect(state.noteIds.size).toBe(0)
    expect(state.flags.size).toBe(0)
    expect(state.activeCaseIds.size).toBe(0)
    expect(state.completedCaseIds.size).toBe(0)
    expect(state.completedObjectiveIds.size).toBe(0)
  })

  it('addEvidence, unlockNote, and setFlag are idempotent', () => {
    useCaseStore.getState().addEvidence('drone-log')
    useCaseStore.getState().addEvidence('drone-log')
    useCaseStore.getState().unlockNote('note-01')
    useCaseStore.getState().unlockNote('note-01')
    useCaseStore.getState().setFlag('saw-breach')
    useCaseStore.getState().setFlag('saw-breach')

    const state = useCaseStore.getState()
    expect(state.evidenceIds.size).toBe(1)
    expect(state.noteIds.size).toBe(1)
    expect(state.flags.size).toBe(1)
    expect(state.hasEvidence('drone-log')).toBe(true)
    expect(state.hasNote('note-01')).toBe(true)
    expect(state.hasFlag('saw-breach')).toBe(true)
  })

  it('clearFlag removes a set flag and is a no-op otherwise', () => {
    useCaseStore.getState().setFlag('checkpoint-inner-wing-unlocked')
    useCaseStore.getState().clearFlag('checkpoint-inner-wing-unlocked')
    expect(useCaseStore.getState().hasFlag('checkpoint-inner-wing-unlocked')).toBe(false)

    useCaseStore.getState().clearFlag('never-set')
    expect(useCaseStore.getState().flags.size).toBe(0)
  })

  it('startCase is idempotent and marks a case active', () => {
    useCaseStore.getState().startCase('case1')
    useCaseStore.getState().startCase('case1')

    const state = useCaseStore.getState()
    expect(state.activeCaseIds.size).toBe(1)
    expect(state.isCaseActive('case1')).toBe(true)
    expect(state.isCaseCompleted('case1')).toBe(false)
  })

  it('startCase does not reactivate an already-completed case', () => {
    useCaseStore.getState().startCase('case1')
    useCaseStore.getState().completeCase('case1')
    useCaseStore.getState().startCase('case1')

    const state = useCaseStore.getState()
    expect(state.isCaseActive('case1')).toBe(false)
    expect(state.isCaseCompleted('case1')).toBe(true)
  })

  it('completeObjective is idempotent and scoped per case', () => {
    useCaseStore.getState().completeObjective('ophelia-stalker', 'recognition')
    useCaseStore.getState().completeObjective('ophelia-stalker', 'recognition')

    const state = useCaseStore.getState()
    expect(state.completedObjectiveIds.size).toBe(1)
    expect(state.isObjectiveComplete('ophelia-stalker', 'recognition')).toBe(true)
    expect(state.isObjectiveComplete('ophelia-stalker', 'pattern')).toBe(false)
    expect(state.isObjectiveComplete('case1', 'recognition')).toBe(false)
  })

  it('completeCase moves a case from active to completed and is idempotent', () => {
    useCaseStore.getState().startCase('case1')
    useCaseStore.getState().completeCase('case1')
    useCaseStore.getState().completeCase('case1')

    const state = useCaseStore.getState()
    expect(state.activeCaseIds.has('case1')).toBe(false)
    expect(state.completedCaseIds.size).toBe(1)
    expect(state.isCaseCompleted('case1')).toBe(true)
  })

  it('hydrate bulk-restores evidence, notes, flags, and case progress', () => {
    useCaseStore.getState().hydrate({
      evidenceIds: ['burner-phone'],
      noteIds: ['note-02'],
      flags: ['knows-hn12'],
      activeCaseIds: ['ophelia-stalker'],
      completedCaseIds: ['case1'],
      completedObjectiveIds: ['ophelia-stalker::recognition'],
    })

    const state = useCaseStore.getState()
    expect(state.evidenceIds.has('burner-phone')).toBe(true)
    expect(state.noteIds.has('note-02')).toBe(true)
    expect(state.flags.has('knows-hn12')).toBe(true)
    expect(state.isCaseActive('ophelia-stalker')).toBe(true)
    expect(state.isCaseCompleted('case1')).toBe(true)
    expect(state.isObjectiveComplete('ophelia-stalker', 'recognition')).toBe(true)
  })

  it('reset clears progression back to empty', () => {
    useCaseStore.getState().addEvidence('water-sample')
    useCaseStore.getState().unlockNote('note-01')
    useCaseStore.getState().setFlag('foo')
    useCaseStore.getState().startCase('case1')
    useCaseStore.getState().completeObjective('case1', 'investigate')

    useCaseStore.getState().reset()

    const state = useCaseStore.getState()
    expect(state.evidenceIds.size).toBe(0)
    expect(state.noteIds.size).toBe(0)
    expect(state.flags.size).toBe(0)
    expect(state.activeCaseIds.size).toBe(0)
    expect(state.completedCaseIds.size).toBe(0)
    expect(state.completedObjectiveIds.size).toBe(0)
  })
})
