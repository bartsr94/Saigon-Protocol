import { beforeEach, describe, expect, it } from 'vitest'
import { useInsightStore } from './insightStore'
import { INSIGHT_MAX } from '../content/insights'

describe('insightStore', () => {
  beforeEach(() => {
    useInsightStore.setState(useInsightStore.getInitialState(), true)
  })

  it('selectArchetype applies the baseline distribution and fills wellbeing to max', () => {
    useInsightStore.getState().selectArchetype('enforcer')
    const state = useInsightStore.getState()
    expect(state.levels.muscleMemory).toBe(4)
    expect(state.levels.ledger).toBe(1)
    expect(state.freePointsRemaining).toBe(3)
    expect(state.vitality.current).toBe(state.vitality.max)
    expect(state.composure.current).toBe(state.composure.max)
  })

  it('setPlayerName stores the name entered during Character Creation confirm', () => {
    useInsightStore.getState().setPlayerName('Mai Trần')
    expect(useInsightStore.getState().playerName).toBe('Mai Trần')
  })

  it('spendFreePoint raises a level and consumes the pool, refundFreePoint reverses it', () => {
    useInsightStore.getState().selectArchetype('enforcer')
    useInsightStore.getState().spendFreePoint('ledger')
    expect(useInsightStore.getState().levels.ledger).toBe(2)
    expect(useInsightStore.getState().freePointsRemaining).toBe(2)

    useInsightStore.getState().refundFreePoint('ledger')
    expect(useInsightStore.getState().levels.ledger).toBe(1)
    expect(useInsightStore.getState().freePointsRemaining).toBe(3)
  })

  it('refundFreePoint refuses to drop a level below its archetype baseline', () => {
    useInsightStore.getState().selectArchetype('enforcer')
    useInsightStore.getState().refundFreePoint('ledger') // already at baseline (1)
    expect(useInsightStore.getState().levels.ledger).toBe(1)
    expect(useInsightStore.getState().freePointsRemaining).toBe(3)
  })

  it('spendFreePoint refuses to exceed the level cap or an empty pool', () => {
    useInsightStore.getState().selectArchetype('boringCop')
    const store = useInsightStore.getState()
    for (let i = 0; i < INSIGHT_MAX + 5; i++) {
      useInsightStore.getState().spendFreePoint('graft')
    }
    expect(useInsightStore.getState().levels.graft).toBeLessThanOrEqual(INSIGHT_MAX)
    expect(store.freePointsRemaining).toBeGreaterThanOrEqual(0)
  })

  it('a Red check can only be resolved once; a White check has no such restriction', () => {
    useInsightStore.getState().selectArchetype('enforcer')
    const first = useInsightStore.getState().rollCheck('muscleMemory', 6, 'confront-maren', 'red')
    expect(first).not.toBeNull()
    const second = useInsightStore.getState().rollCheck('muscleMemory', 6, 'confront-maren', 'red')
    expect(second).toBeNull()

    const whiteA = useInsightStore.getState().rollCheck('muscleMemory', 6, 'search-office', 'white')
    const whiteB = useInsightStore.getState().rollCheck('muscleMemory', 6, 'search-office', 'white')
    expect(whiteA).not.toBeNull()
    expect(whiteB).not.toBeNull()
  })

  it('damageVitality reaching zero sets failState to vitality and does not go negative', () => {
    useInsightStore.getState().selectArchetype('enforcer')
    const max = useInsightStore.getState().vitality.max
    useInsightStore.getState().damageVitality(max + 10)
    const state = useInsightStore.getState()
    expect(state.vitality.current).toBe(0)
    expect(state.failState).toBe('vitality')
  })

  it('the first fail-state reached is sticky even if the other track also hits zero', () => {
    useInsightStore.getState().selectArchetype('enforcer')
    useInsightStore.getState().damageVitality(999)
    useInsightStore.getState().damageComposure(999)
    expect(useInsightStore.getState().failState).toBe('vitality')
  })

  it('healVitality/healComposure never exceed max', () => {
    useInsightStore.getState().selectArchetype('enforcer')
    const { vitality } = useInsightStore.getState()
    useInsightStore.getState().healVitality(999)
    expect(useInsightStore.getState().vitality.current).toBe(vitality.max)
  })
})
