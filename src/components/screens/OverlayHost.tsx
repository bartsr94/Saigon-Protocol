// Renders whichever overlay is active on top of the current screen — per
// docs/GAME_GUIDE.md §2, overlays pause the view beneath rather than replacing it.

import { useEffect } from 'react'
import { useUiStore } from '../../stores/uiStore'
import { useAudioStore } from '../../stores/audioStore'
import { SettingsOverlay } from './SettingsOverlay'
import { CasefileOverlay } from './CasefileOverlay'
import { CharacterOverlay } from './CharacterOverlay'
import { DebugOverlay } from './DebugOverlay'

export function OverlayHost() {
  const activeOverlay = useUiStore((s) => s.activeOverlay)
  const closeOverlay = useUiStore((s) => s.closeOverlay)

  // OverlayHost itself never unmounts (App.tsx renders it unconditionally),
  // so an effect on activeOverlay is the open/close boundary, not mount/unmount.
  useEffect(() => {
    if (!activeOverlay) return
    useAudioStore.getState().playSfx('overlayOpen')
    return () => useAudioStore.getState().playSfx('overlayClose')
  }, [activeOverlay])

  if (!activeOverlay) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={closeOverlay}>
      {activeOverlay === 'settings' && <SettingsOverlay />}
      {activeOverlay === 'casefile' && <CasefileOverlay />}
      {activeOverlay === 'character' && <CharacterOverlay />}
      {activeOverlay === 'debug' && <DebugOverlay />}
    </div>
  )
}
