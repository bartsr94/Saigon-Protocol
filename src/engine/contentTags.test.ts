import { describe, expect, it } from 'vitest'
import { parseChoiceTags, parseLineSpeaker } from './contentTags'

describe('parseLineSpeaker', () => {
  it('defaults to narrator when there are no tags', () => {
    expect(parseLineSpeaker([])).toEqual({ type: 'narrator' })
  })

  it('resolves an npc speaker tag', () => {
    expect(parseLineSpeaker(['speaker: npc:meiHong'])).toEqual({ type: 'npc', npcId: 'meiHong' })
  })

  it('resolves an insight speaker tag', () => {
    expect(parseLineSpeaker(['speaker: insight:static'])).toEqual({ type: 'insight', insightId: 'static' })
  })

  it('falls back to narrator for an unrecognized npcId', () => {
    expect(parseLineSpeaker(['speaker: npc:someoneNotInContent'])).toEqual({ type: 'narrator' })
  })

  it('falls back to narrator for an unrecognized insightId', () => {
    expect(parseLineSpeaker(['speaker: insight:notARealInsight'])).toEqual({ type: 'narrator' })
  })

  it('falls back to narrator for an unrecognized speaker kind', () => {
    expect(parseLineSpeaker(['speaker: location:noodleStall'])).toEqual({ type: 'narrator' })
  })

  it('ignores unrelated tags and keys off the speaker tag among them', () => {
    expect(parseLineSpeaker(['voice: some-clip-id', 'speaker: npc:meiHong'])).toEqual({ type: 'npc', npcId: 'meiHong' })
  })
})

describe('parseChoiceTags', () => {
  it('returns "none" for null tags (inkjs default for an untagged choice)', () => {
    expect(parseChoiceTags(null)).toEqual({ variant: 'none' })
  })

  it('returns "none" for an empty tag list', () => {
    expect(parseChoiceTags([])).toEqual({ variant: 'none' })
  })

  it('resolves a bare insight-gated tag', () => {
    expect(parseChoiceTags(['insight: static'])).toEqual({ variant: 'insight-gated', insightId: 'static' })
  })

  it('resolves a white check paired with its insight', () => {
    expect(parseChoiceTags(['insight: ledger', 'check: white'])).toEqual({
      variant: 'white-check',
      insightId: 'ledger',
    })
  })

  it('resolves a red check paired with its insight', () => {
    expect(parseChoiceTags(['insight: ledger', 'check: red'])).toEqual({
      variant: 'red-check',
      insightId: 'ledger',
    })
  })

  it('locked takes precedence over check and insight tags on the same choice', () => {
    expect(parseChoiceTags(['insight: graft', 'check: red', 'locked: GRAFT 4 required'])).toEqual({
      variant: 'locked',
      insightId: 'graft',
      lockedReason: 'GRAFT 4 required',
    })
  })

  it('ignores an unrecognized insightId', () => {
    expect(parseChoiceTags(['insight: notARealInsight'])).toEqual({ variant: 'none' })
  })

  it('ignores an unrecognized check risk value', () => {
    expect(parseChoiceTags(['insight: ledger', 'check: purple'])).toEqual({
      variant: 'insight-gated',
      insightId: 'ledger',
    })
  })
})
