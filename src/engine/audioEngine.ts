// Pure decision logic for the Voiceover/Audio Layer (docs/AUDIO_VOICEOVER_SPEC.md):
// given the current audio state and a new cue, what should be playing next.
// No browser APIs — audioStore.ts owns the actual HTMLAudioElements and calls
// into these. Same pure/impure split as checkResolution.ts/storyEngine.ts.

import type { MusicId } from '../content/music'
import type { AmbienceId } from '../content/ambience'
import type { AmbienceCue } from './contentTags'
import type { RandomSource } from './checkResolution'

/** A line with no `music` tag (cue === null) leaves the current track playing. */
export function nextMusicId(current: MusicId | null, cue: MusicId | null): MusicId | null {
  return cue ?? current
}

/**
 * Applies one ambience diff to the current set of active layers.
 * `clear` (if set) empties the set first; `remove` is applied before `add`,
 * so a layer named in both ends up added — matches how the tag vocabulary
 * reads left-to-right (`# ambience: -rain # ambience: +rain` ends with rain
 * playing).
 */
export function applyAmbienceCue(current: ReadonlySet<AmbienceId>, cue: AmbienceCue): Set<AmbienceId> {
  const next = cue.clear ? new Set<AmbienceId>() : new Set(current)
  for (const id of cue.remove) next.delete(id)
  for (const id of cue.add) next.add(id)
  return next
}

/** (masterPct/100) * (channelPct/100), clamped to [0, 1]; 0 when muted. */
export function computeChannelVolume(masterPct: number, channelPct: number, muted = false): number {
  if (muted) return 0
  const raw = (masterPct / 100) * (channelPct / 100)
  return Math.min(1, Math.max(0, raw))
}

/**
 * Resolves which file audioStore.playSfx should play: a pinned override
 * (content/sfx.ts's SFX_ID_OVERRIDE) always wins; otherwise a random pick
 * from the category's variant pool, so the same interaction doesn't replay
 * the identical clip every time. Same injectable-RandomSource style as
 * checkResolution.ts's resolveCheck, for deterministic tests.
 */
export function pickSfxSrc(override: string | undefined, categoryVariants: string[], random: RandomSource = Math.random): string {
  if (override) return override
  return categoryVariants[Math.floor(random() * categoryVariants.length)]
}
