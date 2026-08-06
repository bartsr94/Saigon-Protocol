// Wraps the active inkjs Story instance (Architecture §3): exposes current
// text/choices as read-only derived state, and wires the ink<->TS boundary
// (storyEngine.ts) to insightStore for check resolution, wellbeing, and
// live Insight-variable sync.

import { create } from 'zustand'
import { Story } from 'inkjs'
import type { Choice } from 'inkjs/engine/Choice'
import { bindCheckFunctions, bindWellbeingFunctions, syncInsightVariables } from '../engine/storyEngine'
import type { CheckResult } from '../engine/checkResolution'
import { useInsightStore } from './insightStore'

interface StoryState {
  story: Story | null
  currentText: string[]
  currentTags: string[]
  currentChoices: Choice[]
  canContinue: boolean
  ended: boolean
  lastCheckResult: CheckResult | null

  loadStory: (inkJson: string | Record<string, unknown>) => void
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

  const text: string[] = []
  const tags: string[] = []
  while (story.canContinue) {
    const line = story.Continue()
    if (line !== null) text.push(line)
    if (story.currentTags) tags.push(...story.currentTags)
  }
  const currentChoices = story.currentChoices
  set({
    currentText: text,
    currentTags: tags,
    currentChoices,
    canContinue: story.canContinue,
    ended: !story.canContinue && currentChoices.length === 0,
  })
}

export const useStoryStore = create<StoryState>((set, get) => ({
  story: null,
  currentText: [],
  currentTags: [],
  currentChoices: [],
  canContinue: false,
  ended: false,
  lastCheckResult: null,

  loadStory: (inkJson) => {
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
    advance(story, set)
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
      currentText: [],
      currentTags: [],
      currentChoices: [],
      canContinue: false,
      ended: false,
      lastCheckResult: null,
    })
  },
}))
