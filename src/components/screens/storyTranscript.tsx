// Shared dialogue/topic transcript rendering (UI_PASS_SPEC.md §4.4) —
// originally DialogueScreen-only, now also used by ConversationScreen so
// the two don't duplicate the per-line speaker rendering logic. The
// typewriter-reveal/scrollback-log bookkeeping itself lives in
// useTranscript.ts (kept separate so this file stays components-only —
// oxlint's react/only-export-components).
//
// Per-line speaker rendering follows the ink content-tagging convention
// (docs/GAME_GUIDE.md, Architecture §6): storyStore.currentLines carries a
// parsed LineSpeaker per line.

import { memo } from 'react'
import { useAudioStore } from '../../stores/audioStore'
import type { StoryLine } from '../../stores/storyStore'
import { NPCS } from '../../content/npcs'
import { INSIGHTS } from '../../content/insights'
import { CheckResultBlock, InsightChip } from '../ui'
import type { LogEntry } from './useTranscript'

/** Joiner between lines in one batch, matching how they'd read as separate paragraphs — must match useTranscript.ts's own LINE_JOINER, since revealLines() here slices the same joined offsets that hook computes lengths against. */
const LINE_JOINER = '\n\n'

/** Slices each line's text down to what `typedChars` has revealed so far, in reading order. */
function revealLines(lines: StoryLine[], typedChars: number): { line: StoryLine; text: string }[] {
  const revealed: { line: StoryLine; text: string }[] = []
  let offset = 0
  for (const line of lines) {
    const remaining = typedChars - offset
    if (remaining <= 0) break
    revealed.push({ line, text: line.text.slice(0, Math.min(remaining, line.text.length)) })
    offset += line.text.length + LINE_JOINER.length
  }
  return revealed
}

/** Splits raw ink text on "double-quoted" spans so spoken dialogue can render distinctly from the description around it — including narration mixed into the same tagged line as a speaker's dialogue (e.g. "she doesn't move from the doorway" alongside her actual quote). */
function splitDialogueSegments(text: string): { text: string; isQuote: boolean }[] {
  const segments: { text: string; isQuote: boolean }[] = []
  const quotePattern = /"[^"]*"/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = quotePattern.exec(text)) !== null) {
    if (match.index > lastIndex) segments.push({ text: text.slice(lastIndex, match.index), isQuote: false })
    segments.push({ text: match[0], isQuote: true })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex), isQuote: false })
  return segments
}

/** Renders quoted speech bright/bold and everything else (description) dimmer and italic, so dialogue reads as visibly someone speaking rather than blending into the surrounding prose. */
function DialogueText({ text, className }: { text: string; className: string }) {
  return (
    <p className={className}>
      {splitDialogueSegments(text).map((segment, i) =>
        segment.isQuote ? (
          <span key={i} className="font-semibold text-white">
            {segment.text}
          </span>
        ) : (
          <span key={i} className="italic text-white/55">
            {segment.text}
          </span>
        ),
      )}
    </p>
  )
}

/**
 * Audio glyph for a voiced line (docs/GAME_GUIDE.md §8): shows near the speaker's
 * name/portrait when the line carries a `# voice:` tag, doubles as a replay
 * control. Only ever rendered for the latest entry's tagged line.
 */
function VoiceGlyph() {
  const isVoicePlaying = useAudioStore((s) => s.isVoicePlaying)
  const replayVoice = useAudioStore((s) => s.replayVoice)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        replayVoice()
      }}
      title={isVoicePlaying ? 'Playing voice line' : 'Replay voice line'}
      className={`ml-2 inline-flex items-center font-display text-[10px] uppercase tracking-widest ${
        isVoicePlaying ? 'text-chrome-primary' : 'text-chrome-primary/50 hover:text-chrome-primary'
      }`}
    >
      {isVoicePlaying ? '♪' : '⟳'}
    </button>
  )
}

function StoryLineEntry({ line, text, showVoiceGlyph }: { line: StoryLine; text: string; showVoiceGlyph: boolean }) {
  if (text.length === 0) return null

  if (line.speaker.type === 'insight') {
    const insight = INSIGHTS[line.speaker.insightId]
    return (
      <div className="space-y-1">
        <span className="inline-flex items-center">
          <InsightChip name={insight.name} color={insight.color} glitchOnMount />
          {showVoiceGlyph && <VoiceGlyph />}
        </span>
        <p className="whitespace-pre-wrap pl-6 font-body text-[19px]" style={{ color: insight.color }}>
          {text}
        </p>
      </div>
    )
  }

  if (line.speaker.type === 'npc') {
    const npc = NPCS[line.speaker.npcId]
    return (
      <div className="space-y-1 border-l-2 border-chrome-primary/40 pl-3">
        <span className="font-display text-xs font-bold uppercase tracking-widest text-chrome-primary">
          {npc.name}
          {showVoiceGlyph && <VoiceGlyph />}
        </span>
        <DialogueText text={text} className="whitespace-pre-wrap font-body text-[19px]" />
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {showVoiceGlyph && <VoiceGlyph />}
      <DialogueText text={text} className="whitespace-pre-wrap font-body text-[19px]" />
    </div>
  )
}

export interface TranscriptLogProps {
  log: LogEntry[]
  latestEntry: LogEntry | null
  typedChars: number
  /** Shown as a trailing marker once the session is over — e.g. "— scene ended —". Omit while still active. */
  endedLabel?: string
}

/**
 * One transcript entry's rows, split out from `TranscriptLog` and wrapped in
 * `React.memo` (PERFORMANCE_PASS_SPEC.md §1) — the typewriter effect ticks
 * `typedChars` as fast as every 8ms, and without this, every already-typed
 * entry above the current one would re-run `revealLines`/
 * `splitDialogueSegments` on every tick for no reason. `TranscriptLog` only
 * ever passes a live `typedChars` value to the entry currently typing;
 * every other entry gets a fixed `0` so its props stay referentially equal
 * tick to tick and `memo` bails out.
 */
const LogEntryRow = memo(function LogEntryRow({ entry, isLatest, typedChars }: { entry: LogEntry; isLatest: boolean; typedChars: number }) {
  const revealed = isLatest ? revealLines(entry.lines, typedChars) : entry.lines.map((line) => ({ line, text: line.text }))
  return (
    <div className="space-y-2">
      {revealed.map((r, j) => (
        <StoryLineEntry key={j} line={r.line} text={r.text} showVoiceGlyph={isLatest && r.line.voice !== null} />
      ))}
      {entry.checkResult && <CheckResultBlock insightName="CHECK" result={entry.checkResult} />}
    </div>
  )
})

/** The scrollable entries themselves — callers own the surrounding Panel/scroll-container div (logRef/onScroll/onClick go there, not here). */
export function TranscriptLog({ log, latestEntry, typedChars, endedLabel }: TranscriptLogProps) {
  return (
    <>
      {log.map((entry) => {
        const isLatest = entry.id === latestEntry?.id
        return <LogEntryRow key={entry.id} entry={entry} isLatest={isLatest} typedChars={isLatest ? typedChars : 0} />
      })}
      {endedLabel && <p className="font-body text-xs uppercase tracking-widest text-white/40">{endedLabel}</p>}
    </>
  )
}
