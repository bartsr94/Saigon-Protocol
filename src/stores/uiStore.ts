// Top-level screen/overlay routing. Deliberately separate from
// navigationStore (which only tracks Overworld location state) and
// insightStore/storyStore (simulation state) — this store owns nothing but
// "what's on screen," per the same single-responsibility split the other
// stores already follow (Architecture §2).

import { create } from 'zustand'

export type Screen = 'title' | 'chargen' | 'game'
export type OverlayId = 'settings' | 'casefile' | 'character' | null

interface UiState {
  screen: Screen
  activeOverlay: OverlayId

  goToChargen: () => void
  goToGame: () => void
  goToTitle: () => void
  openOverlay: (overlay: Exclude<OverlayId, null>) => void
  closeOverlay: () => void
}

export const useUiStore = create<UiState>((set) => ({
  screen: 'title',
  activeOverlay: null,

  goToChargen: () => set({ screen: 'chargen' }),
  goToGame: () => set({ screen: 'game' }),
  goToTitle: () => set({ screen: 'title', activeOverlay: null }),
  openOverlay: (overlay) => set({ activeOverlay: overlay }),
  closeOverlay: () => set({ activeOverlay: null }),
}))
