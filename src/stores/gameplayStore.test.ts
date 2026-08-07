import { beforeEach, describe, expect, it } from 'vitest'
import { useGameplayStore } from './gameplayStore'

describe('gameplayStore', () => {
  beforeEach(() => {
    useGameplayStore.setState(useGameplayStore.getInitialState(), true)
  })

  it('starts with no current hub', () => {
    expect(useGameplayStore.getState().currentHubId).toBeNull()
  })

  it('enterHub and leaveHub set the current hub', () => {
    useGameplayStore.getState().enterHub('checkpoint')
    expect(useGameplayStore.getState().currentHubId).toBe('checkpoint')

    useGameplayStore.getState().leaveHub()
    expect(useGameplayStore.getState().currentHubId).toBeNull()
  })

  it('hydrate and reset restore expected hub state', () => {
    useGameplayStore.getState().hydrate({ currentHubId: 'deltaSquat' })
    expect(useGameplayStore.getState().currentHubId).toBe('deltaSquat')

    useGameplayStore.getState().reset()
    expect(useGameplayStore.getState().currentHubId).toBeNull()
  })
})
