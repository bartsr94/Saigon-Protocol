import { beforeEach, describe, expect, it } from 'vitest'
import { useGameplayStore } from './gameplayStore'

describe('gameplayStore', () => {
  beforeEach(() => {
    useGameplayStore.setState(useGameplayStore.getInitialState(), true)
  })

  it('starts with no current hub', () => {
    expect(useGameplayStore.getState().currentHubId).toBeNull()
    expect(useGameplayStore.getState().playerPosition).toBeNull()
  })

  it('enterHub places the player on the grid hub entry tile and reveals around it, leaveHub clears both', () => {
    useGameplayStore.getState().enterHub('checkpoint')
    expect(useGameplayStore.getState().currentHubId).toBe('checkpoint')
    expect(useGameplayStore.getState().playerPosition).toEqual({ x: 4, y: 1 })
    expect(useGameplayStore.getState().revealedTiles.checkpoint?.has('4,1')).toBe(true)

    useGameplayStore.getState().leaveHub()
    expect(useGameplayStore.getState().currentHubId).toBeNull()
    expect(useGameplayStore.getState().playerPosition).toBeNull()
  })

  it('enterHub leaves playerPosition null for a cardList hub', () => {
    useGameplayStore.getState().enterHub('noodleStall')
    expect(useGameplayStore.getState().currentHubId).toBe('noodleStall')
    expect(useGameplayStore.getState().playerPosition).toBeNull()
  })

  it('moveTo updates position and accumulates revealed tiles for the current hub, and is a no-op outside a hub', () => {
    useGameplayStore.getState().moveTo({ x: 4, y: 2 })
    expect(useGameplayStore.getState().playerPosition).toBeNull()

    useGameplayStore.getState().enterHub('checkpoint')
    useGameplayStore.getState().moveTo({ x: 4, y: 2 })
    expect(useGameplayStore.getState().playerPosition).toEqual({ x: 4, y: 2 })
    const revealed = useGameplayStore.getState().revealedTiles.checkpoint!
    expect(revealed.has('4,1')).toBe(true) // stays revealed from entry
    expect(revealed.has('4,2')).toBe(true)
    expect(revealed.has('4,3')).toBe(true) // "+"-shaped radius around the new position
  })

  it('activePoiAt finds a POI in a grid hub and returns null for a cardList hub or empty tile', () => {
    expect(useGameplayStore.getState().activePoiAt('checkpoint', { x: 2, y: 2 })?.id).toBe('checkpoint-mei-hong')
    expect(useGameplayStore.getState().activePoiAt('checkpoint', { x: 1, y: 1 })).toBeNull()
    expect(useGameplayStore.getState().activePoiAt('noodleStall', { x: 0, y: 0 })).toBeNull()
  })

  it('hydrate and reset restore expected gameplay state, rebuilding revealedTiles as Sets', () => {
    useGameplayStore.getState().hydrate({
      currentHubId: 'deltaSquat',
      playerPosition: { x: 3, y: 3 },
      revealedTiles: { checkpoint: ['4,1', '4,2'] },
    })
    const state = useGameplayStore.getState()
    expect(state.currentHubId).toBe('deltaSquat')
    expect(state.playerPosition).toEqual({ x: 3, y: 3 })
    expect(state.revealedTiles.checkpoint?.has('4,2')).toBe(true)

    useGameplayStore.getState().reset()
    expect(useGameplayStore.getState().currentHubId).toBeNull()
    expect(useGameplayStore.getState().playerPosition).toBeNull()
    expect(useGameplayStore.getState().revealedTiles).toEqual({})
  })
})
