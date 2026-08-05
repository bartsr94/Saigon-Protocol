import { create } from 'zustand'
import type { Story } from 'inkjs'
import type { CombatResult } from './combatStore'
import type { CheckTier } from '../engine/resolution'
import { isSuccess, passProbability, resolveSkillCheck } from '../engine/resolution'
import { checkModifiersForSkill } from '../engine/characterCheck'
import { parseChoiceCheckMarker, parseCombatTag, parseVoiceTag } from '../ink/tags'
import type { ChoiceCheckTag } from '../ink/tags'

export interface NarrationLine {
  text: string
  voice: string | null
}

export type CheckStakes = 'white' | 'red'

export interface StoryChoiceCheck {
  skill: string
  targetNumber: number
  stakes: CheckStakes
  probability: number
}

export interface StoryChoice {
  index: number
  text: string
  check: StoryChoiceCheck | null
}

export interface PendingCheck {
  choiceIndex: number
  skill: string
  targetNumber: number
  dice: [number, number]
  tier: CheckTier
  message: string
}

interface StoryStore {
  story: Story | null
  currentText: NarrationLine[]
  currentChoices: StoryChoice[]
  pendingCombat: string | null
  pendingCheck: PendingCheck | null
  loadStory: (story: Story) => void
  continueStory: () => void
  choose: (choiceIndex: number) => void
  resolveCombat: (result: CombatResult) => void
  resolveCheck: () => void
  resetStory: () => void
  /**
   * Adopt a Story whose state was already loaded from a save via `story.state.LoadJson`.
   * `text` must be the displayed lines captured at save time — inkjs's own
   * `story.currentText` only reflects the most recent Continue() call, not the
   * full accumulated text since the last choice, so it can't be re-derived here.
   * Restored lines carry no voice attribution — that tagging isn't preserved
   * across a save round-trip.
   */
  restoreStory: (story: Story, text: string[]) => void
}

function buildChoiceCheck(tag: ChoiceCheckTag | null): StoryChoiceCheck | null {
  if (!tag) return null

  const { skillLevel, attributeModifier } = checkModifiersForSkill(tag.skill)
  const probability = passProbability({
    skillLevel,
    attributeModifier,
    targetNumber: tag.targetNumber,
  })

  return {
    skill: tag.skill,
    targetNumber: tag.targetNumber,
    stakes: tag.once ? 'red' : 'white',
    probability,
  }
}

function choicesFrom(story: Story): StoryChoice[] {
  return story.currentChoices.map((c) => {
    const { displayText, check } = parseChoiceCheckMarker(c.text)
    return {
      index: c.index,
      text: displayText,
      check: buildChoiceCheck(check),
    }
  })
}

export const useStoryStore = create<StoryStore>((set, get) => ({
  story: null,
  currentText: [],
  currentChoices: [],
  pendingCombat: null,
  pendingCheck: null,

  loadStory: (story) => {
    set({ story, currentText: [], currentChoices: [], pendingCombat: null, pendingCheck: null })
    get().continueStory()
  },

  continueStory: () => {
    const { story } = get()
    if (!story) return

    const lines: NarrationLine[] = []
    let combatId: string | null = null

    while (story.canContinue) {
      const text = story.Continue() ?? ''
      const tags = story.currentTags
      lines.push({ text, voice: parseVoiceTag(tags) })

      const combatTag = parseCombatTag(tags)
      if (combatTag) {
        combatId = combatTag
        break
      }
    }

    set({
      currentText: lines,
      currentChoices: combatId ? [] : choicesFrom(story),
      pendingCombat: combatId,
    })
  },

  choose: (choiceIndex) => {
    const { story, currentChoices, continueStory } = get()
    if (!story) return

    const check = currentChoices.find((c) => c.index === choiceIndex)?.check
    if (check) {
      const { skillLevel, attributeModifier } = checkModifiersForSkill(check.skill)
      const result = resolveSkillCheck({
        skillLevel,
        attributeModifier,
        targetNumber: check.targetNumber,
      })

      set({
        currentChoices: [],
        pendingCheck: {
          choiceIndex,
          skill: check.skill,
          targetNumber: check.targetNumber,
          dice: result.roll,
          tier: result.tier,
          message: `${check.skill} vs ${check.targetNumber} — rolled ${result.total}`,
        },
      })
      return
    }

    story.ChooseChoiceIndex(choiceIndex)
    continueStory()
  },

  resolveCombat: (result) => {
    const { story, continueStory } = get()
    if (!story) return
    story.variablesState['combatResult'] = result
    set({ pendingCombat: null })
    continueStory()
  },

  resolveCheck: () => {
    const { story, pendingCheck, continueStory } = get()
    if (!story || !pendingCheck) return

    story.variablesState['lastCheckSuccess'] = isSuccess(pendingCheck.tier)
    story.ChooseChoiceIndex(pendingCheck.choiceIndex)
    set({ pendingCheck: null })
    continueStory()
  },

  resetStory: () =>
    set({
      story: null,
      currentText: [],
      currentChoices: [],
      pendingCombat: null,
      pendingCheck: null,
    }),

  restoreStory: (story, text) => {
    set({
      story,
      currentText: text.map((line) => ({ text: line, voice: null })),
      currentChoices: choicesFrom(story),
      pendingCombat: null,
      pendingCheck: null,
    })
  },
}))
