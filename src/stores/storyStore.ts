// Wraps the active inkjs Story instance (Architecture §6): exposes current
// text/choices as read-only derived state, and wires the ink<->TS boundary
// (storyEngine.ts) to insightStore for check resolution, wellbeing, and
// live Insight-variable sync.

import { create } from 'zustand'
import { Story } from 'inkjs'
import type { Choice } from 'inkjs/engine/Choice'
import {
  bindCaseFunctions,
  bindCheckFunctions,
  bindCorruptionFunctions,
  bindRelationshipFunctions,
  bindThoughtFunctions,
  bindWellbeingFunctions,
  syncCorruptionVariables,
  syncInsightVariables,
  syncRelationshipVariables,
  type StoryLine,
} from '../engine/storyEngine'
import {
  parseLineAmbience,
  parseLineBackground,
  parseLineMusic,
  parseLinePortrait,
  parseLineSpeaker,
  parseLineVoice,
} from '../engine/contentTags'
import type { CheckResult } from '../engine/checkResolution'
import type { NpcId } from '../content/npcs'
import { useInsightStore } from './insightStore'
import { useCaseStore } from './caseStore'
import { useThoughtStore } from './thoughtStore'
import { useRelationshipStore } from './relationshipStore'
import { useCorruptionStore } from './corruptionStore'

export type { StoryLine } from '../engine/storyEngine'

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
  /**
   * The `topicsKnot` this 'conversation'-mode session is parked on — set
   * from `loadStory`'s `topicsKnot` option regardless of whether it was
   * also used as `entryKnot` this call (a resumed conversation is still
   * parked on the same knot). Null in 'scene' mode. Lets the live topic
   * editor (`docs/LIVE_TOPIC_EDITOR_SPEC.md`) know which knot in
   * `activeStoryId`'s `.ink` file it's editing.
   */
  activeTopicsKnot: string | null
  /**
   * The `topicsKnot` a first-encounter 'scene' session's NPC (`activeNpcId`)
   * has, if any — set from `loadStory`'s `topicsKnot` option regardless of
   * mode, unlike `activeTopicsKnot` above which stays conversation-mode-only
   * (that one drives the live topic editor). DialogueScreen reads this once
   * such a scene ends to hand off straight into Conversation View with this
   * NPC instead of returning to the map (UI_PASS_SPEC.md §4.3).
   */
  sceneTopicsKnot: string | null
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
    options?: {
      entryKnot?: string
      mode?: 'scene' | 'conversation'
      npcId?: NpcId
      topicsKnot?: string
      /**
       * The `currentLines` batch captured at the moment `savedStateJson` was
       * serialized — required to actually show anything on restore. ink's
       * `state.ToJson()`/`LoadJson()` round-trips the story's *position*
       * exactly, but not a usable `currentText`: depending on the knot's
       * shape (a bank of top-level `{ cond: }` blocks, e.g. Lakshmi Avani's
       * affinity-tiered greeting, is the reproducing case), the output
       * stream's own `currentText` getter can read back empty even though
       * real text was generated right before the story stopped at its
       * choice list — see `hydrateFromRestoredState` below. Omitting this
       * silently restores to blank narration text with the choices still
       * showing, so every `savedStateJson` caller must supply it.
       */
      savedLines?: StoryLine[]
    },
  ) => void
  choose: (index: number) => void
  reset: () => void
}

/** Not part of the reactive store state — there's only ever one active story, mirroring insightStore's singleton shape. */
let unsubscribeInsight: (() => void) | null = null
let unsubscribeRelationship: (() => void) | null = null
let unsubscribeCorruption: (() => void) | null = null

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
        portrait: parseLinePortrait(tags),
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
// would push it past that point. That leaves no live Continue() calls to
// read text/tags from directly, and ink's own `currentText`/`currentTags`
// getters are not a reliable substitute: they reflect only the output
// stream's state as of the *last* internal continue step, which for some
// knot shapes (a bank of top-level `{ cond: }` blocks with no plain text
// after the matching one — Lakshmi Avani's affinity-tiered greeting in
// checkpoint.ink is the case that surfaced this) is an empty trailing step,
// even though real text was generated moments earlier in the same batch.
// That silently restored every repeat visit to her (and anything shaped
// like her) to blank narration with only the topic choices showing. Fixed
// by never reading text back off the restored `story` at all — `loadStory`
// requires the caller to pass the `currentLines` batch it already had
// in hand at save time (see `StoryLine`'s doc comment) and this just
// re-displays it verbatim, sidestepping the getter entirely. Insight
// values, wellbeing, consumed Red checks, and the story's actual position
// are still restored exactly via LoadJson regardless.
function hydrateFromRestoredState(
  story: Story,
  lines: StoryLine[],
  set: (partial: Partial<StoryState>) => void,
): void {
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
  activeTopicsKnot: null,
  sceneTopicsKnot: null,
  currentLines: [],
  currentChoices: [],
  canContinue: false,
  ended: false,
  lastCheckResult: null,

  loadStory: (inkJson, savedStateJson, storyId, options) => {
    unsubscribeInsight?.()
    unsubscribeRelationship?.()
    unsubscribeCorruption?.()

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
    bindCaseFunctions(story, {
      gainEvidence: (id) => useCaseStore.getState().addEvidence(id),
      unlockNote: (id) => useCaseStore.getState().unlockNote(id),
      setCaseFlag: (flag) => useCaseStore.getState().setFlag(flag),
      hasEvidence: (id) => useCaseStore.getState().hasEvidence(id),
      hasNote: (id) => useCaseStore.getState().hasNote(id),
      hasFlag: (flag) => useCaseStore.getState().hasFlag(flag),
      startCase: (id) => useCaseStore.getState().startCase(id),
      completeObjective: (caseId, objectiveId) => useCaseStore.getState().completeObjective(caseId, objectiveId),
      completeCase: (id) => useCaseStore.getState().completeCase(id),
      isCaseActive: (id) => useCaseStore.getState().isCaseActive(id),
      isCaseCompleted: (id) => useCaseStore.getState().isCaseCompleted(id),
      isObjectiveComplete: (caseId, objectiveId) => useCaseStore.getState().isObjectiveComplete(caseId, objectiveId),
    })
    bindThoughtFunctions(story, {
      unlockThought: (id) => useThoughtStore.getState().unlockThought(id),
      isThoughtEnabled: (id) => useThoughtStore.getState().isEnabled(id),
    })
    bindRelationshipFunctions(story, {
      adjustAffinity: (npcId, amount) => useRelationshipStore.getState().adjustAffinity(npcId, amount),
    })
    bindCorruptionFunctions(story, {
      markCorruptAction: (actionId) => useCorruptionStore.getState().markCorruptAction(actionId),
    })

    const insightState = useInsightStore.getState()
    syncInsightVariables(story, insightState.levels, insightState.archetype)
    unsubscribeInsight = useInsightStore.subscribe((state) => {
      syncInsightVariables(story, state.levels, state.archetype)
    })

    syncRelationshipVariables(story, useRelationshipStore.getState().affinity)
    unsubscribeRelationship = useRelationshipStore.subscribe((state) => {
      syncRelationshipVariables(story, state.affinity)
    })

    syncCorruptionVariables(story, useCorruptionStore.getState().corruptionCount())
    unsubscribeCorruption = useCorruptionStore.subscribe((state) => {
      syncCorruptionVariables(story, state.markedActionIds.size)
    })

    set({
      story,
      activeStoryId: storyId ?? null,
      storyMode: options?.mode ?? 'scene',
      activeNpcId: options?.npcId ?? null,
      activeTopicsKnot: options?.mode === 'conversation' ? (options?.topicsKnot ?? null) : null,
      sceneTopicsKnot: options?.topicsKnot ?? null,
      lastCheckResult: null,
    })
    if (savedStateJson) {
      story.state.LoadJson(savedStateJson)
      hydrateFromRestoredState(story, options?.savedLines ?? [], set)
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
    unsubscribeRelationship?.()
    unsubscribeRelationship = null
    unsubscribeCorruption?.()
    unsubscribeCorruption = null
    set({
      story: null,
      activeStoryId: null,
      storyMode: 'scene',
      activeNpcId: null,
      activeTopicsKnot: null,
      sceneTopicsKnot: null,
      currentLines: [],
      currentChoices: [],
      canContinue: false,
      ended: false,
      lastCheckResult: null,
    })
  },
}))
