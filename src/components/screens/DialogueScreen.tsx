// Dialogue/Scene (UI_DESIGN §3) — the core loop. 75/25 layout per
// UI_VISUAL_STYLE_SPEC §5: left-edge nav rail + center stage occupy the
// left three-quarters, the scrolling dialogue log/choices/check-result
// panel is the right quarter.
//
// storyStore only ever exposes "the lines since the last choice," not a
// full transcript (Architecture §3) — the scrollback log below is this
// screen's own bookkeeping, appending each new batch as it arrives. A
// persistent transcript belongs in storyStore itself if another screen
// ever needs it too; this is a presentational accumulation, not new
// simulation state.
//
// Per-line speaker rendering and per-choice mechanical tags follow the ink
// content-tagging convention (docs/INK_CONTENT_TAGGING_SPEC.md, Architecture
// §6): storyStore.currentLines carries a parsed LineSpeaker per line, and
// each choice's raw inkjs tags are parsed here via parseChoiceTags.

import { useEffect, useRef, useState } from 'react'
import { useInsightStore } from '../../stores/insightStore'
import { useStoryStore, type StoryLine } from '../../stores/storyStore'
import { useNavigationStore } from '../../stores/navigationStore'
import { useSettingsStore, TEXT_SPEED_MS } from '../../stores/settingsStore'
import { useUiStore } from '../../stores/uiStore'
import { LOCATIONS } from '../../content/locations'
import { ARCHETYPES } from '../../content/archetypes'
import { NPCS, type NpcId } from '../../content/npcs'
import { INSIGHTS } from '../../content/insights'
import { parseChoiceTags } from '../../engine/contentTags'
import type { CheckResult } from '../../engine/checkResolution'
import { CheckResultBlock, ChoiceRow, InsightChip, Panel, PipTrack, PortraitFrame } from '../ui'
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

function StoryLineEntry({ line, text }: { line: StoryLine; text: string }) {
  if (text.length === 0) return null

  if (line.speaker.type === 'insight') {
    const insight = INSIGHTS[line.speaker.insightId]
    return (
      <div className="space-y-1">
        <InsightChip name={insight.name} color={insight.color} glitchOnMount />
        <p className="whitespace-pre-wrap pl-6 font-body text-base text-white/90">{text}</p>
      </div>
    )
  }

  if (line.speaker.type === 'npc') {
    const npc = NPCS[line.speaker.npcId]
    return (
      <div className="space-y-1">
        <span className="font-display text-xs font-bold uppercase tracking-widest text-chrome-primary">{npc.name}</span>
        <p className="whitespace-pre-wrap font-body text-base text-white">{text}</p>
      </div>
    )
  }

  return <p className="whitespace-pre-wrap font-body text-base text-white">{text}</p>
}

export function DialogueScreen() {
  const archetype = useInsightStore((s) => s.archetype)
  const vitality = useInsightStore((s) => s.vitality)
  const composure = useInsightStore((s) => s.composure)

  const storyInstance = useStoryStore((s) => s.story)
  const currentLines = useStoryStore((s) => s.currentLines)
  const currentChoices = useStoryStore((s) => s.currentChoices)
  const ended = useStoryStore((s) => s.ended)
  const lastCheckResult = useStoryStore((s) => s.lastCheckResult)
  const choose = useStoryStore((s) => s.choose)
  const resetStory = useStoryStore((s) => s.reset)

  const selectedLocationId = useNavigationStore((s) => s.selectedLocationId)
  const returnToOverworld = useNavigationStore((s) => s.returnToOverworld)

  const openOverlay = useUiStore((s) => s.openOverlay)
  const textSpeed = useSettingsStore((s) => s.textSpeed)
  const instantText = useSettingsStore((s) => s.instantText)

  const [log, setLog] = useState<LogEntry[]>([])
  const nextId = useRef(0)
  const logRef = useRef<HTMLDivElement>(null)
  const [activeNpcId, setActiveNpcId] = useState<NpcId | null>(null)

  // A new Story instance means a new scene — start the transcript and center stage over.
  useEffect(() => {
    setLog([])
    nextId.current = 0
    setActiveNpcId(null)
  }, [storyInstance])

  // Every advance() call replaces currentLines with a fresh batch; append it
  // as one transcript entry, carrying whatever check fired during that pass,
  // and follow the center-stage portrait to the batch's last NPC speaker.
  useEffect(() => {
    if (currentLines.length === 0) return
    const entry: LogEntry = { id: nextId.current++, lines: currentLines, checkResult: lastCheckResult }
    setLog((prev) => [...prev, entry])
    const npcLines = currentLines.filter((l): l is StoryLine & { speaker: { type: 'npc'; npcId: NpcId } } => l.speaker.type === 'npc')
    if (npcLines.length > 0) setActiveNpcId(npcLines[npcLines.length - 1].speaker.npcId)
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

  function handleReturnToOverworld() {
    returnToOverworld()
    resetStory()
  }

  if (!archetype || !storyInstance) return null

  const locationName = selectedLocationId ? LOCATIONS[selectedLocationId].name : 'Scene'

  return (
    <div className="flex h-svh w-full">
      <NavRail
        className="shrink-0 p-4"
        onChar={() => openOverlay('character')}
        onMap={handleReturnToOverworld}
        onCase={() => openOverlay('casefile')}
        onMenu={() => openOverlay('settings')}
      />

      {/* Left three-quarters: player status + center stage */}
      <div className="relative flex-1 overflow-hidden">
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
          Center stage (UI_DESIGN §3): the active NPC's portrait, tracked
          from the most recent `# speaker: npc:<id>` line tag. No character
          art shows until a scene actually names one, per §3's "location
          establishing art can render here when no character is present."
        */}
        <div className="flex h-full flex-col items-center justify-center gap-3">
          {activeNpcId && (
            <div
              className="relative h-[420px] w-[300px] overflow-hidden bg-black/40"
              style={{
                clipPath: 'polygon(28px 0, 100% 0, 100% calc(100% - 28px), calc(100% - 28px) 100%, 0 100%, 0 28px)',
                border: '2px solid color-mix(in srgb, var(--color-chrome-primary) 50%, transparent)',
                boxShadow:
                  '0 0 30px color-mix(in srgb, var(--color-chrome-primary) 20%, transparent), inset 0 0 40px color-mix(in srgb, var(--color-chrome-primary) 10%, transparent)',
              }}
            >
              <img src={NPCS[activeNpcId].portraitSrc} alt={NPCS[activeNpcId].name} className="h-full w-full object-cover" />
            </div>
          )}
          <span className="font-display text-xs uppercase tracking-widest text-white/40">
            {activeNpcId ? NPCS[activeNpcId].name : locationName}
          </span>
        </div>
      </div>

      {/* Right quarter: dialogue panel */}
      <Panel size="lg" className="flex w-[28%] min-w-[380px] shrink-0 flex-col gap-3 p-4" onClick={handleSkip}>
        <div ref={logRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
          {log.map((entry, i) => {
            const isLatest = i === log.length - 1
            const revealed = isLatest ? revealLines(entry.lines, typedChars) : entry.lines.map((line) => ({ line, text: line.text }))
            return (
              <div key={entry.id} className="space-y-2">
                {revealed.map((r, j) => (
                  <StoryLineEntry key={j} line={r.line} text={r.text} />
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
      </Panel>
    </div>
  )
}
