import { describe, expect, it } from 'vitest'
import { SAVE_FORMAT_VERSION, parseSaveBlob, summarizeSlot, type SaveBlob } from './saveEngine'

function makeBlob(overrides: Partial<SaveBlob> = {}): SaveBlob {
  return {
    version: SAVE_FORMAT_VERSION,
    savedAt: 1_700_000_000_000,
    name: 'Autosave',
    kind: 'autosave',
    insight: {
      archetype: 'hustler',
      playerName: 'Kade',
      levels: { ledger: 3, graft: 1, muscleMemory: 1, root: 1, static: 1, hustle: 4, mask: 1 },
      freePointsRemaining: 0,
      vitality: { current: 8, max: 10 },
      composure: { current: 9, max: 10 },
      consumedRedChecks: ['checkpoint-talk'],
      failState: null,
    },
    navigation: {
      unlockedLocationIds: ['checkpoint', 'noodleStall'],
      selectedLocationId: 'checkpoint',
    },
    currentHubId: 'checkpoint',
    casefile: {
      evidenceIds: ['drone-log'],
      noteIds: ['note-01'],
      flags: ['saw-breach'],
    },
    inkStateJson: '{"someInkState":true}',
    activeStoryId: 'checkpoint',
    ...overrides,
  }
}

describe('saveEngine', () => {
  it('parseSaveBlob round-trips a valid blob', () => {
    const blob = makeBlob()
    const parsed = parseSaveBlob(JSON.stringify(blob))
    expect(parsed).toEqual(blob)
  })

  it('parseSaveBlob returns null for malformed JSON', () => {
    expect(parseSaveBlob('{not json')).toBeNull()
  })

  it('parseSaveBlob returns null for missing input', () => {
    expect(parseSaveBlob(null)).toBeNull()
  })

  it('parseSaveBlob returns null for a version mismatch', () => {
    const blob = makeBlob({ version: SAVE_FORMAT_VERSION + 1 })
    expect(parseSaveBlob(JSON.stringify(blob))).toBeNull()
  })

  it('summarizeSlot looks up archetype and location display names', () => {
    const meta = summarizeSlot('autosave', makeBlob())
    expect(meta).toMatchObject({
      id: 'autosave',
      kind: 'autosave',
      name: 'Autosave',
      playerName: 'Kade',
      locationName: 'SEZ Checkpoint',
    })
    expect(meta.archetypeName).not.toBe('')
  })

  it('summarizeSlot handles no active location', () => {
    const meta = summarizeSlot('autosave', makeBlob({ navigation: { unlockedLocationIds: ['checkpoint'], selectedLocationId: null } }))
    expect(meta.locationName).toBeNull()
  })
})
