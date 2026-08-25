// Title/Boot (docs/GAME_GUIDE.md §2.1). Continue loads the
// most recently written save slot (Save/Persistence Layer, docs/GAME_GUIDE.md
// §7) — disabled when none exists rather than faked.
// No key art asset exists yet either (art direction is a separate pass);
// the gradient below is a stand-in, not a claim of finished art.

import { useEffect } from 'react'
import { CyberButton, GlitchText } from '../ui'
import { useUiStore } from '../../stores/uiStore'
import { useSaveStore } from '../../stores/saveStore'
import { useStoryStore } from '../../stores/storyStore'
import { useAudioStore } from '../../stores/audioStore'
import { useCaseStore } from '../../stores/caseStore'
import { useConversationStore } from '../../stores/conversationStore'
import { useGameplayStore } from '../../stores/gameplayStore'
import { useInsightStore } from '../../stores/insightStore'
import { useNavigationStore } from '../../stores/navigationStore'
import { useThoughtStore } from '../../stores/thoughtStore'
import { useRelationshipStore } from '../../stores/relationshipStore'
import { LOCATIONS } from '../../content/locations'

export function TitleScreen() {
  const goToChargen = useUiStore((s) => s.goToChargen)
  const goToGame = useUiStore((s) => s.goToGame)
  const openOverlay = useUiStore((s) => s.openOverlay)
  const slots = useSaveStore((s) => s.slots)
  const refreshSlots = useSaveStore((s) => s.refreshSlots)
  const loadMostRecent = useSaveStore((s) => s.loadMostRecent)

  useEffect(() => {
    refreshSlots()
  }, [refreshSlots])

  const canContinue = slots.length > 0

  function handleNewGame() {
    useStoryStore.getState().reset()
    useInsightStore.getState().reset()
    useNavigationStore.getState().reset()
    useGameplayStore.getState().reset()
    useCaseStore.getState().reset()
    useConversationStore.getState().reset()
    useThoughtStore.getState().reset()
    useRelationshipStore.getState().reset()
    goToChargen()
  }

  function handleContinue() {
    if (!loadMostRecent()) return
    // A loaded save with no active story lands on the Overworld — the title
    // theme wouldn't otherwise stop there (docs/GAME_GUIDE.md; a mid-scene
    // save's own restored line tags already take care of this). Hub restores
    // reuse their location's baseline mood instead.
    if (!useStoryStore.getState().story) {
      const selectedLocationId = useNavigationStore.getState().selectedLocationId
      if (selectedLocationId) {
        useAudioStore.getState().enterLocation(LOCATIONS[selectedLocationId])
      } else {
        useAudioStore.getState().enterOverworld()
      }
    }
    goToGame()
  }

  return (
    <div
      className="relative flex min-h-svh flex-col items-center justify-center gap-16 p-8"
      style={{ background: 'radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--color-chrome-primary) 8%, transparent), var(--color-bg) 70%)' }}
    >
      {/* HUD corner-bracket accents (UI_PASS_SPEC.md §1) — decorative frame, pointer-events-none. */}
      <div className="pointer-events-none absolute left-5 top-5 h-24 w-24 border-l-2 border-t-2 border-chrome-primary/40 sm:h-36 sm:w-36" />
      <div className="pointer-events-none absolute bottom-5 right-5 h-24 w-24 border-b-2 border-r-2 border-chrome-primary/40 sm:h-36 sm:w-36" />

      <h1 className="font-display text-5xl font-black uppercase tracking-[0.5em] text-white [text-shadow:0_0_15px_var(--color-chrome-primary),0_0_30px_var(--color-chrome-primary)]">
        <GlitchText text="Saigon Protocol" loop />
      </h1>

      <nav className="flex w-full max-w-sm flex-col gap-4">
        <CyberButton tag="NG.01" onClick={handleNewGame}>
          New Game
        </CyberButton>
        <CyberButton tag="LD.02" disabled={!canContinue} title={canContinue ? undefined : 'No save data yet'} onClick={handleContinue}>
          Continue
        </CyberButton>
        <CyberButton tag="CFG.03" onClick={() => openOverlay('settings')}>
          Settings
        </CyberButton>
        <CyberButton tag="EXT.04" onClick={() => window.close()}>
          Quit
        </CyberButton>
      </nav>
    </div>
  )
}
