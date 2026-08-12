// Voiceover/Audio Layer (docs/GAME_GUIDE.md). Owns all browser
// audio I/O — plain HTMLAudioElements, no Web Audio API/third-party library.
// Mirrors saveStore.ts owning all localStorage I/O: a Zustand store with a
// thin reactive surface, backed by module-scoped (non-reactive) Audio
// element instances since they aren't serializable/reactive-friendly.
//
// No always-mounted React player component is needed — Zustand stores are
// module singletons outside the render tree, so these elements survive
// every screen swap in App.tsx (title<->chargen<->game, overworld<->dialogue).

import { create } from 'zustand'
import { MUSIC, type MusicId } from '../content/music'
import { AMBIENCE, type AmbienceId } from '../content/ambience'
import { VOICE_CLIPS, type VoiceClipId } from '../content/voiceClips'
import { SFX_CATEGORY_VARIANTS, SFX_ID_OVERRIDE, SFX_ID_TO_CATEGORY, type SfxId } from '../content/sfx'
import type { LocationDefinition } from '../content/locations'
import { applyAmbienceCue, computeChannelVolume, nextMusicId, pickSfxSrc } from '../engine/audioEngine'
import { useSettingsStore } from './settingsStore'
import type { StoryLine } from './storyStore'

const CROSSFADE_MS = 1500

interface AudioState {
  activeMusicId: MusicId | null
  activeAmbienceIds: AmbienceId[]
  currentVoiceClipId: VoiceClipId | null
  isVoicePlaying: boolean

  applyStoryLines: (lines: StoryLine[]) => void
  enterLocation: (def: LocationDefinition) => void
  enterOverworld: () => void
  playTitleMusic: () => void
  replayVoice: () => void
  playSfx: (id: SfxId) => void
}

/** Missing/failed-to-load assets are tolerated the same way PortraitFrame/background art already are — no asset exists yet, so this fires constantly by design. */
function makeAudio(src: string, loop: boolean): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null
  const el = new Audio(src)
  el.loop = loop
  el.addEventListener('error', () => {})
  return el
}

const FADE_STEP_MS = 50

/**
 * One in-flight fade interval per element (PERFORMANCE_PASS_SPEC.md §3) —
 * `applyStoryLines` runs on every line batch, so advancing dialogue faster
 * than CROSSFADE_MS is easy (instant text, a fast reader) and would
 * otherwise leave two intervals writing to the same element's `.volume`
 * concurrently. A WeakMap rather than a field on the element itself keeps
 * this bookkeeping local to fadeTo without touching HTMLAudioElement.
 */
const activeFades = new WeakMap<HTMLAudioElement, ReturnType<typeof setInterval>>()

/**
 * Ramps volume with setInterval, not requestAnimationFrame — rAF is tied to
 * the paint cycle and can be suspended indefinitely in a backgrounded/
 * unfocused tab (confirmed: it can simply never fire), which would silently
 * strand a fade at its starting volume. A plain timer keeps firing (browsers
 * throttle it in background tabs, they don't stop it), so the fade always
 * eventually completes regardless of tab visibility.
 */
function fadeTo(el: HTMLAudioElement | null, target: number, durationMs: number, onDone?: () => void): void {
  if (!el) {
    onDone?.()
    return
  }
  const existingFade = activeFades.get(el)
  if (existingFade !== undefined) clearInterval(existingFade)

  const start = el.volume
  const steps = Math.max(1, Math.round(durationMs / FADE_STEP_MS))
  let step = 0
  const interval = setInterval(() => {
    step++
    const t = Math.min(1, step / steps)
    el.volume = start + (target - start) * t
    if (t >= 1) {
      clearInterval(interval)
      activeFades.delete(el)
      onDone?.()
    }
  }, FADE_STEP_MS)
  activeFades.set(el, interval)
}

function getVolumes() {
  const s = useSettingsStore.getState()
  return {
    music: computeChannelVolume(s.masterVolume, s.musicVolume),
    sfx: computeChannelVolume(s.masterVolume, s.sfxVolume),
    voice: computeChannelVolume(s.masterVolume, s.voiceVolume, !s.voiceEnabled),
  }
}

// Two-slot pool so the outgoing track can keep fading out while a new one
// fades in, rather than cutting hard on every change.
let currentMusicEl: HTMLAudioElement | null = null
const ambienceEls = new Map<AmbienceId, HTMLAudioElement>()
let voiceEl: HTMLAudioElement | null = null

function crossfadeMusic(nextId: MusicId | null): void {
  const outgoing = currentMusicEl
  let incoming: HTMLAudioElement | null = null

  if (nextId && nextId !== 'none') {
    const src = MUSIC[nextId].src
    if (src) {
      incoming = makeAudio(src, true)
      if (incoming) {
        incoming.volume = 0
        void incoming.play().catch(() => {})
      }
    }
  }

  currentMusicEl = incoming
  fadeTo(incoming, getVolumes().music, CROSSFADE_MS)
  fadeTo(outgoing, 0, CROSSFADE_MS, () => outgoing?.pause())
}

function addAmbienceLayer(id: AmbienceId): void {
  if (ambienceEls.has(id)) return
  const el = makeAudio(AMBIENCE[id].src, true)
  if (!el) return
  ambienceEls.set(id, el)
  el.volume = 0
  void el.play().catch(() => {})
  fadeTo(el, getVolumes().sfx, CROSSFADE_MS)
}

function removeAmbienceLayer(id: AmbienceId): void {
  const el = ambienceEls.get(id)
  if (!el) return
  ambienceEls.delete(id)
  fadeTo(el, 0, CROSSFADE_MS, () => el.pause())
}

/** Diffs the new active-layer set against what's actually playing, adding/removing only what changed. */
function reconcileAmbience(nextIds: AmbienceId[], prevIds: AmbienceId[]): void {
  const next = new Set(nextIds)
  const prev = new Set(prevIds)
  for (const id of prev) if (!next.has(id)) removeAmbienceLayer(id)
  for (const id of next) if (!prev.has(id)) addAmbienceLayer(id)
}

function stopVoice(): void {
  voiceEl?.pause()
  voiceEl = null
}

function playVoiceClip(id: VoiceClipId, set: (partial: Partial<AudioState>) => void): void {
  stopVoice()
  const src = VOICE_CLIPS[id].src
  if (!src) {
    set({ currentVoiceClipId: null, isVoicePlaying: false })
    return
  }
  if (!useSettingsStore.getState().voiceEnabled) {
    set({ currentVoiceClipId: id, isVoicePlaying: false })
    return
  }
  const el = makeAudio(src, false)
  set({ currentVoiceClipId: id, isVoicePlaying: false })
  if (!el) return
  voiceEl = el
  el.volume = getVolumes().voice
  el.addEventListener('ended', () => set({ isVoicePlaying: false }))
  void el
    .play()
    .then(() => set({ isVoicePlaying: true }))
    .catch(() => set({ isVoicePlaying: false }))
}

export const useAudioStore = create<AudioState>((set, get) => ({
  activeMusicId: null,
  activeAmbienceIds: [],
  currentVoiceClipId: null,
  isVoicePlaying: false,

  applyStoryLines: (lines) => {
    const state = get()
    let musicId = state.activeMusicId
    let ambienceSet = new Set(state.activeAmbienceIds)
    let voiceToPlay: VoiceClipId | null = null

    for (const line of lines) {
      musicId = nextMusicId(musicId, line.music)
      ambienceSet = applyAmbienceCue(ambienceSet, line.ambienceOps)
      // Last voiced line in the batch wins — same "most recent tag shown" convention DialogueScreen already uses for the NPC portrait/backdrop.
      if (line.voice) voiceToPlay = line.voice
    }

    if (musicId !== state.activeMusicId) crossfadeMusic(musicId)
    const nextAmbienceIds = [...ambienceSet].sort()
    reconcileAmbience(nextAmbienceIds, state.activeAmbienceIds)
    set({ activeMusicId: musicId, activeAmbienceIds: nextAmbienceIds })

    // Advancing past a line always interrupts whatever voice clip was playing (docs/GAME_GUIDE.md §8) — reading pace wins, regardless of whether the new batch cues a fresh one.
    stopVoice()
    set({ isVoicePlaying: false })
    if (voiceToPlay) playVoiceClip(voiceToPlay, set)
    else set({ currentVoiceClipId: null })
  },

  enterLocation: (def) => {
    if (def.musicId !== undefined && def.musicId !== get().activeMusicId) {
      crossfadeMusic(def.musicId)
      set({ activeMusicId: def.musicId })
    }
    if (def.ambienceIds !== undefined) {
      const nextIds = [...def.ambienceIds].sort()
      reconcileAmbience(nextIds, get().activeAmbienceIds)
      set({ activeAmbienceIds: nextIds })
    }
  },

  enterOverworld: () => {
    crossfadeMusic(null)
    reconcileAmbience([], get().activeAmbienceIds)
    stopVoice()
    set({ activeMusicId: null, activeAmbienceIds: [], currentVoiceClipId: null, isVoicePlaying: false })
  },

  /** Title/Boot and Character Creation (docs/GAME_GUIDE.md §2) — idempotent, so navigating between the two doesn't restart the track. */
  playTitleMusic: () => {
    if (get().activeMusicId === 'titleTheme') return
    crossfadeMusic('titleTheme')
    set({ activeMusicId: 'titleTheme' })
  },

  replayVoice: () => {
    const id = get().currentVoiceClipId
    if (id) playVoiceClip(id, set)
  },

  /**
   * One-shot UI feedback (button clicks, choice selects, etc.) — a fresh
   * element per call, not pooled/reused like music or ambience, so rapid
   * repeated triggers (e.g. hovering several buttons quickly) can overlap
   * instead of cutting each other off. Uses SFX_ID_OVERRIDE's pinned file
   * when one's set for this id; otherwise picks a random variant from the
   * id's category pool (content/sfx.ts) so the same interaction doesn't
   * play the identical clip every time. Mixes into the sfx channel, same as
   * ambience layers.
   */
  playSfx: (id) => {
    const src = pickSfxSrc(SFX_ID_OVERRIDE[id], SFX_CATEGORY_VARIANTS[SFX_ID_TO_CATEGORY[id]])
    const el = makeAudio(src, false)
    if (!el) return
    el.volume = getVolumes().sfx
    void el.play().catch(() => {})
  },
}))

// Live volume/mute resync, same pattern storyStore.loadStory uses for
// insightStore — takes effect on whatever's playing immediately.
useSettingsStore.subscribe((state, prevState) => {
  const volumes = getVolumes()
  if (currentMusicEl) currentMusicEl.volume = volumes.music
  for (const el of ambienceEls.values()) el.volume = volumes.sfx
  if (voiceEl) voiceEl.volume = volumes.voice

  if (prevState.voiceEnabled && !state.voiceEnabled) {
    voiceEl?.pause()
    useAudioStore.setState({ isVoicePlaying: false })
  }
})

// Browsers block unmuted audio autoplay before the page has any user
// interaction (e.g. the title theme, which starts playing on load with no
// prior click) — that first play() rejects and is swallowed by the same
// catch every other playback call uses. Retry once on the page's first
// interaction, for whatever's still paused at that point.
if (typeof document !== 'undefined') {
  const resumeBlockedPlayback = () => {
    if (currentMusicEl?.paused) void currentMusicEl.play().catch(() => {})
    for (const el of ambienceEls.values()) if (el.paused) void el.play().catch(() => {})
    document.removeEventListener('pointerdown', resumeBlockedPlayback)
    document.removeEventListener('keydown', resumeBlockedPlayback)
  }
  document.addEventListener('pointerdown', resumeBlockedPlayback, { once: true })
  document.addEventListener('keydown', resumeBlockedPlayback, { once: true })
}
