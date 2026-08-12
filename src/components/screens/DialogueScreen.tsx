// Dialogue/Scene (docs/GAME_GUIDE.md §2.1) — the core loop. 75/25 layout per
// docs/GAME_GUIDE.md §2.1: left-edge nav rail + center stage occupy the
// left three-quarters, the scrolling dialogue log/choices/check-result
// panel is the right quarter.
//
// Transcript accumulation/typewriter-reveal/per-line rendering lives in
// storyTranscript.tsx, shared with ConversationScreen (UI_PASS_SPEC.md
// §4.4). Per-choice mechanical tags follow the ink content-tagging
// convention (docs/GAME_GUIDE.md, Architecture §6) — each choice's raw
// inkjs tags are parsed here via parseChoiceTags.

import { useEffect, useState } from 'react'
import { useInsightStore } from '../../stores/insightStore'
import { useStoryStore, type StoryLine } from '../../stores/storyStore'
import { useConversationStore } from '../../stores/conversationStore'
import { useNavigationStore } from '../../stores/navigationStore'
import { useSaveStore } from '../../stores/saveStore'
import { useAudioStore } from '../../stores/audioStore'
import { useGameplayStore } from '../../stores/gameplayStore'
import { useUiStore } from '../../stores/uiStore'
import { LOCATIONS } from '../../content/locations'
import { ARCHETYPES } from '../../content/archetypes'
import type { NpcId } from '../../content/npcs'
import { BACKGROUNDS, type BackgroundId } from '../../content/backgrounds'
import { INSIGHTS } from '../../content/insights'
import { PORTRAITS } from '../../content/portraits'
import { parseChoiceTags } from '../../engine/contentTags'
import { ChoiceRow, CyberButton, NpcStagePortrait, Panel, PipTrack, PortraitFrame } from '../ui'
import { enterLocationHub } from './enterLocationHub'
import { NavRail } from './NavRail'
import { TranscriptLog } from './storyTranscript'
import { useTranscript } from './useTranscript'

export function DialogueScreen() {
  const archetype = useInsightStore((s) => s.archetype)
  const portraitId = useInsightStore((s) => s.portraitId)
  const vitality = useInsightStore((s) => s.vitality)
  const composure = useInsightStore((s) => s.composure)

  const storyInstance = useStoryStore((s) => s.story)
  const activeStoryId = useStoryStore((s) => s.activeStoryId)
  // Which NPC this scene's Talk interaction was for (if any) — distinct
  // from the `activeNpcId` local state below, which tracks whoever's
  // *currently speaking* via ink `speaker:` tags. Read here only to mark
  // them met once the scene ends (UI_PASS_SPEC.md §4.3).
  const talkNpcId = useStoryStore((s) => s.activeNpcId)
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

  const { log, latestEntry, typedChars, isTypingDone, logRef, isScrolling, handleLogScroll, handleSkip } = useTranscript(
    storyInstance,
    currentLines,
    lastCheckResult,
  )

  const [activeNpcId, setActiveNpcId] = useState<NpcId | null>(null)
  const [activeBackgroundId, setActiveBackgroundId] = useState<BackgroundId | null>(null)
  // Missing/not-yet-authored backdrop art degrades to no backdrop rather
  // than a broken-image icon (same tolerance PortraitFrame already has).
  const [backgroundLoadFailed, setBackgroundLoadFailed] = useState(false)

  // A new Story instance means a new scene — reset the center stage (the
  // transcript itself resets via useTranscript's own resetKey).
  useEffect(() => {
    setActiveNpcId(null)
    setActiveBackgroundId(null)
  }, [storyInstance])

  // Follow the center-stage portrait/backdrop to the latest batch's last NPC
  // speaker / background tag — either can be absent from a given batch, in
  // which case whatever was last shown stays put.
  useEffect(() => {
    if (currentLines.length === 0) return
    const npcLines = currentLines.filter((l): l is StoryLine & { speaker: { type: 'npc'; npcId: NpcId } } => l.speaker.type === 'npc')
    if (npcLines.length > 0) {
      setActiveNpcId(npcLines[npcLines.length - 1].speaker.npcId)
    }
    const backgroundLines = currentLines.filter((l) => l.background !== null)
    if (backgroundLines.length > 0) {
      setActiveBackgroundId(backgroundLines[backgroundLines.length - 1].background)
      setBackgroundLoadFailed(false)
    }
  }, [currentLines])

  function finalizeEndedScene() {
    if (selectedLocationId && ended) {
      for (const unlockedId of LOCATIONS[selectedLocationId].unlocksOnComplete ?? []) {
        unlockLocation(unlockedId)
      }
    }
    // A "Talk" scene that names an NPC (LocationHubScreen threads this
    // through via storyStore.loadStory's npcId option) marks them met once
    // it ends — the next Talk click on them routes to Conversation View
    // instead of replaying this scene (UI_PASS_SPEC.md §4.3).
    if (talkNpcId && ended) {
      useConversationStore.getState().markMet(talkNpcId)
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
      // The intro's own dialogue already plays out Mei Hong's first
      // encounter (she introduces herself at the lab door) without going
      // through LocationHubScreen's enterHubInteraction — so the usual
      // talkNpcId-driven markMet in finalizeEndedScene() never fires for
      // her. Mark her met explicitly here, or the first Talk on her Hub
      // POI would wrongly replay checkpoint.ink's unrelated queue scene
      // instead of routing to Conversation View.
      useConversationStore.getState().markMet('meiHong')
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
            src={portraitId ? PORTRAITS[portraitId].src : undefined}
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
        <NpcStagePortrait npcId={activeNpcId} fallbackLabel={locationName} />
      </div>

      {/* Right quarter: dialogue panel — floating box, inset from the screen edges */}
      <Panel size="lg" className="mt-[10px] mr-[10px] mb-[50px] flex w-[28%] min-w-[380px] shrink-0 flex-col gap-3 p-4" onClick={handleSkip}>
        <div
          ref={logRef}
          onScroll={handleLogScroll}
          className={`auto-hide-scrollbar flex-1 space-y-3 overflow-y-auto pr-1 ${isScrolling ? 'is-scrolling' : ''}`}
        >
          <TranscriptLog log={log} latestEntry={latestEntry} typedChars={typedChars} endedLabel={ended ? '— scene ended —' : undefined} />
        </div>

        {currentChoices.length > 0 && isTypingDone && (
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

        {ended && isTypingDone && (
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
