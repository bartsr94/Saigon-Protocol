// Dev-only toggle for the live map editor (src/components/screens/MapEditorPanel.tsx,
// vite-plugins/debugMapEditPlugin.ts). Sibling to debugTextEditStore.ts —
// same pattern, off by default, flipped from a standalone App.tsx button
// rather than a DebugOverlay submenu, since it needs to gate an "Edit Map"
// button on whichever hub/street screen is currently showing.
//
// `editingMap` (whether the full-screen Map Editor modal is actually open,
// as opposed to just the feature being unlocked via `enabled`) used to be
// local state inside HubGridView/DistrictStreetView. Lifted here
// (UI_PASS_SPEC.md §3) so LocationHubScreen/DistrictStreetScreen/App.tsx can
// see it too and keep it mutually exclusive with NavRail's overlay buttons
// and the other dev corner buttons — two independent full-screen z-50
// modals stacking was a real (if dev-only) overlap bug.

import { create } from 'zustand'

interface DebugMapEditState {
  enabled: boolean
  toggle: () => void
  editingMap: boolean
  openMapEditor: () => void
  closeMapEditor: () => void
}

export const useDebugMapEditStore = create<DebugMapEditState>((set) => ({
  enabled: false,
  toggle: () => set((s) => ({ enabled: !s.enabled })),
  editingMap: false,
  openMapEditor: () => set({ editingMap: true }),
  closeMapEditor: () => set({ editingMap: false }),
}))
