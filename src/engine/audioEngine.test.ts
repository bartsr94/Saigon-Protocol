import { describe, expect, it } from 'vitest'
import { applyAmbienceCue, computeChannelVolume, nextMusicId, pickSfxSrc } from './audioEngine'
import type { AmbienceCue } from './contentTags'

const NO_OP_CUE: AmbienceCue = { add: [], remove: [], clear: false }

describe('nextMusicId', () => {
  it('keeps the current track when the cue is null', () => {
    expect(nextMusicId('introTheme', null)).toBe('introTheme')
  })

  it('switches to the cued track', () => {
    expect(nextMusicId('titleTheme', 'introTheme')).toBe('introTheme')
  })

  it('stays null when there is no current track and no cue', () => {
    expect(nextMusicId(null, null)).toBeNull()
  })
})

describe('applyAmbienceCue', () => {
  it('returns an equivalent set when the cue is a no-op', () => {
    const current = new Set<'rain'>(['rain'])
    expect(applyAmbienceCue(current, NO_OP_CUE)).toEqual(new Set(['rain']))
  })

  it('adds a layer', () => {
    expect(applyAmbienceCue(new Set(), { add: ['rain'], remove: [], clear: false })).toEqual(new Set(['rain']))
  })

  it('removes a layer', () => {
    expect(applyAmbienceCue(new Set(['rain', 'engineIdle']), { add: [], remove: ['rain'], clear: false })).toEqual(
      new Set(['engineIdle']),
    )
  })

  it('clears every layer before applying add/remove', () => {
    expect(applyAmbienceCue(new Set(['rain', 'engineIdle']), { add: ['marketChatter'], remove: [], clear: true })).toEqual(
      new Set(['marketChatter']),
    )
  })

  it('applies add and remove together, one line changing two layers at once', () => {
    expect(
      applyAmbienceCue(new Set(['marketChatter']), { add: ['rain'], remove: ['marketChatter'], clear: false }),
    ).toEqual(new Set(['rain']))
  })

  it('resolves a layer named in both add and remove on the same cue as added (remove applies first)', () => {
    expect(applyAmbienceCue(new Set(), { add: ['rain'], remove: ['rain'], clear: false })).toEqual(new Set(['rain']))
  })

  it('does not mutate the current set passed in', () => {
    const current: Set<'rain' | 'engineIdle'> = new Set(['rain'])
    applyAmbienceCue(current, { add: ['engineIdle'], remove: [], clear: false })
    expect(current).toEqual(new Set(['rain']))
  })
})

describe('computeChannelVolume', () => {
  it('multiplies master and channel percentages down to a 0-1 range', () => {
    expect(computeChannelVolume(100, 100)).toBe(1)
    expect(computeChannelVolume(50, 50)).toBe(0.25)
    expect(computeChannelVolume(0, 100)).toBe(0)
  })

  it('clamps to 0-1 even if given an out-of-range percentage', () => {
    expect(computeChannelVolume(150, 150)).toBe(1)
    expect(computeChannelVolume(-10, 50)).toBe(0)
  })

  it('returns 0 when muted, regardless of volume levels', () => {
    expect(computeChannelVolume(100, 100, true)).toBe(0)
  })
})

describe('pickSfxSrc', () => {
  const VARIANTS = ['/audio/sfx/confirm/ui-confirm-1.mp3', '/audio/sfx/confirm/ui-confirm-2.mp3', '/audio/sfx/confirm/ui-confirm-3.mp3']

  it('always returns the override when one is set, ignoring random entirely', () => {
    const alwaysLast = () => 0.999
    expect(pickSfxSrc('/audio/sfx/confirm/ui-confirm-6.mp3', VARIANTS, alwaysLast)).toBe('/audio/sfx/confirm/ui-confirm-6.mp3')
  })

  it('picks the first variant when random() returns 0', () => {
    expect(pickSfxSrc(undefined, VARIANTS, () => 0)).toBe(VARIANTS[0])
  })

  it('picks the last variant when random() returns just under 1', () => {
    expect(pickSfxSrc(undefined, VARIANTS, () => 0.999)).toBe(VARIANTS[2])
  })

  it('picks the middle variant for a mid-range random value', () => {
    expect(pickSfxSrc(undefined, VARIANTS, () => 0.5)).toBe(VARIANTS[1])
  })
})
