import { create } from 'zustand'

export interface LocationMeta {
  id: string
  name: string
  blurb: string
  thumbnail: string
}

interface NavigationStore {
  unlockedLocationIds: string[]
  selectedLocationId: string | null
  flags: Record<string, boolean>
  unlockLocation: (id: string) => void
  selectLocation: (id: string | null) => void
  setFlag: (key: string, value: boolean) => void
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  unlockedLocationIds: [],
  selectedLocationId: null,
  flags: {},

  unlockLocation: (id) =>
    set((state) =>
      state.unlockedLocationIds.includes(id)
        ? state
        : { unlockedLocationIds: [...state.unlockedLocationIds, id] },
    ),

  selectLocation: (id) => set({ selectedLocationId: id }),

  setFlag: (key, value) =>
    set((state) => ({ flags: { ...state.flags, [key]: value } })),
}))
