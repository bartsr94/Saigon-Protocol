// Transcript accumulation/typewriter-reveal bookkeeping shared by
// DialogueScreen and ConversationScreen (UI_PASS_SPEC.md §4.4) — split out
// from storyTranscript.tsx's rendering pieces so that file can stay
// components-only (oxlint's react/only-export-components).
//
// storyStore only ever exposes "the lines since the last choice," not a
// full transcript (Architecture §6) — this hook is each screen's own
// bookkeeping, appending each new batch as it arrives. A persistent
// transcript belongs in storyStore itself if a third screen ever needs it
// too; this is a presentational accumulation, not new simulation state.

import { type RefObject, useEffect, useRef, useState } from 'react'
import { useAudioStore } from '../../stores/audioStore'
import type { StoryLine } from '../../stores/storyStore'
import { useSettingsStore, TEXT_SPEED_MS } from '../../stores/settingsStore'
import type { CheckResult } from '../../engine/checkResolution'

export interface LogEntry {
  id: number
  lines: StoryLine[]
  checkResult: CheckResult | null
}

/** Joiner between lines in one batch, matching how they'd read as separate paragraphs. */
const LINE_JOINER = '\n\n'

function fullBatchText(lines: StoryLine[]): string {
  return lines.map((l) => l.text).join(LINE_JOINER)
}

export interface UseTranscriptResult {
  log: LogEntry[]
  latestEntry: LogEntry | null
  latestEntryText: string
  typedChars: number
  /** True once the latest entry has fully typed out (or there's nothing typing) — gates showing choices/topics. */
  isTypingDone: boolean
  logRef: RefObject<HTMLDivElement | null>
  isScrolling: boolean
  handleLogScroll: () => void
  /** Click-to-skip the typewriter reveal for the latest entry. */
  handleSkip: () => void
}

/**
 * `resetKey` — e.g. a Story instance or NPC id — clears the transcript when
 * it changes (a new scene/conversation started). `maxEntries` (optional,
 * unbounded by default) caps how many entries `log` retains, oldest first —
 * needed by Conversation View, whose ink Story stays parked on the same
 * `resetKey` for as long as the player keeps browsing topics, so `log`
 * would otherwise grow for the entire session (PERFORMANCE_PASS_SPEC.md
 * §1). A single scene in `DialogueScreen` never runs long enough to need
 * this, so its call site omits the param.
 */
export function useTranscript(
  resetKey: unknown,
  currentLines: StoryLine[],
  lastCheckResult: CheckResult | null,
  maxEntries?: number,
): UseTranscriptResult {
  const [log, setLog] = useState<LogEntry[]>([])
  const nextId = useRef(0)
  const logRef = useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const textSpeed = useSettingsStore((s) => s.textSpeed)
  const instantText = useSettingsStore((s) => s.instantText)

  useEffect(() => {
    setLog([])
    nextId.current = 0
  }, [resetKey])

  // Every advance()/choose() call replaces currentLines with a fresh batch;
  // append it as one transcript entry, carrying whatever check fired during
  // that pass.
  useEffect(() => {
    if (currentLines.length === 0) return
    const entry: LogEntry = { id: nextId.current++, lines: currentLines, checkResult: lastCheckResult }
    setLog((prev) => {
      const next = [...prev, entry]
      return maxEntries !== undefined ? next.slice(-maxEntries) : next
    })
    useAudioStore.getState().applyStoryLines(currentLines)
    // currentLines is the real per-turn trigger; lastCheckResult only ever
    // changes in the same synchronous batch as currentLines (see storyStore).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLines])

  const latestEntry = log[log.length - 1] ?? null
  const latestEntryText = latestEntry ? fullBatchText(latestEntry.lines) : ''
  const [typedChars, setTypedChars] = useState(0)

  useEffect(() => {
    setTypedChars(0)
  }, [latestEntry?.id])

  useEffect(() => {
    if (!latestEntry || instantText || typedChars >= latestEntryText.length) return
    const timeout = setTimeout(() => setTypedChars((c) => c + 1), TEXT_SPEED_MS[textSpeed])
    return () => clearTimeout(timeout)
  }, [typedChars, latestEntry, latestEntryText, instantText, textSpeed])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [log, typedChars])

  function handleSkip() {
    if (latestEntry && typedChars < latestEntryText.length) setTypedChars(latestEntryText.length)
  }

  function handleLogScroll() {
    const el = logRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 4
    setIsScrolling(!atBottom)
  }

  return {
    log,
    latestEntry,
    latestEntryText,
    typedChars,
    isTypingDone: !latestEntry || typedChars >= latestEntryText.length,
    logRef,
    isScrolling,
    handleLogScroll,
    handleSkip,
  }
}
