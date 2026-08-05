import { create } from 'zustand'
import type { Story } from 'inkjs'
import type { CombatResult } from './combatStore'

interface StoryStore {
  story: Story | null
  currentText: string[]
  currentChoices: { index: number; text: string }[]
  pendingCombat: string | null
  loadStory: (story: Story) => void
  continueStory: () => void
  choose: (choiceIndex: number) => void
  resolveCombat: (result: CombatResult) => void
}

export const useStoryStore = create<StoryStore>((set, get) => ({
  story: null,
  currentText: [],
  currentChoices: [],
  pendingCombat: null,

  loadStory: (story) => {
    set({ story, currentText: [], currentChoices: [], pendingCombat: null })
    get().continueStory()
  },

  continueStory: () => {
    const { story } = get()
    if (!story) return

    const text: string[] = []
    let combatId: string | null = null

    while (story.canContinue) {
      text.push(story.Continue() ?? '')

      const combatTag = story.currentTags?.find((t) => t.startsWith('combat:'))
      if (combatTag) {
        combatId = combatTag.slice('combat:'.length).trim()
        break
      }
    }

    set({
      currentText: text,
      currentChoices: combatId
        ? []
        : story.currentChoices.map((c) => ({ index: c.index, text: c.text })),
      pendingCombat: combatId,
    })
  },

  choose: (choiceIndex) => {
    const { story, continueStory } = get()
    if (!story) return
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
}))
