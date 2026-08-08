// Dialogue/Scene (docs/GAME_GUIDE.md §2.1) — the core loop. 75/25 layout per
// docs/GAME_GUIDE.md §2.1: left-edge nav rail + center stage occupy the
// left three-quarters, the scrolling dialogue log/choices/check-result
// panel is the right quarter.
//
// storyStore only ever exposes "the lines since the last choice," not a
// full transcript (Architecture §6) — the scrollback log below is this
// screen's own bookkeeping, appending each new batch as it arrives. A
// persistent transcript belongs in storyStore itself if another screen
// ever needs it too; this is a presentational accumulation, not new
// simulation state.
//
// Per-line speaker rendering and per-choice mechanical tags follow the ink
// content-tagging convention (docs/GAME_GUIDE.md, Architecture
// §6): storyStore.currentLines carries a parsed LineSpeaker per line, and
// each choice's raw inkjs tags are parsed here via parseChoiceTags.

import { useEffect, useRef, useState } from 'react'
import { useInsightStore } from '../../stores/insightStore'
import { useStoryStore, type StoryLine } from '../../stores/storyStore'
import { useNavigationStore } from '../../stores/navigationStore'
import { useSaveStore } from '../../stores/saveStore'
import { useAudioStore } from '../../stores/audioStore'
import { useGameplayStore } from '../../stores/gameplayStore'
import { useSettingsStore, TEXT_SPEED_MS } from '../../stores/settingsStore'
import { useUiStore } from '../../stores/uiStore'
import { LOCATIONS } from '../../content/locations'
import { ARCHETYPES } from '../../content/archetypes'
import { NPCS, type NpcId } from '../../content/npcs'
import { BACKGROUNDS, type BackgroundId } from '../../content/backgrounds'
import { INSIGHTS } from '../../content/insights'
import { parseChoiceTags } from '../../engine/contentTags'
import type { CheckResult } from '../../engine/checkResolution'
import { CheckResultBlock, ChoiceRow, CyberButton, InsightChip, Panel, PipTrack, PortraitFrame } from '../ui'
import { enterLocationHub } from './enterLocationHub'
import { NavRail } from './NavRail'

interface LogEntry {
  id: number
  lines: StoryLine[]
  checkResult: CheckResult | null
}

/** Joiner between lines in one batch, matching how they'd read as separate paragraphs. */
const LINE_JOINER = '\n\n'

function fullBatchText(lines: StoryLine[]): string {
  return lines.map((l) => l.text).join(LINE_JOINER)
}

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

export function DialogueScreen() {
  const archetype = useInsightStore((s) => s.archetype)
  const vitality = useInsightStore((s) => s.vitality)
  const composure = useInsightStore((s) => s.composure)

  const storyInstance = useStoryStore((s) => s.story)
  const activeStoryId = useStoryStore((s) => s.activeStoryId)
  const currentLines = useStoryStore((s) => s.currentLines)
  const currentChoices = useStoryStore((s) => s.currentChoices)
  const ended = useStoryStore((s) => s.ended)
  const lastCheckResult = useStoryStore((s) => s.lastCheckResult)
  const choose = useStoryStore((s) => s.choose)
  const resetStory = useStoryStore((s) => s.reset)

  const selectedLocationId = useNavigationStore((s) => s.selectedLocationId)
  const returnToOverworld = useNavigationStore((s) => s.returnToOverworld)
  const unlockLocation = useNavigationStore((s) => s.unlockLocation)
  const currentHubId = useGameplayStore((s) => s.currentHubId)
  const leaveHub = useGameplayStore((s) => s.leaveHub)

  const openOverlay = useUiStore((s) => s.openOverlay)
  const textSpeed = useSettingsStore((s) => s.textSpeed)
  const instantText = useSettingsStore((s) => s.instantText)

  const [log, setLog] = useState<LogEntry[]>([])
  const nextId = useRef(0)
  const logRef = useRef<HTMLDivElement>(null)
  const [activeNpcId, setActiveNpcId] = useState<NpcId | null>(null)
  const [activeBackgroundId, setActiveBackgroundId] = useState<BackgroundId | null>(null)
  // Missing/not-yet-authored backdrop art degrades to no backdrop rather
  // than a broken-image icon (same tolerance PortraitFrame already has).
  const [backgroundLoadFailed, setBackgroundLoadFailed] = useState(false)
  // Same tolerance for the center-stage NPC portrait — a failed/missing
  // load degrades to just the name label rather than a raw broken-image icon.
  const [npcPortraitLoadFailed, setNpcPortraitLoadFailed] = useState(false)
  // The log's scrollbar stays invisible while pinned to the live edge, and
  // only appears once the reader has actually scrolled up to see older
  // lines (auto-scroll-to-bottom below keeps this false during normal play).
  const [isScrolling, setIsScrolling] = useState(false)

  // A new Story instance means a new scene — start the transcript and center stage over.
  useEffect(() => {
    setLog([])
    nextId.current = 0
    setActiveNpcId(null)
    setActiveBackgroundId(null)
  }, [storyInstance])

  // Every advance() call replaces currentLines with a fresh batch; append it
  // as one transcript entry, carrying whatever check fired during that pass,
  // and follow the center-stage portrait/backdrop to the batch's last NPC
  // speaker / background tag — either can be absent from a given batch, in
  // which case whatever was last shown stays put.
  useEffect(() => {
    if (currentLines.length === 0) return
    const entry: LogEntry = { id: nextId.current++, lines: currentLines, checkResult: lastCheckResult }
    setLog((prev) => [...prev, entry])
    useAudioStore.getState().applyStoryLines(currentLines)
    const npcLines = currentLines.filter((l): l is StoryLine & { speaker: { type: 'npc'; npcId: NpcId } } => l.speaker.type === 'npc')
    if (npcLines.length > 0) {
      setActiveNpcId(npcLines[npcLines.length - 1].speaker.npcId)
      setNpcPortraitLoadFailed(false)
    }
    const backgroundLines = currentLines.filter((l) => l.background !== null)
    if (backgroundLines.length > 0) {
      setActiveBackgroundId(backgroundLines[backgroundLines.length - 1].background)
      setBackgroundLoadFailed(false)
    }
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

  function finalizeEndedScene() {
    if (selectedLocationId && ended) {
      for (const unlockedId of LOCATIONS[selectedLocationId].unlocksOnComplete ?? []) {
        unlockLocation(unlockedId)
      }
    }
  }

  function handleReturnToHub() {
    finalizeEndedScene()
    resetStory()
    if (currentHubId && LOCATIONS[currentHubId]) {
      useAudioStore.getState().enterLocation(LOCATIONS[currentHubId])
    }
    useSaveStore.getState().autosave()
  }

  function handleReturnToOverworld() {
    finalizeEndedScene()
    const wasIntro = activeStoryId === 'intro'
    resetStory()
    if (wasIntro) {
      // The intro's squad-car montage ends at Aveline Lab
      // (docs/CASE_1_LOCATION_MATRIX.md: "player arrives from the intro") —
      // spawn straight into the checkpoint Hub rather than the general
      // Overworld map. currentDistrictId is set first so "Map"/exiting the
      // Lab returns to the District 4 street it belongs to, not all the way
      // out to the Overworld. enterLocationHub() handles its own autosave.
      useGameplayStore.getState().enterDistrictStreet('district4')
      enterLocationHub('checkpoint')
      return
    }
    returnToOverworld()
    leaveHub()
    // Leaving a scene gets the Overworld hub's own mood back (docs/GAME_GUIDE.md).
    useAudioStore.getState().enterOverworld()
    // Autosave checkpoint (Save/Persistence Layer): capture the "back on
    // the Overworld, no active scene" state.
    useSaveStore.getState().autosave()
  }

  if (!archetype || !storyInstance) return null

  const locationName = selectedLocationId ? LOCATIONS[selectedLocationId].name : 'Scene'

  return (
    <div className="flex h-svh w-full">
      <NavRail
        className="shrink-0 p-4"
        onChar={() => openOverlay('character')}
        onMap={currentHubId ? handleReturnToHub : handleReturnToOverworld}
        onCase={() => openOverlay('casefile')}
        onMenu={() => openOverlay('settings')}
      />

      {/* Left three-quarters: player status + center stage */}
      <div className="relative flex-1 overflow-hidden">
        {/*
          Backdrop art (docs/GAME_GUIDE.md §2.1: "Location establishing art can also
          render here when no character is present"), tracked from the most
          recent `# background: <id>` line tag — same persistence pattern as
          the NPC portrait below. Dimmed so HUD/portrait/text stay legible.
        */}
        {activeBackgroundId && BACKGROUNDS[activeBackgroundId].imageSrc && !backgroundLoadFailed && (
          <>
            <img
              src={BACKGROUNDS[activeBackgroundId].imageSrc}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setBackgroundLoadFailed(true)}
            />
            <div className="absolute inset-0 bg-black/50" />
          </>
        )}

        <div className="absolute left-4 top-4 z-10 flex items-start gap-3">
          <PortraitFrame
            src={ARCHETYPES[archetype].portraitSrc}
            alt={ARCHETYPES[archetype].name}
            fallbackText={ARCHETYPES[archetype].name.replace('The ', '').slice(0, 2).toUpperCase()}
            size="sm"
          />
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="font-display text-sm font-bold uppercase tracking-widest text-white">{ARCHETYPES[archetype].name}</span>
            <PipTrack current={vitality.current} max={vitality.max} color="var(--color-vitality)" />
            <PipTrack current={composure.current} max={composure.max} color="var(--color-composure)" />
          </div>
        </div>

        {/*
          Center stage (docs/GAME_GUIDE.md §2.1): the active NPC's portrait, tracked
          from the most recent `# speaker: npc:<id>` line tag. No character
          art shows until a scene actually names one, per §3's "location
          establishing art can render here when no character is present."
        */}
        <div className="flex h-full flex-col items-center justify-end gap-3">
          {activeNpcId && !npcPortraitLoadFailed && (
            <div
              className="relative h-[840px] w-[600px] max-h-[90%] translate-x-[100px] overflow-hidden bg-black/40"
              style={{
                clipPath: 'polygon(28px 0, 100% 0, 100% calc(100% - 28px), calc(100% - 28px) 100%, 0 100%, 0 28px)',
                border: '2px solid color-mix(in srgb, var(--color-chrome-primary) 50%, transparent)',
                boxShadow:
                  '0 0 30px color-mix(in srgb, var(--color-chrome-primary) 20%, transparent), inset 0 0 40px color-mix(in srgb, var(--color-chrome-primary) 10%, transparent)',
              }}
            >
              <img
                src={NPCS[activeNpcId].portraitSrc}
                alt={NPCS[activeNpcId].name}
                className="h-full w-full object-cover"
                onError={() => setNpcPortraitLoadFailed(true)}
              />
            </div>
          )}
          <span className="font-display text-xs uppercase tracking-widest text-white/40">
            {activeNpcId ? NPCS[activeNpcId].name : locationName}
          </span>
        </div>
      </div>

      {/* Right quarter: dialogue panel — floating box, inset from the screen edges */}
      <Panel size="lg" className="mt-[10px] mr-[10px] mb-[50px] flex w-[28%] min-w-[380px] shrink-0 flex-col gap-3 p-4" onClick={handleSkip}>
        <div
          ref={logRef}
          onScroll={handleLogScroll}
          className={`auto-hide-scrollbar flex-1 space-y-3 overflow-y-auto pr-1 ${isScrolling ? 'is-scrolling' : ''}`}
        >
          {log.map((entry, i) => {
            const isLatest = i === log.length - 1
            const revealed = isLatest ? revealLines(entry.lines, typedChars) : entry.lines.map((line) => ({ line, text: line.text }))
            return (
              <div key={entry.id} className="space-y-2">
                {revealed.map((r, j) => (
                  <StoryLineEntry key={j} line={r.line} text={r.text} showVoiceGlyph={isLatest && r.line.voice !== null} />
                ))}
                {entry.checkResult && <CheckResultBlock insightName="CHECK" result={entry.checkResult} />}
              </div>
            )
          })}
          {ended && <p className="font-body text-xs uppercase tracking-widest text-white/40">— scene ended —</p>}
        </div>

        {currentChoices.length > 0 && (!latestEntry || typedChars >= latestEntryText.length) && (
          <div className="flex flex-col divide-y divide-white/10 border-t border-white/10 pt-1" onClick={(e) => e.stopPropagation()}>
            {currentChoices.map((choice) => {
              const tagInfo = parseChoiceTags(choice.tags)
              const insight = tagInfo.insightId ? INSIGHTS[tagInfo.insightId] : null
              return (
                <ChoiceRow
                  key={choice.index}
                  onClick={() => choose(choice.index)}
                  tagVariant={tagInfo.variant}
                  tagLabel={tagInfo.variant === 'locked' ? tagInfo.lockedReason : insight?.name}
                  insightColor={insight?.color}
                >
                  {choice.text}
                </ChoiceRow>
              )
            })}
          </div>
        )}

        {ended && (!latestEntry || typedChars >= latestEntryText.length) && (
          <div className="border-t border-white/10 pt-3" onClick={(e) => e.stopPropagation()}>
            <CyberButton onClick={currentHubId ? handleReturnToHub : handleReturnToOverworld}>
              {currentHubId ? 'Continue Investigation' : 'Return to Map'}
            </CyberButton>
          </div>
        )}
      </Panel>
    </div>
  )
}
