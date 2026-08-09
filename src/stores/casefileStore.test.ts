import { beforeEach, describe, expect, it } from 'vitest'
import { useCasefileStore } from './casefileStore'

describe('casefileStore', () => {
  beforeEach(() => {
    useCasefileStore.setState(useCasefileStore.getInitialState(), true)
  })

  it('starts empty', () => {
    const state = useCasefileStore.getState()
    expect(state.evidenceIds.size).toBe(0)
    expect(state.noteIds.size).toBe(0)
    expect(state.flags.size).toBe(0)
  })

  it('addEvidence, unlockNote, and setFlag are idempotent', () => {
    useCasefileStore.getState().addEvidence('drone-log')
    useCasefileStore.getState().addEvidence('drone-log')
    useCasefileStore.getState().unlockNote('note-01')
    useCasefileStore.getState().unlockNote('note-01')
    useCasefileStore.getState().setFlag('saw-breach')
    useCasefileStore.getState().setFlag('saw-breach')

    const state = useCasefileStore.getState()
    expect(state.evidenceIds.size).toBe(1)
    expect(state.noteIds.size).toBe(1)
    expect(state.flags.size).toBe(1)
    expect(state.hasEvidence('drone-log')).toBe(true)
    expect(state.hasNote('note-01')).toBe(true)
    expect(state.hasFlag('saw-breach')).toBe(true)
  })

  it('clearFlag removes a set flag and is a no-op otherwise', () => {
    useCasefileStore.getState().setFlag('checkpoint-inner-wing-unlocked')
    useCasefileStore.getState().clearFlag('checkpoint-inner-wing-unlocked')
    expect(useCasefileStore.getState().hasFlag('checkpoint-inner-wing-unlocked')).toBe(false)

    useCasefileStore.getState().clearFlag('never-set')
    expect(useCasefileStore.getState().flags.size).toBe(0)
  })

  it('hydrate bulk-restores evidence, notes, and flags', () => {
    useCasefileStore.getState().hydrate({
      evidenceIds: ['burner-phone'],
      noteIds: ['note-02'],
      flags: ['knows-hn12'],
    })

    const state = useCasefileStore.getState()
    expect(state.evidenceIds.has('burner-phone')).toBe(true)
    expect(state.noteIds.has('note-02')).toBe(true)
    expect(state.flags.has('knows-hn12')).toBe(true)
  })

  it('reset clears progression back to empty', () => {
    useCasefileStore.getState().addEvidence('water-sample')
    useCasefileStore.getState().unlockNote('note-01')
    useCasefileStore.getState().setFlag('foo')

    useCasefileStore.getState().reset()

    const state = useCasefileStore.getState()
    expect(state.evidenceIds.size).toBe(0)
    expect(state.noteIds.size).toBe(0)
    expect(state.flags.size).toBe(0)
  })
})
