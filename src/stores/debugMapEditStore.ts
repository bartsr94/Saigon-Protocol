// Dev-only toggle for the live map editor (src/components/screens/MapEditorPanel.tsx,
// vite-plugins/debugMapEditPlugin.ts). Sibling to debugTextEditStore.ts —
// same pattern, off by default, flipped from a standalone App.tsx button
// rather than a DebugOverlay submenu, since it needs to gate an "Edit Map"
// button on whichever hub/street screen is currently showing.

import { create } from 'zustand'

interface DebugMapEditState {
  enabled: boolean
  toggle: () => void
}

export const useDebugMapEditStore = create<DebugMapEditState>((set) => ({
  enabled: false,
  toggle: () => set((s) => ({ enabled: !s.enabled })),
}))
