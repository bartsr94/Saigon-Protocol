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
import { FailStateOverlay } from './components/screens/FailStateOverlay'

function App() {
  const screen = useUiStore((s) => s.screen)
  // Story presence, not navigationStore.selectedLocationId, is the real
  // signal for "show DialogueScreen": the intro scene is an active story
  // with no location (docs/GAME_GUIDE.md), a case selectedLocationId
  // was never meant to distinguish on its own.
  const activeStory = useStoryStore((s) => s.story)
  const highContrast = useSettingsStore((s) => s.highContrast)
  const largeText = useSettingsStore((s) => s.largeText)
  const reduceMotion = useSettingsStore((s) => s.reduceMotion)

  // Large Text scales the root font-size so every rem-based Tailwind text
  // utility site-wide scales with it — rem is relative to <html>, not to
  // any inner wrapper, so this can't be a scoped inline style.
  useEffect(() => {
    document.documentElement.style.fontSize = largeText ? '112.5%' : ''
  }, [largeText])

  // Reduce Motion is seeded from prefers-reduced-motion but is an explicit,
  // overridable choice from here on (settingsStore.ts) — so motion-sensitive
  // CSS (index.css's .glitch-text rules) keys off this data attribute rather
  // than the raw media query, the same root-attribute pattern highContrast
  // would use if it needed CSS (not just inline style) to reach.
  useEffect(() => {
    document.documentElement.dataset.reduceMotion = reduceMotion ? 'true' : 'false'
  }, [reduceMotion])

  // Title/Boot and Character Creation share one theme (docs/GAME_GUIDE.md).
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
      <FailStateOverlay />
    </main>
  )
}

export default App
