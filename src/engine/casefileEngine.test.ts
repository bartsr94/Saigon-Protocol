import { describe, expect, it } from 'vitest'
import { hydrateCasefileState, serializeCasefileState } from './casefileEngine'

describe('casefileEngine', () => {
  it('serializeCasefileState converts sets to arrays', () => {
    expect(
      serializeCasefileState({
        evidenceIds: new Set(['drone-log', 'burner-phone']),
        noteIds: new Set(['note-02']),
        flags: new Set(['saw-breach']),
      }),
    ).toEqual({
      evidenceIds: ['drone-log', 'burner-phone'],
      noteIds: ['note-02'],
      flags: ['saw-breach'],
    })
  })

  it('hydrateCasefileState rebuilds sets from serialized arrays', () => {
    const hydrated = hydrateCasefileState({
      evidenceIds: ['drone-log'],
      noteIds: ['note-01', 'note-02'],
      flags: ['foo', 'bar'],
    })

    expect(hydrated.evidenceIds.has('drone-log')).toBe(true)
    expect(hydrated.noteIds.has('note-01')).toBe(true)
    expect(hydrated.noteIds.has('note-02')).toBe(true)
    expect(hydrated.flags.has('foo')).toBe(true)
    expect(hydrated.flags.has('bar')).toBe(true)
  })
})
