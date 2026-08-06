import { beforeEach, describe, expect, it } from 'vitest'
import { useSettingsStore } from './settingsStore'

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState(useSettingsStore.getInitialState(), true)
  })

  it('clamps volume to 0-100', () => {
    useSettingsStore.getState().setVolume('sfx', 150)
    expect(useSettingsStore.getState().sfxVolume).toBe(100)

    useSettingsStore.getState().setVolume('music', -20)
    expect(useSettingsStore.getState().musicVolume).toBe(0)
  })

  it('routes each channel to its own field', () => {
    useSettingsStore.getState().setVolume('master', 10)
    useSettingsStore.getState().setVolume('voice', 20)
    const state = useSettingsStore.getState()
    expect(state.masterVolume).toBe(10)
    expect(state.voiceVolume).toBe(20)
    expect(state.sfxVolume).toBe(100) // untouched
  })

  it('toggles accessibility and text-speed settings', () => {
    useSettingsStore.getState().setReduceMotion(true)
    useSettingsStore.getState().setHighContrast(true)
    useSettingsStore.getState().setLargeText(true)
    useSettingsStore.getState().setTextSpeed('fast')
    useSettingsStore.getState().setInstantText(true)

    const state = useSettingsStore.getState()
    expect(state.reduceMotion).toBe(true)
    expect(state.highContrast).toBe(true)
    expect(state.largeText).toBe(true)
    expect(state.textSpeed).toBe('fast')
    expect(state.instantText).toBe(true)
  })
})
