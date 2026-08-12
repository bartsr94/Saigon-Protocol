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
      portraitId: 'p3',
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
    gameplay: {
      currentHubId: 'checkpoint',
      playerPosition: { x: 4, y: 1 },
      revealedTiles: { checkpoint: ['4,1', '4,2'] },
      currentDistrictId: 'district4',
      districtPlayerPosition: { x: 0, y: 1 },
      districtRevealedTiles: { district4: ['0,1'] },
    },
    casefile: {
      evidenceIds: ['drone-log'],
      noteIds: ['note-01'],
      flags: ['saw-breach'],
    },
    conversation: {
      metNpcIds: ['meiHong'],
      stateByNpc: { meiHong: '{"someConversationState":true}' },
    },
    inkStateJson: '{"someInkState":true}',
    activeStoryId: 'checkpoint',
    storyMode: 'scene',
    activeNpcId: null,
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
