import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAudioStore } from './audioStore'
import { useSettingsStore } from './settingsStore'
import { computeChannelVolume } from '../engine/audioEngine'
import { MUSIC } from '../content/music'
import { AMBIENCE } from '../content/ambience'
import type { LocationDefinition } from '../content/locations'
import type { StoryLine } from './storyStore'
import type { AmbienceCue } from '../engine/contentTags'

const NO_OP_CUE: AmbienceCue = { add: [], remove: [], clear: false }

const BASE_LOCATION: LocationDefinition = {
  id: 'checkpoint',
  districtId: 'district4',
  name: 'Test Location',
  blurb: '',
  unlockedByDefault: true,
}

/** Stands in for HTMLAudioElement — jsdom doesn't implement real playback, so audioStore's own `Audio` calls are pointed at this instead. Every instance is tracked so tests can inspect volume/pause state after the store creates one internally. */
class FakeAudioElement {
  static instances: FakeAudioElement[] = []
  volume = 0
  loop = false
  paused = true
  src: string

  constructor(src: string) {
    this.src = src
    FakeAudioElement.instances.push(this)
  }
  play() {
    this.paused = false
    return Promise.resolve()
  }
  pause() {
    this.paused = true
  }
  addEventListener() {}
  removeEventListener() {}
}

function instanceFor(src: string | null): FakeAudioElement | undefined {
  return FakeAudioElement.instances.find((el) => el.src === src)
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('Audio', FakeAudioElement)
  // audioStore intentionally keeps its live HTMLAudioElement references
  // (currentMusicEl/ambienceEls/voiceEl) as module-private state outside the
  // Zustand store itself (see the file's own header comment) — resetting
  // just the store's reactive fields would leave the previous test's actual
  // elements/fade timers behind. Routing through the real enterOverworld()
  // action, then flushing its cleanup fades, gives every test a true clean
  // slate the same way a player returning to the Overworld would get one.
  useAudioStore.getState().enterOverworld()
  vi.advanceTimersByTime(2000)
  FakeAudioElement.instances = []
  useSettingsStore.setState(useSettingsStore.getInitialState(), true)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('audioStore', () => {
  it('cancels an in-flight fade on the same element instead of stacking a second interval on it', () => {
    // Regression test for the overlapping-fade bug fixed alongside today's
    // grid-movement/transcript perf pass: advancing dialogue faster than
    // CROSSFADE_MS used to leave two setInterval timers writing `.volume` on
    // the same outgoing HTMLAudioElement.
    useAudioStore.getState().enterLocation({ ...BASE_LOCATION, musicId: 'titleTheme' })
    // Nothing was playing before, so this is just the incoming fade-in.
    expect(vi.getTimerCount()).toBe(1)

    // Crossfade again before the first fade-in has had a chance to finish —
    // the outgoing (titleTheme) element already has an in-flight fade-in
    // interval when its fade-out starts.
    useAudioStore.getState().enterLocation({ ...BASE_LOCATION, musicId: 'introTheme' })

    // Without the fix this would be 3: the stale titleTheme fade-in, plus
    // its new fade-out, plus introTheme's fade-in. The fix cancels the
    // stale one before starting the new one on the same element.
    expect(vi.getTimerCount()).toBe(2)
  })

  it('crossfades to a new track and settles at the configured channel volume', () => {
    useAudioStore.getState().enterLocation({ ...BASE_LOCATION, musicId: 'titleTheme' })
    vi.advanceTimersByTime(2000)

    const el = instanceFor(MUSIC.titleTheme.src)
    expect(el).toBeDefined()
    expect(el!.paused).toBe(false)
    expect(el!.volume).toBeCloseTo(computeChannelVolume(useSettingsStore.getState().masterVolume, useSettingsStore.getState().musicVolume))
    expect(useAudioStore.getState().activeMusicId).toBe('titleTheme')
  })

  it('enterLocation adds new ambience layers and fades out (and pauses) ones no longer active, leaving untouched layers alone', () => {
    useAudioStore.getState().enterLocation({ ...BASE_LOCATION, ambienceIds: ['rain', 'engineIdle'] })
    vi.advanceTimersByTime(2000)
    expect(useAudioStore.getState().activeAmbienceIds).toEqual(['engineIdle', 'rain'])

    const rainEl = instanceFor(AMBIENCE.rain.src)
    const engineEl = instanceFor(AMBIENCE.engineIdle.src)
    expect(rainEl!.paused).toBe(false)
    expect(engineEl!.paused).toBe(false)
    const rainVolumeBeforeReconcile = rainEl!.volume

    useAudioStore.getState().enterLocation({ ...BASE_LOCATION, ambienceIds: ['rain'] })
    vi.advanceTimersByTime(2000)

    expect(useAudioStore.getState().activeAmbienceIds).toEqual(['rain'])
    expect(engineEl!.paused).toBe(true)
    // rain wasn't part of the diff, so it's never re-faded or re-touched.
    expect(rainEl!.paused).toBe(false)
    expect(rainEl!.volume).toBe(rainVolumeBeforeReconcile)
  })

  it('tolerates a voice clip whose asset has not been authored yet, same fallback convention as missing art', () => {
    const line: StoryLine = {
      text: 'Mei Hong looks up.',
      speaker: { type: 'narrator' },
      background: null,
      music: null,
      ambienceOps: NO_OP_CUE,
      voice: 'meiHongIntro',
    }

    useAudioStore.getState().applyStoryLines([line])

    expect(useAudioStore.getState().currentVoiceClipId).toBeNull()
    expect(useAudioStore.getState().isVoicePlaying).toBe(false)
  })

  it('enterOverworld stops music, clears ambience, and stops any playing voice', () => {
    useAudioStore.getState().enterLocation({ ...BASE_LOCATION, musicId: 'titleTheme', ambienceIds: ['rain'] })
    vi.advanceTimersByTime(2000)

    useAudioStore.getState().enterOverworld()
    vi.advanceTimersByTime(2000)

    expect(useAudioStore.getState().activeMusicId).toBeNull()
    expect(useAudioStore.getState().activeAmbienceIds).toEqual([])
    expect(useAudioStore.getState().currentVoiceClipId).toBeNull()
    expect(useAudioStore.getState().isVoicePlaying).toBe(false)
    expect(instanceFor(MUSIC.titleTheme.src)!.paused).toBe(true)
    expect(instanceFor(AMBIENCE.rain.src)!.paused).toBe(true)
  })
})
