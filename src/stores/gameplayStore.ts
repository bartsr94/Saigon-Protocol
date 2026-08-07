import { create } from 'zustand'
import type { HubId } from '../content/locationHubs'

interface GameplayState {
  currentHubId: HubId | null
  enterHub: (hubId: HubId) => void
  leaveHub: () => void
  hydrate: (state: { currentHubId: HubId | null }) => void
  reset: () => void
}

export const useGameplayStore = create<GameplayState>((set) => ({
  currentHubId: null,

  enterHub: (hubId) => set({ currentHubId: hubId }),
  leaveHub: () => set({ currentHubId: null }),
  hydrate: (state) => set({ currentHubId: state.currentHubId }),
  reset: () => set({ currentHubId: null }),
}))
