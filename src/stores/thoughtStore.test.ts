import { beforeEach, describe, expect, it } from 'vitest'
import { useThoughtStore } from './thoughtStore'
import type { ThoughtId } from '../content/thoughts'

describe('thoughtStore', () => {
  beforeEach(() => {
    useThoughtStore.setState(useThoughtStore.getInitialState(), true)
  })

  it('starts empty', () => {
    const state = useThoughtStore.getState()
    expect(state.unlockedThoughtIds.size).toBe(0)
    expect(state.enabledThoughtIds.size).toBe(0)
  })

  it('unlockThought is idempotent and does not enable', () => {
    useThoughtStore.getState().unlockThought('checkpoint-improviser')
    useThoughtStore.getState().unlockThought('checkpoint-improviser')

    const state = useThoughtStore.getState()
    expect(state.unlockedThoughtIds.size).toBe(1)
    expect(state.isUnlocked('checkpoint-improviser')).toBe(true)
    expect(state.isEnabled('checkpoint-improviser')).toBe(false)
  })

  it('enableThought no-ops unless the thought is unlocked, and is idempotent once enabled', () => {
    useThoughtStore.getState().enableThought('checkpoint-improviser')
    expect(useThoughtStore.getState().isEnabled('checkpoint-improviser')).toBe(false)

    useThoughtStore.getState().unlockThought('checkpoint-improviser')
    useThoughtStore.getState().enableThought('checkpoint-improviser')
    useThoughtStore.getState().enableThought('checkpoint-improviser')

    const state = useThoughtStore.getState()
    expect(state.enabledThoughtIds.size).toBe(1)
    expect(state.isEnabled('checkpoint-improviser')).toBe(true)
  })

  it('enableThought refuses a third thought once THOUGHT_SLOT_CAPACITY (2) is filled', () => {
    const thirdId = 'test-only-third-thought' as ThoughtId
    useThoughtStore.getState().unlockThought('checkpoint-improviser')
    useThoughtStore.getState().unlockThought('company-man-doubt')
    useThoughtStore.getState().unlockThought(thirdId)
    useThoughtStore.getState().enableThought('checkpoint-improviser')
    useThoughtStore.getState().enableThought('company-man-doubt')
    useThoughtStore.getState().enableThought(thirdId)

    const state = useThoughtStore.getState()
    expect(state.enabledThoughtIds.size).toBe(2)
    expect(state.isEnabled(thirdId)).toBe(false)
  })

  it('disableThought removes an enabled thought and is a no-op otherwise', () => {
    useThoughtStore.getState().unlockThought('checkpoint-improviser')
    useThoughtStore.getState().enableThought('checkpoint-improviser')
    useThoughtStore.getState().disableThought('checkpoint-improviser')
    expect(useThoughtStore.getState().isEnabled('checkpoint-improviser')).toBe(false)

    useThoughtStore.getState().disableThought('company-man-doubt')
    expect(useThoughtStore.getState().enabledThoughtIds.size).toBe(0)
  })

  it('insightBonusFor sums enabled thoughts targeting the same Insight', () => {
    expect(useThoughtStore.getState().insightBonusFor('hustle')).toBe(0)

    useThoughtStore.getState().unlockThought('checkpoint-improviser')
    useThoughtStore.getState().enableThought('checkpoint-improviser')
    expect(useThoughtStore.getState().insightBonusFor('hustle')).toBe(1)
    expect(useThoughtStore.getState().insightBonusFor('ledger')).toBe(0)
  })

  it('hydrate bulk-restores unlocked and enabled thoughts', () => {
    useThoughtStore.getState().hydrate({
      unlockedThoughtIds: ['checkpoint-improviser', 'company-man-doubt'],
      enabledThoughtIds: ['company-man-doubt'],
    })

    const state = useThoughtStore.getState()
    expect(state.isUnlocked('checkpoint-improviser')).toBe(true)
    expect(state.isUnlocked('company-man-doubt')).toBe(true)
    expect(state.isEnabled('company-man-doubt')).toBe(true)
    expect(state.isEnabled('checkpoint-improviser')).toBe(false)
  })

  it('reset clears progression back to empty', () => {
    useThoughtStore.getState().unlockThought('checkpoint-improviser')
    useThoughtStore.getState().enableThought('checkpoint-improviser')

    useThoughtStore.getState().reset()

    const state = useThoughtStore.getState()
    expect(state.unlockedThoughtIds.size).toBe(0)
    expect(state.enabledThoughtIds.size).toBe(0)
  })
})
