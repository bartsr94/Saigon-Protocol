import { create } from 'zustand'

const MUTE_KEY = 'saigon-protocol-sfx-muted'

interface AudioStore {
  muted: boolean
  setMuted: (muted: boolean) => void
  toggleMuted: () => void
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  muted: localStorage.getItem(MUTE_KEY) === 'true',

  setMuted: (muted) => {
    localStorage.setItem(MUTE_KEY, String(muted))
    set({ muted })
  },

  toggleMuted: () => get().setMuted(!get().muted),
}))
