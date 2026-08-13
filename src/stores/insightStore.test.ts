import { beforeEach, describe, expect, it } from 'vitest'
import { useInsightStore } from './insightStore'
import { useThoughtStore } from './thoughtStore'
import { INSIGHT_MAX, INSIGHT_XP_TO_LEVEL } from '../content/insights'

describe('insightStore', () => {
  beforeEach(() => {
    useInsightStore.setState(useInsightStore.getInitialState(), true)
    useThoughtStore.setState(useThoughtStore.getInitialState(), true)
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

  it('selectPortrait is independent of selectArchetype — neither clears the other', () => {
    useInsightStore.getState().selectPortrait('p3')
    useInsightStore.getState().selectArchetype('enforcer')
    expect(useInsightStore.getState().portraitId).toBe('p3')

    useInsightStore.getState().selectArchetype('wire')
    expect(useInsightStore.getState().portraitId).toBe('p3')
    expect(useInsightStore.getState().archetype).toBe('wire')
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

  it('hydrate bulk-restores state from a save blob, including rebuilding consumedRedChecks/xpAwardedCheckIds as Sets', () => {
    useInsightStore.getState().hydrate({
      archetype: 'wire',
      portraitId: 'p5',
      playerName: 'Restored Name',
      levels: { ledger: 2, graft: 4, muscleMemory: 2, root: 2, static: 2, hustle: 2, mask: 1 },
      freePointsRemaining: 1,
      vitality: { current: 5, max: 12 },
      composure: { current: 3, max: 10 },
      consumedRedChecks: ['checkA', 'checkB'],
      xp: { ledger: 1, graft: 0, muscleMemory: 2, root: 0, static: 0, hustle: 0, mask: 0 },
      xpAwardedCheckIds: ['checkA', 'checkC'],
      failState: 'composure',
    })

    const state = useInsightStore.getState()
    expect(state.archetype).toBe('wire')
    expect(state.portraitId).toBe('p5')
    expect(state.playerName).toBe('Restored Name')
    expect(state.levels.graft).toBe(4)
    expect(state.freePointsRemaining).toBe(1)
    expect(state.vitality).toEqual({ current: 5, max: 12 })
    expect(state.composure).toEqual({ current: 3, max: 10 })
    expect(state.isRedCheckConsumed('checkA')).toBe(true)
    expect(state.isRedCheckConsumed('checkB')).toBe(true)
    expect(state.isRedCheckConsumed('checkC')).toBe(false)
    expect(state.xp.muscleMemory).toBe(2)
    expect(state.xpAwardedCheckIds.has('checkA')).toBe(true)
    expect(state.xpAwardedCheckIds.has('checkC')).toBe(true)
    expect(state.xpAwardedCheckIds.has('checkB')).toBe(false)
    expect(state.failState).toBe('composure')
  })

  it('rollCheck awards Insight XP once per unique checkId regardless of retries or pass/fail', () => {
    useInsightStore.getState().selectArchetype('enforcer')
    useInsightStore.getState().rollCheck('ledger', 6, 'topic-loop-question', 'white')
    useInsightStore.getState().rollCheck('ledger', 6, 'topic-loop-question', 'white')
    useInsightStore.getState().rollCheck('ledger', 6, 'topic-loop-question', 'white')
    expect(useInsightStore.getState().xp.ledger).toBe(1)

    useInsightStore.getState().rollCheck('ledger', 6, 'a-different-question', 'white')
    expect(useInsightStore.getState().xp.ledger).toBe(2)
  })

  it('rollCheck levels an Insight up once its XP crosses INSIGHT_XP_TO_LEVEL, capped at INSIGHT_MAX', () => {
    useInsightStore.getState().selectArchetype('enforcer')
    const startingLevel = useInsightStore.getState().levels.ledger

    for (let i = 0; i < INSIGHT_XP_TO_LEVEL; i++) {
      useInsightStore.getState().rollCheck('ledger', 6, `xp-check-${i}`, 'white')
    }

    const state = useInsightStore.getState()
    expect(state.levels.ledger).toBe(startingLevel + 1)
    expect(state.xp.ledger).toBe(0)

    for (let i = 0; i < INSIGHT_XP_TO_LEVEL * INSIGHT_MAX; i++) {
      useInsightStore.getState().rollCheck('ledger', 6, `xp-overflow-check-${i}`, 'white')
    }
    expect(useInsightStore.getState().levels.ledger).toBeLessThanOrEqual(INSIGHT_MAX)
  })

  it("rollCheck's modifier includes any enabled thought's Insight bonus", () => {
    useInsightStore.getState().selectArchetype('enforcer')
    const baseLevel = useInsightStore.getState().levels.hustle

    useThoughtStore.getState().unlockThought('checkpoint-improviser')
    useThoughtStore.getState().enableThought('checkpoint-improviser')

    const result = useInsightStore.getState().rollCheck('hustle', 6, 'thought-bonus-check', 'white')
    expect(result?.modifier).toBe(baseLevel + 1)
  })
})
