// Dialogue/Scene (UI_DESIGN §3) — the core loop. 75/25 layout per
// UI_VISUAL_STYLE_SPEC §5: left-edge nav rail + center stage occupy the
// left three-quarters, the scrolling dialogue log/choices/check-result
// panel is the right quarter.
//
// storyStore only ever exposes "the text since the last choice," not a
// full transcript (Architecture §3) — the scrollback log below is this
// screen's own bookkeeping, appending each new batch as it arrives. A
// persistent transcript belongs in storyStore itself if another screen
// ever needs it too; this is a presentational accumulation, not new
// simulation state.
//
// Real per-line speaker/Insight-interjection metadata and per-choice
// mechanical tags (UI_DESIGN §4/§5) depend on an ink content-tagging
// convention that doesn't exist yet (Architecture §6, still open) — lines
// render as plain narration and choices as untagged rows until that lands.

import { useEffect, useRef, useState } from 'react'
import { useInsightStore } from '../../stores/insightStore'
import { useStoryStore } from '../../stores/storyStore'
import { useNavigationStore } from '../../stores/navigationStore'
import { useSettingsStore, TEXT_SPEED_MS } from '../../stores/settingsStore'
import { useUiStore } from '../../stores/uiStore'
import { LOCATIONS } from '../../content/locations'
import { ARCHETYPES } from '../../content/archetypes'
import { NPCS } from '../../content/npcs'
import type { CheckResult } from '../../engine/checkResolution'
import { CheckResultBlock, ChoiceRow, Panel, PipTrack, PortraitFrame } from '../ui'
import { NavRail } from './NavRail'

interface LogEntry {
  id: number
  text: string
  checkResult: CheckResult | null
}

export function DialogueScreen() {
  const archetype = useInsightStore((s) => s.archetype)
  const vitality = useInsightStore((s) => s.vitality)
  const composure = useInsightStore((s) => s.composure)

  const storyInstance = useStoryStore((s) => s.story)
  const currentText = useStoryStore((s) => s.currentText)
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

  // A new Story instance means a new scene — start the transcript over.
  useEffect(() => {
    setLog([])
    nextId.current = 0
  }, [storyInstance])

  // Every advance() call replaces currentText with a fresh batch; append it
  // as one transcript entry, carrying whatever check fired during that pass.
  useEffect(() => {
    if (currentText.length === 0) return
    const entry: LogEntry = { id: nextId.current++, text: currentText.join('\n\n'), checkResult: lastCheckResult }
    setLog((prev) => [...prev, entry])
    // currentText is the real per-turn trigger; lastCheckResult only ever
    // changes in the same synchronous batch as currentText (see storyStore).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentText])

  const latestEntry = log[log.length - 1] ?? null
  const [typedChars, setTypedChars] = useState(0)

  useEffect(() => {
    setTypedChars(0)
  }, [latestEntry?.id])

  useEffect(() => {
    if (!latestEntry || instantText || typedChars >= latestEntry.text.length) return
    const timeout = setTimeout(() => setTypedChars((c) => c + 1), TEXT_SPEED_MS[textSpeed])
    return () => clearTimeout(timeout)
  }, [typedChars, latestEntry, instantText, textSpeed])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [log, typedChars])

  function handleSkip() {
    if (latestEntry && typedChars < latestEntry.text.length) setTypedChars(latestEntry.text.length)
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
          Test render of a real NPC portrait in the center stage (UI_DESIGN
          §3, UI_VISUAL_STYLE_SPEC §5.2). Hardcoded to Mei Hong — there's no
          per-line speaker metadata yet (Architecture §6, still open), so
          this isn't "whoever is speaking," just proof the art slot works.
        */}
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <div
            className="relative h-[420px] w-[300px] overflow-hidden bg-black/40"
            style={{
              clipPath: 'polygon(28px 0, 100% 0, 100% calc(100% - 28px), calc(100% - 28px) 100%, 0 100%, 0 28px)',
              border: '2px solid color-mix(in srgb, var(--color-chrome-primary) 50%, transparent)',
              boxShadow:
                '0 0 30px color-mix(in srgb, var(--color-chrome-primary) 20%, transparent), inset 0 0 40px color-mix(in srgb, var(--color-chrome-primary) 10%, transparent)',
            }}
          >
            <img src={NPCS.meiHong.portraitSrc} alt={NPCS.meiHong.name} className="h-full w-full object-cover" />
          </div>
          <span className="font-display text-xs uppercase tracking-widest text-white/40">{locationName}</span>
        </div>
      </div>

      {/* Right quarter: dialogue panel */}
      <Panel size="lg" className="flex w-[28%] min-w-[380px] shrink-0 flex-col gap-3 p-4" onClick={handleSkip}>
        <div ref={logRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
          {log.map((entry, i) => (
            <div key={entry.id}>
              <p className="whitespace-pre-wrap font-body text-base text-white">
                {i === log.length - 1 ? entry.text.slice(0, typedChars) : entry.text}
              </p>
              {entry.checkResult && <CheckResultBlock insightName="CHECK" result={entry.checkResult} />}
            </div>
          ))}
          {ended && <p className="font-body text-xs uppercase tracking-widest text-white/40">— scene ended —</p>}
        </div>

        {currentChoices.length > 0 && (!latestEntry || typedChars >= latestEntry.text.length) && (
          <div className="flex flex-col divide-y divide-white/10 border-t border-white/10 pt-1" onClick={(e) => e.stopPropagation()}>
            {currentChoices.map((choice) => (
              <ChoiceRow key={choice.index} onClick={() => choose(choice.index)}>
                {choice.text}
              </ChoiceRow>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
