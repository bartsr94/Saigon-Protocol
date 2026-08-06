// Title/Boot (UI_DESIGN §6.1 / UI_VISUAL_STYLE_SPEC §5.5). Continue loads the
// most recently written save slot (Save/Persistence Layer, docs/
// SAVE_PERSISTENCE_SPEC.md) — disabled when none exists rather than faked.
// No key art asset exists yet either (art direction is a separate pass);
// the gradient below is a stand-in, not a claim of finished art.

import { CyberButton, GlitchText } from '../ui'
import { useUiStore } from '../../stores/uiStore'
import { useSaveStore } from '../../stores/saveStore'

export function TitleScreen() {
  const goToChargen = useUiStore((s) => s.goToChargen)
  const goToGame = useUiStore((s) => s.goToGame)
  const openOverlay = useUiStore((s) => s.openOverlay)
  const hasAnySave = useSaveStore((s) => s.hasAnySave)
  const loadMostRecent = useSaveStore((s) => s.loadMostRecent)
  const canContinue = hasAnySave()

  function handleContinue() {
    if (loadMostRecent()) goToGame()
  }

  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center gap-16 p-8"
      style={{ background: 'radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--color-chrome-primary) 8%, transparent), var(--color-bg) 70%)' }}
    >
      <h1 className="font-display text-5xl font-black uppercase tracking-[0.5em] text-white [text-shadow:0_0_15px_var(--color-chrome-primary),0_0_30px_var(--color-chrome-primary)]">
        <GlitchText text="Saigon Protocol" loop />
      </h1>

      <nav className="flex w-full max-w-sm flex-col gap-4">
        <CyberButton tag="NG.01" onClick={goToChargen}>
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
