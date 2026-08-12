// Conversation View (UI_PASS_SPEC.md §4) — the repeat-visit alternative to
// replaying an NPC's first-encounter scene. Structurally a sibling of
// DialogueScreen: same NavRail + player-status + center-stage-portrait +
// dialogue-panel layout (reusing storyTranscript.tsx for the log), but the
// bottom of the panel is a topic bar (borrowing HubGridView's POI
// bottom-action-bar pattern) instead of a vertical ChoiceRow list — the
// topics themselves are just ink's own gated `currentChoices`, no separate
// topic data model. "Leave Conversation" is the one button that isn't an
// ink choice at all: it stashes the Story's state for next visit and never
// advances it, so the ink story stays parked at its topic menu forever.

import { useInsightStore } from '../../stores/insightStore'
import { useStoryStore } from '../../stores/storyStore'
import { useConversationStore } from '../../stores/conversationStore'
import { useAudioStore } from '../../stores/audioStore'
import { useGameplayStore } from '../../stores/gameplayStore'
import { useSaveStore } from '../../stores/saveStore'
import { useUiStore } from '../../stores/uiStore'
import { LOCATIONS } from '../../content/locations'
import { ARCHETYPES } from '../../content/archetypes'
import { NPCS } from '../../content/npcs'
import { INSIGHTS } from '../../content/insights'
import { PORTRAITS } from '../../content/portraits'
import { parseChoiceTags } from '../../engine/contentTags'
import { CyberButton, NpcStagePortrait, Panel, PipTrack, PortraitFrame } from '../ui'
import { NavRail } from './NavRail'
import { TranscriptLog } from './storyTranscript'
import { useTranscript } from './useTranscript'

export function ConversationScreen() {
  const archetype = useInsightStore((s) => s.archetype)
  const portraitId = useInsightStore((s) => s.portraitId)
  const vitality = useInsightStore((s) => s.vitality)
  const composure = useInsightStore((s) => s.composure)

  const storyInstance = useStoryStore((s) => s.story)
  const npcId = useStoryStore((s) => s.activeNpcId)
  const currentLines = useStoryStore((s) => s.currentLines)
  const currentChoices = useStoryStore((s) => s.currentChoices)
  const lastCheckResult = useStoryStore((s) => s.lastCheckResult)
  const choose = useStoryStore((s) => s.choose)
  const resetStory = useStoryStore((s) => s.reset)

  const currentHubId = useGameplayStore((s) => s.currentHubId)
  const openOverlay = useUiStore((s) => s.openOverlay)

  const { log, latestEntry, typedChars, isTypingDone, logRef, isScrolling, handleLogScroll, handleSkip } = useTranscript(
    storyInstance,
    currentLines,
    lastCheckResult,
  )

  // Stashes wherever the ink Story is currently parked (always its topics
  // knot, since only "Leave" here or a topic pick ever advance it) and
  // returns to the hub — never calls choose()/advances the story itself,
  // so next visit resumes at exactly this point.
  function handleLeaveConversation() {
    if (storyInstance && npcId) {
      useConversationStore.getState().saveConversationState(npcId, storyInstance.state.ToJson())
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
        onCase={() => openOverlay('casefile')}
        onMenu={() => openOverlay('settings')}
        mapTitle="Leave the conversation"
      />

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

        <NpcStagePortrait npcId={npcId} fallbackLabel={npc.name} />
      </div>

      {/* Right quarter: same dialogue panel treatment as DialogueScreen — topic bar replaces the choice list at the bottom. */}
      <Panel size="lg" className="mt-[10px] mr-[10px] mb-[50px] flex w-[28%] min-w-[380px] shrink-0 flex-col gap-3 p-4" onClick={handleSkip}>
        <div
          ref={logRef}
          onScroll={handleLogScroll}
          className={`auto-hide-scrollbar flex-1 space-y-3 overflow-y-auto pr-1 ${isScrolling ? 'is-scrolling' : ''}`}
        >
          <TranscriptLog log={log} latestEntry={latestEntry} typedChars={typedChars} />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3" onClick={(e) => e.stopPropagation()}>
          {isTypingDone &&
            currentChoices.map((choice) => {
              const tagInfo = parseChoiceTags(choice.tags)
              const insight = tagInfo.insightId ? INSIGHTS[tagInfo.insightId] : null
              const locked = tagInfo.variant === 'locked'
              return (
                <CyberButton
                  key={choice.index}
                  disabled={locked}
                  title={locked ? tagInfo.lockedReason : undefined}
                  tag={locked ? 'Locked' : (insight?.name ?? (tagInfo.variant === 'white-check' || tagInfo.variant === 'red-check' ? 'Check' : 'Topic'))}
                  className="!px-3 !py-2 !text-xs"
                  onClick={() => !locked && choose(choice.index)}
                >
                  {choice.text}
                </CyberButton>
              )
            })}
          <CyberButton
            className="!border-chrome-secondary !text-chrome-secondary !px-3 !py-2 !text-xs"
            onClick={handleLeaveConversation}
          >
            Leave Conversation
          </CyberButton>
        </div>
      </Panel>
    </div>
  )
}
