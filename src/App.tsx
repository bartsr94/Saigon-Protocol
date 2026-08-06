import { useEffect } from 'react'
import { useUiStore } from './stores/uiStore'
import { useSettingsStore } from './stores/settingsStore'
import { useNavigationStore } from './stores/navigationStore'
import { TitleScreen } from './components/screens/TitleScreen'
import { CharacterCreationScreen } from './components/screens/CharacterCreationScreen'
import { OverworldScreen } from './components/screens/OverworldScreen'
import { DialogueScreen } from './components/screens/DialogueScreen'
import { OverlayHost } from './components/screens/OverlayHost'

function App() {
  const screen = useUiStore((s) => s.screen)
  const selectedLocationId = useNavigationStore((s) => s.selectedLocationId)
  const highContrast = useSettingsStore((s) => s.highContrast)
  const largeText = useSettingsStore((s) => s.largeText)

  // Large Text scales the root font-size so every rem-based Tailwind text
  // utility site-wide scales with it — rem is relative to <html>, not to
  // any inner wrapper, so this can't be a scoped inline style.
  useEffect(() => {
    document.documentElement.style.fontSize = largeText ? '112.5%' : ''
  }, [largeText])

  return (
    <main className="min-h-svh bg-bg text-white" style={{ filter: highContrast ? 'contrast(1.18) saturate(1.1)' : undefined }}>
      {screen === 'title' && <TitleScreen />}
      {screen === 'chargen' && <CharacterCreationScreen />}
      {screen === 'game' && (selectedLocationId ? <DialogueScreen /> : <OverworldScreen />)}
      <OverlayHost />
    </main>
  )
}

export default App
