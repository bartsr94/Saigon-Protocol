// Player-facing settings (docs/GAME_GUIDE.md §2): audio levels, the global
// voice toggle (Architecture §9), text speed, and accessibility options.
// Deliberately session-only, not part of a save blob (Architecture §8) —
// a persistent-preference tier, not a game-run snapshot, so it resets on
// reload by design. audioStore subscribes to this store for live volume/
// mute resync (Architecture §9).

import { create } from 'zustand'

export type TextSpeed = 'slow' | 'normal' | 'fast'

/** Milliseconds per character for the dialogue typewriter (docs/GAME_GUIDE.md §2.1). */
export const TEXT_SPEED_MS: Record<TextSpeed, number> = {
  slow: 45,
  normal: 22,
  fast: 8,
}

interface SettingsState {
  masterVolume: number
  sfxVolume: number
  musicVolume: number
  voiceVolume: number
  voiceEnabled: boolean

  textSpeed: TextSpeed
  instantText: boolean

  /** Initialized from prefers-reduced-motion; an explicit choice here always wins over the OS setting. */
  reduceMotion: boolean
  highContrast: boolean
  largeText: boolean

  setVolume: (channel: 'master' | 'sfx' | 'music' | 'voice', value: number) => void
  setVoiceEnabled: (enabled: boolean) => void
  setTextSpeed: (speed: TextSpeed) => void
  setInstantText: (enabled: boolean) => void
  setReduceMotion: (enabled: boolean) => void
  setHighContrast: (enabled: boolean) => void
  setLargeText: (enabled: boolean) => void
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const useSettingsStore = create<SettingsState>((set) => ({
  masterVolume: 85,
  sfxVolume: 100,
  musicVolume: 60,
  voiceVolume: 100,
  voiceEnabled: true,

  textSpeed: 'normal',
  instantText: false,

  reduceMotion: prefersReducedMotion(),
  highContrast: false,
  largeText: false,

  setVolume: (channel, value) => {
    const clamped = Math.min(100, Math.max(0, value))
    if (channel === 'master') set({ masterVolume: clamped })
    else if (channel === 'sfx') set({ sfxVolume: clamped })
    else if (channel === 'music') set({ musicVolume: clamped })
    else set({ voiceVolume: clamped })
  },
  setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
  setTextSpeed: (speed) => set({ textSpeed: speed }),
  setInstantText: (enabled) => set({ instantText: enabled }),
  setReduceMotion: (enabled) => set({ reduceMotion: enabled }),
  setHighContrast: (enabled) => set({ highContrast: enabled }),
  setLargeText: (enabled) => set({ largeText: enabled }),
}))
