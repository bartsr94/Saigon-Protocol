import { useEffect } from 'react'
import { Story } from 'inkjs'
import { useCharacterStore } from './stores/characterStore'
import { useNavigationStore } from './stores/navigationStore'
import { useStoryStore } from './stores/storyStore'
import { bindExternalFunctions } from './ink/externalFunctions'
import { OverworldScreen } from './components/overworld/OverworldScreen'
import { StoryScreen } from './components/story/StoryScreen'
import mainInkJson from './ink/compiled/main.json'

function App() {
  const setCharacter = useCharacterStore((state) => state.setCharacter)
  const unlockLocation = useNavigationStore((state) => state.unlockLocation)
  const selectedLocationId = useNavigationStore((state) => state.selectedLocationId)
  const loadStory = useStoryStore((state) => state.loadStory)

  useEffect(() => {
    setCharacter({
      name: 'Placeholder Runner',
      attributes: {
        strength: 6,
        dexterity: 7,
        endurance: 6,
        intellect: 8,
        education: 7,
        socialStanding: 5,
      },
      skills: [{ name: 'streetwise', level: 1 }],
      careerHistory: [],
      equipment: [],
      health: 10,
      maxHealth: 10,
    })
    unlockLocation('district7-pier14')
  }, [setCharacter, unlockLocation])

  useEffect(() => {
    if (!selectedLocationId) return

    const story = new Story(mainInkJson)
    bindExternalFunctions(story)
    loadStory(story)
  }, [selectedLocationId, loadStory])

  return selectedLocationId ? <StoryScreen /> : <OverworldScreen />
}

export default App
