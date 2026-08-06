import { beforeEach, describe, expect, it } from 'vitest'
import { useUiStore } from './uiStore'

describe('uiStore', () => {
  beforeEach(() => {
    useUiStore.setState(useUiStore.getInitialState(), true)
  })

  it('starts on the title screen with no overlay', () => {
    const state = useUiStore.getState()
    expect(state.screen).toBe('title')
    expect(state.activeOverlay).toBeNull()
  })

  it('goToChargen then goToGame moves title -> chargen -> game', () => {
    useUiStore.getState().goToChargen()
    expect(useUiStore.getState().screen).toBe('chargen')

    useUiStore.getState().goToGame()
    expect(useUiStore.getState().screen).toBe('game')
  })

  it('openOverlay/closeOverlay toggle the active overlay', () => {
    useUiStore.getState().openOverlay('settings')
    expect(useUiStore.getState().activeOverlay).toBe('settings')

    useUiStore.getState().openOverlay('casefile')
    expect(useUiStore.getState().activeOverlay).toBe('casefile')

    useUiStore.getState().closeOverlay()
    expect(useUiStore.getState().activeOverlay).toBeNull()
  })

  it('goToTitle resets both screen and overlay', () => {
    useUiStore.getState().goToGame()
    useUiStore.getState().openOverlay('settings')

    useUiStore.getState().goToTitle()
    expect(useUiStore.getState().screen).toBe('title')
    expect(useUiStore.getState().activeOverlay).toBeNull()
  })
})
