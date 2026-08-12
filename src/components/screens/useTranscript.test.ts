// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTranscript } from './useTranscript'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAudioStore } from '../../stores/audioStore'
import type { StoryLine } from '../../stores/storyStore'

/** Stands in for HTMLAudioElement — this hook's log-append effect calls into audioStore, which otherwise touches real (unimplemented-in-jsdom) media playback. */
class FakeAudioElement {
  volume = 0
  loop = false
  play() {
    return Promise.resolve()
  }
  pause() {}
  addEventListener() {}
  removeEventListener() {}
}

function line(text: string): StoryLine {
  return {
    text,
    speaker: { type: 'narrator' },
    background: null,
    music: null,
    ambienceOps: { add: [], remove: [], clear: false },
    voice: null,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('Audio', FakeAudioElement)
  useSettingsStore.setState(useSettingsStore.getInitialState(), true)
  useAudioStore.setState(useAudioStore.getInitialState(), true)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('useTranscript', () => {
  it('appends each new currentLines batch as one transcript entry', () => {
    const { result, rerender } = renderHook(({ lines }: { lines: StoryLine[] }) => useTranscript('scene-1', lines, null), {
      initialProps: { lines: [line('First.')] },
    })
    expect(result.current.log).toHaveLength(1)

    rerender({ lines: [line('Second.')] })

    expect(result.current.log).toHaveLength(2)
    expect(result.current.log[1].lines[0].text).toBe('Second.')
  })

  it('clears the transcript when resetKey changes — a new scene/conversation starting', () => {
    const { result, rerender } = renderHook(
      ({ resetKey, lines }: { resetKey: unknown; lines: StoryLine[] }) => useTranscript(resetKey, lines, null),
      { initialProps: { resetKey: 'scene-1', lines: [line('First.')] } },
    )
    expect(result.current.log).toHaveLength(1)

    rerender({ resetKey: 'scene-2', lines: [] })

    expect(result.current.log).toHaveLength(0)
  })

  it('caps retained entries at maxEntries, dropping the oldest first (Conversation View)', () => {
    const { result, rerender } = renderHook(({ lines }: { lines: StoryLine[] }) => useTranscript('convo', lines, null, 2), {
      initialProps: { lines: [line('One.')] },
    })

    rerender({ lines: [line('Two.')] })
    rerender({ lines: [line('Three.')] })

    expect(result.current.log.map((e) => e.lines[0].text)).toEqual(['Two.', 'Three.'])
  })

  it('reveals the latest entry one character at a time at the configured text speed, gating isTypingDone until it finishes', async () => {
    // A stable array reference matters here: storyStore's real currentLines only
    // gets a new array identity when a new batch actually arrives, and the
    // hook's log-append effect relies on that (keyed on `[currentLines]`) — a
    // literal recreated inline on every render would re-trigger that effect
    // forever, unlike the real Zustand-selector callers this hook has.
    const lines = [line('Hi')]
    const { result } = renderHook(() => useTranscript('scene-1', lines, null))

    expect(result.current.typedChars).toBe(0)
    expect(result.current.isTypingDone).toBe(false)

    // 'normal' text speed, per TEXT_SPEED_MS. The *Async variant is required here —
    // a setState from inside a plain fake-timer callback doesn't get flushed by
    // React until the next microtask tick, which act(() => advanceTimersByTime())
    // never yields to.
    await act(() => vi.advanceTimersByTimeAsync(22))
    expect(result.current.typedChars).toBe(1)
    expect(result.current.isTypingDone).toBe(false)

    await act(() => vi.advanceTimersByTimeAsync(22))
    expect(result.current.typedChars).toBe(2)
    expect(result.current.isTypingDone).toBe(true)
  })

  it('handleSkip jumps straight to the full text without waiting out the reveal', () => {
    const lines = [line('Hello there')]
    const { result } = renderHook(() => useTranscript('scene-1', lines, null))

    act(() => result.current.handleSkip())

    expect(result.current.typedChars).toBe('Hello there'.length)
    expect(result.current.isTypingDone).toBe(true)
  })

  it('reveals a fresh entry from zero again, even mid-batch of a longer one', async () => {
    const { result, rerender } = renderHook(({ lines }: { lines: StoryLine[] }) => useTranscript('scene-1', lines, null), {
      initialProps: { lines: [line('First one.')] },
    })
    await act(() => vi.advanceTimersByTimeAsync(22))
    expect(result.current.typedChars).toBe(1)

    rerender({ lines: [line('Second, a completely different line.')] })

    expect(result.current.typedChars).toBe(0)
    expect(result.current.isTypingDone).toBe(false)
  })

  it('reveals the full entry immediately when Instant Text is on, rather than leaving isTypingDone stuck false', () => {
    useSettingsStore.getState().setInstantText(true)

    const lines = [line('Hi')]
    const { result } = renderHook(() => useTranscript('scene-1', lines, null))

    expect(result.current.typedChars).toBe('Hi'.length)
    expect(result.current.isTypingDone).toBe(true)
  })
})
