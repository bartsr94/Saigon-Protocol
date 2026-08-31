// Dev-only toggle for showing walkable grid square ids (`x,y`) inline on
// HubGridView/DistrictStreetView. Same "standalone corner toggle" pattern as
// debugTextEditStore/debugMapEditStore: it needs to stay visible while
// navigating the actual game screens, not live inside DebugOverlay.

import { create } from 'zustand'

interface DebugTileIdState {
  enabled: boolean
  toggle: () => void
}

export const useDebugTileIdStore = create<DebugTileIdState>((set) => ({
  enabled: false,
  toggle: () => set((s) => ({ enabled: !s.enabled })),
}))
