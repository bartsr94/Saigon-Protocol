import { beforeEach, describe, expect, it } from 'vitest'
import { useNavigationStore } from './navigationStore'
import { LOCATIONS, LOCATION_IDS } from '../content/locations'

describe('navigationStore', () => {
  beforeEach(() => {
    useNavigationStore.setState(useNavigationStore.getInitialState(), true)
  })

  it('seeds unlockedLocationIds from LOCATIONS.unlockedByDefault', () => {
    const { unlockedLocationIds } = useNavigationStore.getState()
    for (const id of LOCATION_IDS) {
      expect(unlockedLocationIds.has(id)).toBe(LOCATIONS[id].unlockedByDefault)
    }
  })

  it('selectLocation is a no-op for a locked location', () => {
    useNavigationStore.getState().selectLocation('noodleStall')
    expect(useNavigationStore.getState().selectedLocationId).toBeNull()
  })

  it('unlockLocation then selectLocation succeeds, and unlocking is idempotent', () => {
    useNavigationStore.getState().unlockLocation('noodleStall')
    useNavigationStore.getState().unlockLocation('noodleStall')
    expect(useNavigationStore.getState().unlockedLocationIds.has('noodleStall')).toBe(true)

    useNavigationStore.getState().selectLocation('noodleStall')
    expect(useNavigationStore.getState().selectedLocationId).toBe('noodleStall')
  })

  it('returnToOverworld clears the selection', () => {
    useNavigationStore.getState().selectLocation('checkpoint') // unlocked by default
    expect(useNavigationStore.getState().selectedLocationId).toBe('checkpoint')

    useNavigationStore.getState().returnToOverworld()
    expect(useNavigationStore.getState().selectedLocationId).toBeNull()
  })

  it('hydrate bulk-restores state from a save blob, including rebuilding unlockedLocationIds as a Set', () => {
    useNavigationStore.getState().hydrate({
      unlockedLocationIds: ['checkpoint', 'deltaSquat'],
      selectedLocationId: 'deltaSquat',
    })

    const state = useNavigationStore.getState()
    expect(state.unlockedLocationIds.has('checkpoint')).toBe(true)
    expect(state.unlockedLocationIds.has('deltaSquat')).toBe(true)
    expect(state.unlockedLocationIds.has('noodleStall')).toBe(false)
    expect(state.selectedLocationId).toBe('deltaSquat')
  })
})
