import { create } from 'zustand'
import type { Story } from 'inkjs'

interface StoryStore {
  story: Story | null
  currentText: string[]
  currentChoices: { index: number; text: string }[]
  loadStory: (story: Story) => void
  continueStory: () => void
  choose: (choiceIndex: number) => void
}

export const useStoryStore = create<StoryStore>((set, get) => ({
  story: null,
  currentText: [],
  currentChoices: [],

  loadStory: (story) => {
    set({ story, currentText: [], currentChoices: [] })
    get().continueStory()
  },

  continueStory: () => {
    const { story } = get()
    if (!story) return

    const text: string[] = []
    while (story.canContinue) {
      text.push(story.Continue() ?? '')
    }

    set({
      currentText: text,
      currentChoices: story.currentChoices.map((c) => ({
        index: c.index,
        text: c.text,
      })),
    })
  },

  choose: (choiceIndex) => {
    const { story, continueStory } = get()
    if (!story) return
    story.ChooseChoiceIndex(choiceIndex)
    continueStory()
  },
}))
