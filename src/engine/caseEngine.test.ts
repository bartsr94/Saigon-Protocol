import { describe, expect, it } from 'vitest'
import { hydrateCaseState, serializeCaseState } from './caseEngine'

describe('caseEngine', () => {
  it('serializeCaseState converts sets to arrays', () => {
    expect(
      serializeCaseState({
        evidenceIds: new Set(['drone-log', 'burner-phone']),
        noteIds: new Set(['note-02']),
        flags: new Set(['saw-breach']),
        activeCaseIds: new Set(['case1']),
        completedCaseIds: new Set(),
        completedObjectiveIds: new Set(['case1::investigate']),
      }),
    ).toEqual({
      evidenceIds: ['drone-log', 'burner-phone'],
      noteIds: ['note-02'],
      flags: ['saw-breach'],
      activeCaseIds: ['case1'],
      completedCaseIds: [],
      completedObjectiveIds: ['case1::investigate'],
    })
  })

  it('hydrateCaseState rebuilds sets from serialized arrays', () => {
    const hydrated = hydrateCaseState({
      evidenceIds: ['drone-log'],
      noteIds: ['note-01', 'note-02'],
      flags: ['foo', 'bar'],
      activeCaseIds: ['ophelia-stalker'],
      completedCaseIds: ['case1'],
      completedObjectiveIds: ['ophelia-stalker::recognition'],
    })

    expect(hydrated.evidenceIds.has('drone-log')).toBe(true)
    expect(hydrated.noteIds.has('note-01')).toBe(true)
    expect(hydrated.noteIds.has('note-02')).toBe(true)
    expect(hydrated.flags.has('foo')).toBe(true)
    expect(hydrated.flags.has('bar')).toBe(true)
    expect(hydrated.activeCaseIds.has('ophelia-stalker')).toBe(true)
    expect(hydrated.completedCaseIds.has('case1')).toBe(true)
    expect(hydrated.completedObjectiveIds.has('ophelia-stalker::recognition')).toBe(true)
  })

  it('hydrateCaseState defaults missing case-tracking fields to empty (pre-rework saves)', () => {
    const hydrated = hydrateCaseState({
      evidenceIds: ['drone-log'],
      noteIds: [],
      flags: [],
    } as never)

    expect(hydrated.activeCaseIds.size).toBe(0)
    expect(hydrated.completedCaseIds.size).toBe(0)
    expect(hydrated.completedObjectiveIds.size).toBe(0)
  })
})
