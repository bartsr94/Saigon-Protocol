import { describe, expect, it } from 'vitest'
import { parseChoiceTags, parseLineAmbience, parseLineBackground, parseLineMusic, parseLineSpeaker, parseLineVoice } from './contentTags'

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

describe('parseLineBackground', () => {
  it('returns null when there is no background tag', () => {
    expect(parseLineBackground(['speaker: npc:meiHong'])).toBeNull()
  })

  it('resolves a recognized background tag', () => {
    expect(parseLineBackground(['background: avelineLabExterior'])).toBe('avelineLabExterior')
  })

  it('falls back to null for an unrecognized backgroundId', () => {
    expect(parseLineBackground(['background: someoneNotInContent'])).toBeNull()
  })

  it('resolves independently of a speaker tag on the same line', () => {
    expect(parseLineBackground(['background: avelineLabExterior', 'speaker: npc:meiHong'])).toBe('avelineLabExterior')
  })
})

describe('parseLineMusic', () => {
  it('returns null when there is no music tag', () => {
    expect(parseLineMusic(['speaker: npc:meiHong'])).toBeNull()
  })

  it('resolves a recognized music tag', () => {
    expect(parseLineMusic(['music: introTheme'])).toBe('introTheme')
  })

  it('resolves the "none" sentinel as a real value, not a fallback', () => {
    expect(parseLineMusic(['music: none'])).toBe('none')
  })

  it('falls back to null for an unrecognized musicId', () => {
    expect(parseLineMusic(['music: someoneNotInContent'])).toBeNull()
  })
})

describe('parseLineAmbience', () => {
  it('returns an empty, non-clearing cue when there is no ambience tag', () => {
    expect(parseLineAmbience(['speaker: npc:meiHong'])).toEqual({ add: [], remove: [], clear: false })
  })

  it('resolves an add tag', () => {
    expect(parseLineAmbience(['ambience: +rain'])).toEqual({ add: ['rain'], remove: [], clear: false })
  })

  it('resolves a remove tag', () => {
    expect(parseLineAmbience(['ambience: -rain'])).toEqual({ add: [], remove: ['rain'], clear: false })
  })

  it('resolves a clear tag', () => {
    expect(parseLineAmbience(['ambience: clear'])).toEqual({ add: [], remove: [], clear: true })
  })

  it('collects every ambience tag on the line, not just the first', () => {
    expect(parseLineAmbience(['ambience: +rain', 'ambience: -marketChatter'])).toEqual({
      add: ['rain'],
      remove: ['marketChatter'],
      clear: false,
    })
  })

  it('ignores an unrecognized ambienceId', () => {
    expect(parseLineAmbience(['ambience: +someoneNotInContent'])).toEqual({ add: [], remove: [], clear: false })
  })

  it('ignores a value with no recognized sigil', () => {
    expect(parseLineAmbience(['ambience: rain'])).toEqual({ add: [], remove: [], clear: false })
  })
})

describe('parseLineVoice', () => {
  it('returns null when there is no voice tag', () => {
    expect(parseLineVoice(['speaker: npc:meiHong'])).toBeNull()
  })

  it('resolves a recognized voice tag', () => {
    expect(parseLineVoice(['voice: meiHongIntro'])).toBe('meiHongIntro')
  })

  it('falls back to null for an unrecognized voiceClipId', () => {
    expect(parseLineVoice(['voice: someoneNotInContent'])).toBeNull()
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
