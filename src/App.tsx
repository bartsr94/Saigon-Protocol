import { useEffect } from 'react'
import { Story } from 'inkjs'
import { useCharacterStore } from './stores/characterStore'
import { useNavigationStore } from './stores/navigationStore'
import { useStoryStore } from './stores/storyStore'
import { bindExternalFunctions } from './ink/externalFunctions'
import { CharacterCreationScreen } from './components/character/CharacterCreationScreen'
import { OverworldScreen } from './components/overworld/OverworldScreen'
import { StoryScreen } from './components/story/StoryScreen'
import { CombatScreen } from './components/combat/CombatScreen'
import mainInkJson from './ink/compiled/main.json'

function App() {
  const character = useCharacterStore((state) => state.character)
  const unlockLocation = useNavigationStore((state) => state.unlockLocation)
  const selectedLocationId = useNavigationStore((state) => state.selectedLocationId)
  const loadStory = useStoryStore((state) => state.loadStory)
  const pendingCombat = useStoryStore((state) => state.pendingCombat)

  useEffect(() => {
    if (character) unlockLocation('district7-pier14')
  }, [character, unlockLocation])

  useEffect(() => {
    if (!selectedLocationId) return

    const story = new Story(mainInkJson)
    bindExternalFunctions(story)
    loadStory(story)
  }, [selectedLocationId, loadStory])

  if (!character) return <CharacterCreationScreen />
  if (!selectedLocationId) return <OverworldScreen />
  return pendingCombat ? <CombatScreen enemyId={pendingCombat} /> : <StoryScreen />
}

export default App
