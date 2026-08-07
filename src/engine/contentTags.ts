// Parses ink content tags (`# key: value`) into the speaker/choice data
// DialogueScreen and the ChoiceRow/InsightChip primitives render (UI_DESIGN
// §4/§5). Pure and store-agnostic, same testable style as checkResolution.ts
// — never imports a Zustand store or a React component.
// See docs/INK_CONTENT_TAGGING_SPEC.md for the settled tag vocabulary.

import { INSIGHT_IDS, type InsightId } from '../content/insights'
import { NPC_IDS, type NpcId } from '../content/npcs'
import { BACKGROUND_IDS, type BackgroundId } from '../content/backgrounds'
import { MUSIC_IDS, type MusicId } from '../content/music'
import { AMBIENCE_IDS, type AmbienceId } from '../content/ambience'
import { VOICE_CLIP_IDS, type VoiceClipId } from '../content/voiceClips'

export type LineSpeaker =
  | { type: 'narrator' }
  | { type: 'npc'; npcId: NpcId }
  | { type: 'insight'; insightId: InsightId }

export type ChoiceTagVariant = 'none' | 'insight-gated' | 'white-check' | 'red-check' | 'locked'

export interface ChoiceTagInfo {
  variant: ChoiceTagVariant
  insightId?: InsightId
  lockedReason?: string
}

function isInsightId(value: string): value is InsightId {
  return (INSIGHT_IDS as string[]).includes(value)
}

function isNpcId(value: string): value is NpcId {
  return (NPC_IDS as string[]).includes(value)
}

function isBackgroundId(value: string): value is BackgroundId {
  return (BACKGROUND_IDS as string[]).includes(value)
}

function isMusicId(value: string): value is MusicId {
  return (MUSIC_IDS as string[]).includes(value)
}

function isAmbienceId(value: string): value is AmbienceId {
  return (AMBIENCE_IDS as string[]).includes(value)
}

function isVoiceClipId(value: string): value is VoiceClipId {
  return (VOICE_CLIP_IDS as string[]).includes(value)
}

/** Splits a raw ink tag string on its first `:`, trimming both sides. Returns null if there's no colon. */
function parseTag(raw: string): { key: string; value: string } | null {
  const colonIndex = raw.indexOf(':')
  if (colonIndex === -1) return null
  return { key: raw.slice(0, colonIndex).trim(), value: raw.slice(colonIndex + 1).trim() }
}

/**
 * Resolves a line's speaker from its raw ink tags. Absent or unrecognized
 * `speaker` tags (typo'd npcId/insightId, an NPC not yet in content/npcs.ts)
 * fall back to narrator rather than breaking the scene.
 */
export function parseLineSpeaker(tags: string[]): LineSpeaker {
  for (const raw of tags) {
    const parsed = parseTag(raw)
    if (!parsed || parsed.key !== 'speaker') continue

    const separatorIndex = parsed.value.indexOf(':')
    if (separatorIndex === -1) continue
    const kind = parsed.value.slice(0, separatorIndex).trim()
    const id = parsed.value.slice(separatorIndex + 1).trim()

    if (kind === 'npc' && isNpcId(id)) return { type: 'npc', npcId: id }
    if (kind === 'insight' && isInsightId(id)) return { type: 'insight', insightId: id }
  }
  return { type: 'narrator' }
}

/**
 * Resolves a line's background art from its raw ink tags, independent of
 * `speaker` — a line can carry both (e.g. an establishing line has no
 * speaker but sets the backdrop). Absent or unrecognized `background` tags
 * resolve to `null` rather than breaking the scene; the caller keeps
 * whatever backdrop was last set (DialogueScreen's `activeBackgroundId`).
 */
export function parseLineBackground(tags: string[]): BackgroundId | null {
  for (const raw of tags) {
    const parsed = parseTag(raw)
    if (parsed && parsed.key === 'background' && isBackgroundId(parsed.value)) return parsed.value
  }
  return null
}

/**
 * Resolves a line's music cue, same last-recognized-tag-wins convention as
 * `parseLineBackground` — the caller (storyStore) keeps whatever track was
 * last cued when a line carries no `music` tag. `'none'` is a real,
 * recognized `MusicId` (docs/AUDIO_VOICEOVER_SPEC.md's silence sentinel),
 * not a fallback value — an unrecognized id still resolves to `null`
 * ("no change"), not silence.
 */
export function parseLineMusic(tags: string[]): MusicId | null {
  for (const raw of tags) {
    const parsed = parseTag(raw)
    if (parsed && parsed.key === 'music' && isMusicId(parsed.value)) return parsed.value
  }
  return null
}

export interface AmbienceCue {
  add: AmbienceId[]
  remove: AmbienceId[]
  clear: boolean
}

/**
 * Resolves a line's ambience layer changes. Unlike `background`/`music`,
 * every `ambience` tag on the line is meaningful (not just the first) — a
 * single establishing line can add one layer and drop another at once, e.g.
 * `# ambience: +rain` `# ambience: -marketChatter`. Returns an always-present
 * object (empty/false) rather than null when the line carries no ambience
 * tag, since it describes a diff to apply, not a persistent value to track.
 */
export function parseLineAmbience(tags: string[]): AmbienceCue {
  const cue: AmbienceCue = { add: [], remove: [], clear: false }
  for (const raw of tags) {
    const parsed = parseTag(raw)
    if (!parsed || parsed.key !== 'ambience') continue

    if (parsed.value === 'clear') {
      cue.clear = true
      continue
    }
    const sigil = parsed.value[0]
    const id = parsed.value.slice(1)
    if (sigil === '+' && isAmbienceId(id)) cue.add.push(id)
    else if (sigil === '-' && isAmbienceId(id)) cue.remove.push(id)
  }
  return cue
}

/**
 * Resolves a line's voiced-clip id (UI_DESIGN §7's curated intros/greetings).
 * One-shot — unlike `background`/`music`, there's no "keep the last one"
 * persistence concept, so an absent/unrecognized tag simply means no clip
 * fires for this line.
 */
export function parseLineVoice(tags: string[]): VoiceClipId | null {
  for (const raw of tags) {
    const parsed = parseTag(raw)
    if (parsed && parsed.key === 'voice' && isVoiceClipId(parsed.value)) return parsed.value
  }
  return null
}

/**
 * Resolves a choice's mechanical tag from inkjs's `Choice.tags`. `locked`
 * takes precedence over `check`/`insight` (same choice can render locked or
 * not across a run depending on ink-side conditions); `check` (white/red)
 * takes precedence over a bare `insight` tag.
 */
export function parseChoiceTags(tags: string[] | null): ChoiceTagInfo {
  if (!tags || tags.length === 0) return { variant: 'none' }

  let insightId: InsightId | undefined
  let checkRisk: 'white' | 'red' | undefined
  let lockedReason: string | undefined

  for (const raw of tags) {
    const parsed = parseTag(raw)
    if (!parsed) continue
    if (parsed.key === 'insight' && isInsightId(parsed.value)) {
      insightId = parsed.value
    } else if (parsed.key === 'check' && (parsed.value === 'white' || parsed.value === 'red')) {
      checkRisk = parsed.value
    } else if (parsed.key === 'locked' && parsed.value.length > 0) {
      lockedReason = parsed.value
    }
  }

  if (lockedReason !== undefined) return { variant: 'locked', insightId, lockedReason }
  if (checkRisk === 'white') return { variant: 'white-check', insightId }
  if (checkRisk === 'red') return { variant: 'red-check', insightId }
  if (insightId !== undefined) return { variant: 'insight-gated', insightId }
  return { variant: 'none' }
}
