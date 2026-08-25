// Conversation View (UI_PASS_SPEC.md §4) — the repeat-visit alternative to
// replaying an NPC's first-encounter scene. Structurally a sibling of
// DialogueScreen: same NavRail + player-status + center-stage-portrait +
// dialogue-panel layout (reusing storyTranscript.tsx for the log), but below
// the stage+panel row sits a dedicated full-width topic bar — the same
// bottom-action-bar `Panel` HubGridView uses for its current-tile POI
// interactions — instead of a vertical ChoiceRow list or an in-panel choice
// row. The topics themselves are just ink's own gated `currentChoices`, no
// separate topic data model. "Leave Conversation" is the one button that
// isn't an ink choice at all: it stashes the Story's state for next visit
// and never advances it, so the ink story stays parked at its topic menu
// forever.

import { useState } from 'react'
import { useInsightStore } from '../../stores/insightStore'
import { useStoryStore } from '../../stores/storyStore'
import { useConversationStore } from '../../stores/conversationStore'
import { useAudioStore } from '../../stores/audioStore'
import { useCaseStore } from '../../stores/caseStore'
import { useGameplayStore } from '../../stores/gameplayStore'
import { useNavigationStore } from '../../stores/navigationStore'
import { useSaveStore } from '../../stores/saveStore'
import { useUiStore } from '../../stores/uiStore'
import { LOCATIONS, type LocationId } from '../../content/locations'
import { ARCHETYPES } from '../../content/archetypes'
import { NPCS } from '../../content/npcs'
import { INSIGHTS } from '../../content/insights'
import { PORTRAITS } from '../../content/portraits'
import { parseChoiceTags } from '../../engine/contentTags'
import { CyberButton, NpcStagePortrait, Panel, PipTrack, PortraitFrame } from '../ui'
import { NavRail } from './NavRail'
import { usePortraitVariant } from './usePortraitVariant'
import { TranscriptLog } from './storyTranscript'
import { TopicEditorPanel } from './TopicEditorPanel'
import { useTranscript } from './useTranscript'

export function ConversationScreen() {
  const archetype = useInsightStore((s) => s.archetype)
  const portraitId = useInsightStore((s) => s.portraitId)
  const vitality = useInsightStore((s) => s.vitality)
  const composure = useInsightStore((s) => s.composure)

  const storyInstance = useStoryStore((s) => s.story)
  const npcId = useStoryStore((s) => s.activeNpcId)
  const activeStoryId = useStoryStore((s) => s.activeStoryId)
  const activeTopicsKnot = useStoryStore((s) => s.activeTopicsKnot)
  const currentLines = useStoryStore((s) => s.currentLines)
  const currentChoices = useStoryStore((s) => s.currentChoices)
  const lastCheckResult = useStoryStore((s) => s.lastCheckResult)
  const choose = useStoryStore((s) => s.choose)
  const resetStory = useStoryStore((s) => s.reset)

  const currentHubId = useGameplayStore((s) => s.currentHubId)
  const openOverlay = useUiStore((s) => s.openOverlay)

  const [editingTopics, setEditingTopics] = useState(false)
  const activePortraitVariant = usePortraitVariant(npcId, currentLines)

  // Capped (PERFORMANCE_PASS_SPEC.md §1) — unlike DialogueScreen's one-scene
  // sessions, the ink Story here stays parked on the same `storyInstance`
  // for as long as the player keeps browsing topics, so an uncapped log
  // would grow for the whole session.
  const { log, latestEntry, typedChars, isTypingDone, logRef, isScrolling, handleLogScroll, handleSkip } = useTranscript(
    storyInstance,
    currentLines,
    lastCheckResult,
    40,
  )

  // Stashes wherever the ink Story is currently parked (always its topics
  // knot, since only "Leave" here or a topic pick ever advance it) and
  // returns to the hub — never calls choose()/advances the story itself,
  // so next visit resumes at exactly this point.
  function handleLeaveConversation() {
    if (storyInstance && npcId && activeStoryId) {
      // activeStoryId only ever came from a real LocationId here — same
      // convention DialogueScreen.handleReturnToHub relies on.
      useConversationStore
        .getState()
        .saveConversationState(activeStoryId as LocationId, npcId, storyInstance.state.ToJson(), currentLines)
    }
    // Same unlocksOnFlag trigger point as DialogueScreen.finalizeEndedScene
    // (src/content/locations.ts) — a topic-loop beat (e.g. Ophelia agreeing
    // to the stream favor inside turtleLakePlaza.ink's ophelia_topics) can
    // set a caseStore flag just as validly as a one-off scene can, so
    // leaving the conversation has to check it too or the unlock never fires.
    const selectedLocationId = useNavigationStore.getState().selectedLocationId
    if (selectedLocationId) {
      const hasFlag = useCaseStore.getState().hasFlag
      const unlockLocation = useNavigationStore.getState().unlockLocation
      for (const { flag, locationId } of LOCATIONS[selectedLocationId].unlocksOnFlag ?? []) {
        if (hasFlag(flag)) unlockLocation(locationId)
      }
    }
    resetStory()
    if (currentHubId && LOCATIONS[currentHubId]) {
      useAudioStore.getState().enterLocation(LOCATIONS[currentHubId])
    }
    useSaveStore.getState().autosave()
  }

  if (!archetype || !storyInstance || !npcId) return null

  const npc = NPCS[npcId]

  return (
    <div className="flex h-svh w-full">
      <NavRail
        className="shrink-0 p-4"
        onChar={() => openOverlay('character')}
        onMap={handleLeaveConversation}
        onCase={() => openOverlay('cases')}
        onThoughts={() => openOverlay('thoughtCabinet')}
        onMenu={() => openOverlay('settings')}
        mapTitle="Leave the conversation"
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {/* Left three-quarters: player status + center stage */}
          <div className="relative flex-1 overflow-hidden">
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

            <NpcStagePortrait npcId={npcId} fallbackLabel={npc.name} variantId={activePortraitVariant} />
          </div>

          {/* Right quarter: same dialogue panel treatment as DialogueScreen, minus the choice row — that's now the dedicated bottom bar below. */}
          <Panel size="lg" className="mt-[10px] mr-[10px] flex w-[28%] min-w-[380px] shrink-0 flex-col p-4" onClick={handleSkip}>
            <div
              ref={logRef}
              onScroll={handleLogScroll}
              className={`auto-hide-scrollbar flex-1 space-y-3 overflow-y-auto pr-1 ${isScrolling ? 'is-scrolling' : ''}`}
            >
              <TranscriptLog log={log} latestEntry={latestEntry} typedChars={typedChars} />
            </div>
          </Panel>
        </div>

        {/* Dedicated topic bar — the same bottom-action-bar Panel HubGridView
            uses for a POI's Talk/Inspect interactions, reused here for ink's
            gated currentChoices instead of a hub interaction list. Capped at
            max-h-64 (unlike HubGridView's uncapped version, whose POI
            interaction lists never run past a handful) since an NPC's
            topicsKnot can hold far more entries (e.g. Lakshmi Avani's 10) —
            short topic-word choices (docs/GAME_GUIDE.md §5.2) grid into neat
            rows instead of wrapping as variable-width sentence pills, and the
            grid scrolls internally so a long topic list can never grow this
            bar tall enough to push the center-stage portrait's head out of
            frame. Leave/Edit Topics sit outside the scroll area so they're
            always reachable. */}
        <div className="shrink-0 px-[10px] pb-4">
          <Panel size="md" className="flex max-h-64 flex-col gap-3 p-4">
            <div className="auto-hide-scrollbar grid grid-cols-2 content-start gap-3 overflow-y-auto pr-1 lg:grid-cols-3 xl:grid-cols-4">
              {isTypingDone &&
                currentChoices.map((choice) => {
                  const tagInfo = parseChoiceTags(choice.tags)
                  const insight = tagInfo.insightId ? INSIGHTS[tagInfo.insightId] : null
                  const locked = tagInfo.variant === 'locked'
                  return (
                    <CyberButton
                      key={choice.index}
                      className="w-full"
                      disabled={locked}
                      title={locked ? tagInfo.lockedReason : undefined}
                      tag={locked ? 'Locked' : (insight?.name ?? (tagInfo.variant === 'white-check' || tagInfo.variant === 'red-check' ? 'Check' : 'Topic'))}
                      onClick={() => !locked && choose(choice.index)}
                    >
                      {choice.text}
                    </CyberButton>
                  )
                })}
            </div>
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-white/10 pt-3">
              {import.meta.env.DEV && activeTopicsKnot && (
                <CyberButton className="!border-white/30 !text-white/50" onClick={() => setEditingTopics(true)}>
                  Edit Topics
                </CyberButton>
              )}
              <CyberButton className="!border-chrome-secondary !text-chrome-secondary" onClick={handleLeaveConversation}>
                Leave Conversation
              </CyberButton>
            </div>
          </Panel>
        </div>
      </div>

      {editingTopics && activeStoryId && activeTopicsKnot && (
        <TopicEditorPanel
          storyLocationId={activeStoryId}
          knotName={activeTopicsKnot}
          npcId={npcId}
          onClose={() => setEditingTopics(false)}
        />
      )}
    </div>
  )
}
