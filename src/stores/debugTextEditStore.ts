// Dev-only toggle for inline blurb/description editing
// (src/components/debug/EditableText.tsx, vite-plugins/debugTextEditPlugin.ts).
// A standalone toggle rather than a DebugOverlay submenu — the point is
// editing text on the screen you're already looking at, not a separate
// console (DebugOverlay.tsx's own "flat command list, not a real console"
// precedent doesn't fit a feature that needs to render inline everywhere).

import { create } from 'zustand'

interface DebugTextEditState {
  enabled: boolean
  toggle: () => void
}

export const useDebugTextEditStore = create<DebugTextEditState>((set) => ({
  enabled: false,
  toggle: () => set((s) => ({ enabled: !s.enabled })),
}))
