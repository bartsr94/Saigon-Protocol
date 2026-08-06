// Wraps the active inkjs Story instance (Architecture §3): exposes current
// text/choices as read-only derived state, and wires the ink<->TS boundary
// (storyEngine.ts) to insightStore for check resolution, wellbeing, and
// live Insight-variable sync.

import { create } from 'zustand'
import { Story } from 'inkjs'
import type { Choice } from 'inkjs/engine/Choice'
import { bindCheckFunctions, bindWellbeingFunctions, syncInsightVariables } from '../engine/storyEngine'
import { parseLineSpeaker, type LineSpeaker } from '../engine/contentTags'
import type { CheckResult } from '../engine/checkResolution'
import { useInsightStore } from './insightStore'

export interface StoryLine {
  text: string
  speaker: LineSpeaker
}

interface StoryState {
  story: Story | null
  currentLines: StoryLine[]
  currentChoices: Choice[]
  canContinue: boolean
  ended: boolean
  lastCheckResult: CheckResult | null

  loadStory: (inkJson: string | Record<string, unknown>, savedStateJson?: string) => void
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
    if (line !== null) lines.push({ text: line, speaker: parseLineSpeaker(story.currentTags ?? []) })
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
  const lines: StoryLine[] = text ? [{ text, speaker: parseLineSpeaker(story.currentTags ?? []) }] : []
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
  currentLines: [],
  currentChoices: [],
  canContinue: false,
  ended: false,
  lastCheckResult: null,

  loadStory: (inkJson, savedStateJson) => {
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

    set({ story, lastCheckResult: null })
    if (savedStateJson) {
      story.state.LoadJson(savedStateJson)
      hydrateFromRestoredState(story, set)
    } else {
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
      currentLines: [],
      currentChoices: [],
      canContinue: false,
      ended: false,
      lastCheckResult: null,
    })
  },
}))
