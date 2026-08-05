import { useEffect, useState } from 'react'
import { Story } from 'inkjs'
import { useCharacterStore } from './stores/characterStore'
import { useNavigationStore } from './stores/navigationStore'
import { useStoryStore } from './stores/storyStore'
import { hasSave, loadGame } from './stores/saveStore'
import { bindExternalFunctions } from './ink/externalFunctions'
import { TitleScreen } from './components/title/TitleScreen'
import { CharacterCreationScreen } from './components/character/CharacterCreationScreen'
import { OverworldScreen } from './components/overworld/OverworldScreen'
import { StoryScreen } from './components/story/StoryScreen'
import { CombatScreen } from './components/combat/CombatScreen'
import mainInkJson from './ink/compiled/main.json'

function App() {
  const character = useCharacterStore((state) => state.character)
  const setCharacter = useCharacterStore((state) => state.setCharacter)
  const unlockLocation = useNavigationStore((state) => state.unlockLocation)
  const selectedLocationId = useNavigationStore((state) => state.selectedLocationId)
  const restoreNavigation = useNavigationStore((state) => state.restore)
  const loadStory = useStoryStore((state) => state.loadStory)
  const restoreStory = useStoryStore((state) => state.restoreStory)
  const pendingCombat = useStoryStore((state) => state.pendingCombat)

  const [pastTitle, setPastTitle] = useState(false)

  useEffect(() => {
    if (character) unlockLocation('district7-pier14')
  }, [character, unlockLocation])

  useEffect(() => {
    if (!selectedLocationId) return
    // A restored save already adopted its Story via restoreStory — don't clobber it.
    if (useStoryStore.getState().story) return

    const story = new Story(mainInkJson)
    bindExternalFunctions(story)
    loadStory(story)
  }, [selectedLocationId, loadStory])

  const handleContinue = () => {
    const blob = loadGame()
    if (!blob || !blob.character) return
    const { character, unlockedLocationIds, selectedLocationId, flags, inkState, storyText } = blob

    setCharacter(character)
    restoreNavigation({ unlockedLocationIds, selectedLocationId, flags })

    if (inkState) {
      const story = new Story(mainInkJson)
      bindExternalFunctions(story)
      story.state.LoadJson(inkState)
      restoreStory(story, storyText)
    }

    setPastTitle(true)
  }

  if (!character && !pastTitle) {
    return (
      <TitleScreen
        canContinue={hasSave()}
        onContinue={handleContinue}
        onNewRun={() => setPastTitle(true)}
      />
    )
  }

  if (!character) return <CharacterCreationScreen />
  if (!selectedLocationId) return <OverworldScreen />
  return pendingCombat ? <CombatScreen enemyId={pendingCombat} /> : <StoryScreen />
}

export default App
