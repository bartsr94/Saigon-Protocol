import { useEffect } from 'react'
import { useUiStore } from './stores/uiStore'
import { useSettingsStore } from './stores/settingsStore'
import { useStoryStore } from './stores/storyStore'
import { useAudioStore } from './stores/audioStore'
import { TitleScreen } from './components/screens/TitleScreen'
import { CharacterCreationScreen } from './components/screens/CharacterCreationScreen'
import { OverworldScreen } from './components/screens/OverworldScreen'
import { DialogueScreen } from './components/screens/DialogueScreen'
import { OverlayHost } from './components/screens/OverlayHost'

function App() {
  const screen = useUiStore((s) => s.screen)
  // Story presence, not navigationStore.selectedLocationId, is the real
  // signal for "show DialogueScreen": the intro scene is an active story
  // with no location (docs/INTRO_SCENE_SPEC.md), a case selectedLocationId
  // was never meant to distinguish on its own.
  const activeStory = useStoryStore((s) => s.story)
  const highContrast = useSettingsStore((s) => s.highContrast)
  const largeText = useSettingsStore((s) => s.largeText)

  // Large Text scales the root font-size so every rem-based Tailwind text
  // utility site-wide scales with it — rem is relative to <html>, not to
  // any inner wrapper, so this can't be a scoped inline style.
  useEffect(() => {
    document.documentElement.style.fontSize = largeText ? '112.5%' : ''
  }, [largeText])

  // Title/Boot and Character Creation share one theme (docs/AUDIO_VOICEOVER_SPEC.md).
  // No corresponding "leave" branch here — deliberately: entering a real
  // scene already overrides this itself (the intro's own first-line `music`
  // tag, OverworldScreen.handleSelect's enterLocation, DialogueScreen's
  // enterOverworld), and reacting to every non-title/chargen screen here too
  // would race those calls within the same render pass.
  useEffect(() => {
    if (screen === 'title' || screen === 'chargen') {
      useAudioStore.getState().playTitleMusic()
    }
  }, [screen])

  return (
    <main className="min-h-svh bg-bg text-white" style={{ filter: highContrast ? 'contrast(1.18) saturate(1.1)' : undefined }}>
      {screen === 'title' && <TitleScreen />}
      {screen === 'chargen' && <CharacterCreationScreen />}
      {screen === 'game' && (activeStory ? <DialogueScreen /> : <OverworldScreen />)}
      <OverlayHost />
    </main>
  )
}

export default App
