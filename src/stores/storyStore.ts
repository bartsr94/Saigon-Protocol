// Wraps the active inkjs Story instance (Architecture §6): exposes current
// text/choices as read-only derived state, and wires the ink<->TS boundary
// (storyEngine.ts) to insightStore for check resolution, wellbeing, and
// live Insight-variable sync.

import { create } from 'zustand'
import { Story } from 'inkjs'
import type { Choice } from 'inkjs/engine/Choice'
import { bindCheckFunctions, bindWellbeingFunctions, syncInsightVariables } from '../engine/storyEngine'
import {
  parseLineAmbience,
  parseLineBackground,
  parseLineMusic,
  parseLineSpeaker,
  parseLineVoice,
  type AmbienceCue,
  type LineSpeaker,
} from '../engine/contentTags'
import type { BackgroundId } from '../content/backgrounds'
import type { MusicId } from '../content/music'
import type { VoiceClipId } from '../content/voiceClips'
import type { CheckResult } from '../engine/checkResolution'
import type { NpcId } from '../content/npcs'
import { useInsightStore } from './insightStore'

export interface StoryLine {
  text: string
  speaker: LineSpeaker
  /** Set only on lines carrying a `# background: <id>` tag; null otherwise (caller keeps the last one shown). */
  background: BackgroundId | null
  /** Set only on lines carrying a `# music: <id>` tag; null otherwise (caller keeps whatever track was last cued). */
  music: MusicId | null
  /** Always present — describes the ambience-layer diff this line applies, empty/false when the line carries no `ambience` tag. */
  ambienceOps: AmbienceCue
  /** Set only on lines carrying a `# voice: <id>` tag; one-shot, no persistence concept. */
  voice: VoiceClipId | null
}

interface StoryState {
  story: Story | null
  /** Which compiled story is loaded ('intro', or a LocationId) — opaque to storyStore, but saveStore needs it to know which JSON to recompile a restored save against. Null when no story is active. */
  activeStoryId: string | null
  /** 'conversation' for a Conversation View topic session (UI_PASS_SPEC.md §4) rather than a normal authored scene — App.tsx's screen switch reads this to pick ConversationScreen over DialogueScreen. */
  storyMode: 'scene' | 'conversation'
  /**
   * Which NPC this active story session is specifically about — dual
   * purpose. In 'conversation' mode, which NPC the topic session belongs
   * to. In 'scene' mode, which NPC's first-encounter this scene is (if
   * any) — DialogueScreen marks that NPC met when the scene ends, so a
   * later "Talk" click routes to Conversation View instead of replaying it
   * (UI_PASS_SPEC.md §4.3). Null when neither applies.
   */
  activeNpcId: NpcId | null
  currentLines: StoryLine[]
  currentChoices: Choice[]
  canContinue: boolean
  ended: boolean
  lastCheckResult: CheckResult | null

  /**
   * `entryKnot`, when given and there's no `savedStateJson` to restore, jumps
   * a freshly-constructed Story straight to that ink path before the first
   * `advance()` — how a per-NPC conversation Story reaches its own
   * `<npc>_topics` knot on first entry, since the compiled file it shares
   * with other NPCs/the location's own scene has no single "default start"
   * that means anything for it (UI_PASS_SPEC.md §4.3). Ignored once
   * `savedStateJson` is supplied — a restored pointer already knows where it is.
   */
  loadStory: (
    inkJson: string | Record<string, unknown>,
    savedStateJson?: string,
    storyId?: string | null,
    options?: { entryKnot?: string; mode?: 'scene' | 'conversation'; npcId?: NpcId },
  ) => void
  choose: (index: number) => void
  reset: () => void
}

/** Not part of the reactive store state — there's only ever one active story, mirroring insightStore's singleton shape. */
let unsubscribeInsight: (() => void) | null = null

function advance(story: Story, set: (partial: Partial<StoryState>) => void): void {
  // Cleared before the pass so a turn with no check doesn't keep showing a
  // stale result from an earlier turn (onCheckResult below overwrites this
  // if a check actually fires during this pass).
  set({ lastCheckResult: null })

  // Read story.currentTags right after each line's own Continue() call — it
  // reflects only that line's tags and gets overwritten by the next one, so
  // tags must be captured per-line here rather than flattened across the batch.
  const lines: StoryLine[] = []
  while (story.canContinue) {
    const line = story.Continue()
    if (line !== null) {
      const tags = story.currentTags ?? []
      lines.push({
        text: line,
        speaker: parseLineSpeaker(tags),
        background: parseLineBackground(tags),
        music: parseLineMusic(tags),
        ambienceOps: parseLineAmbience(tags),
        voice: parseLineVoice(tags),
      })
    }
  }
  const currentChoices = story.currentChoices
  set({
    currentLines: lines,
    currentChoices,
    canContinue: story.canContinue,
    ended: !story.canContinue && currentChoices.length === 0,
  })
}

// Restoring a save calls story.state.LoadJson() instead of advance() — the
// story is already positioned at the saved point, so re-running Continue()
// would push it past that point. ink's serialized state collapses the whole
// "output since last choice" batch into one flat currentText/currentTags
// pair, so the restored batch renders as a single block rather than its
// original per-line narrator/NPC/Insight breakdown (Save/Persistence spec's
// "known simplification"). Insight values, wellbeing, consumed Red checks,
// and the story's actual position are all restored exactly regardless.
function hydrateFromRestoredState(story: Story, set: (partial: Partial<StoryState>) => void): void {
  const text = story.currentText
  const tags = story.currentTags ?? []
  const lines: StoryLine[] = text
    ? [
        {
          text,
          speaker: parseLineSpeaker(tags),
          background: parseLineBackground(tags),
          music: parseLineMusic(tags),
          ambienceOps: parseLineAmbience(tags),
          voice: parseLineVoice(tags),
        },
      ]
    : []
  const currentChoices = story.currentChoices
  set({
    currentLines: lines,
    currentChoices,
    canContinue: story.canContinue,
    ended: !story.canContinue && currentChoices.length === 0,
    lastCheckResult: null,
  })
}

export const useStoryStore = create<StoryState>((set, get) => ({
  story: null,
  activeStoryId: null,
  storyMode: 'scene',
  activeNpcId: null,
  currentLines: [],
  currentChoices: [],
  canContinue: false,
  ended: false,
  lastCheckResult: null,

  loadStory: (inkJson, savedStateJson, storyId, options) => {
    unsubscribeInsight?.()

    // Overload resolution doesn't distribute over a union argument, so narrow explicitly.
    const story = typeof inkJson === 'string' ? new Story(inkJson) : new Story(inkJson)

    bindCheckFunctions(story, {
      isRedCheckConsumed: (checkId) => useInsightStore.getState().isRedCheckConsumed(checkId),
      rollCheck: (insightId, targetNumber, checkId, risk) =>
        useInsightStore.getState().rollCheck(insightId, targetNumber, checkId, risk),
      onCheckResult: (result) => set({ lastCheckResult: result }),
    })
    bindWellbeingFunctions(story, {
      damageVitality: (amount) => useInsightStore.getState().damageVitality(amount),
      healVitality: (amount) => useInsightStore.getState().healVitality(amount),
      damageComposure: (amount) => useInsightStore.getState().damageComposure(amount),
      healComposure: (amount) => useInsightStore.getState().healComposure(amount),
    })

    const insightState = useInsightStore.getState()
    syncInsightVariables(story, insightState.levels, insightState.archetype)
    unsubscribeInsight = useInsightStore.subscribe((state) => {
      syncInsightVariables(story, state.levels, state.archetype)
    })

    set({
      story,
      activeStoryId: storyId ?? null,
      storyMode: options?.mode ?? 'scene',
      activeNpcId: options?.npcId ?? null,
      lastCheckResult: null,
    })
    if (savedStateJson) {
      story.state.LoadJson(savedStateJson)
      hydrateFromRestoredState(story, set)
    } else {
      if (options?.entryKnot) story.ChoosePathString(options.entryKnot)
      advance(story, set)
    }
  },

  choose: (index) => {
    const { story } = get()
    if (!story) return
    story.ChooseChoiceIndex(index)
    advance(story, set)
  },

  reset: () => {
    unsubscribeInsight?.()
    unsubscribeInsight = null
    set({
      story: null,
      activeStoryId: null,
      storyMode: 'scene',
      activeNpcId: null,
      currentLines: [],
      currentChoices: [],
      canContinue: false,
      ended: false,
      lastCheckResult: null,
    })
  },
}))
