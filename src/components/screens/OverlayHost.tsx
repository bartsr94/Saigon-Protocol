// Renders whichever overlay is active on top of the current screen — per
// UI_DESIGN §2, overlays pause the view beneath rather than replacing it.

import { useUiStore } from '../../stores/uiStore'
import { SettingsOverlay } from './SettingsOverlay'
import { CasefileOverlay } from './CasefileOverlay'

export function OverlayHost() {
  const activeOverlay = useUiStore((s) => s.activeOverlay)
  const closeOverlay = useUiStore((s) => s.closeOverlay)

  if (!activeOverlay) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={closeOverlay}>
      {activeOverlay === 'settings' && <SettingsOverlay />}
      {activeOverlay === 'casefile' && <CasefileOverlay />}
    </div>
  )
}
