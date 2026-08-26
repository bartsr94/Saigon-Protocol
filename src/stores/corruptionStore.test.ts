import { beforeEach, describe, expect, it } from 'vitest'
import { useCorruptionStore } from './corruptionStore'

describe('corruptionStore', () => {
  beforeEach(() => {
    useCorruptionStore.setState(useCorruptionStore.getInitialState(), true)
  })

  it('starts empty', () => {
    expect(useCorruptionStore.getState().markedActionIds.size).toBe(0)
    expect(useCorruptionStore.getState().corruptionCount()).toBe(0)
  })

  it('markCorruptAction is idempotent per action id', () => {
    useCorruptionStore.getState().markCorruptAction('checkpoint-envelope')
    useCorruptionStore.getState().markCorruptAction('checkpoint-envelope')

    expect(useCorruptionStore.getState().corruptionCount()).toBe(1)
  })

  it('corruptionCount reflects the number of distinct marked actions', () => {
    useCorruptionStore.getState().markCorruptAction('checkpoint-envelope')
    useCorruptionStore.getState().markCorruptAction('undercanopy-quiet-cut')

    expect(useCorruptionStore.getState().corruptionCount()).toBe(2)
  })

  it('hydrate bulk-restores marked actions', () => {
    useCorruptionStore.getState().hydrate({ markedActionIds: ['checkpoint-envelope', 'undercanopy-quiet-cut'] })

    expect(useCorruptionStore.getState().corruptionCount()).toBe(2)
  })

  it('reset clears the tally back to empty', () => {
    useCorruptionStore.getState().markCorruptAction('checkpoint-envelope')

    useCorruptionStore.getState().reset()

    expect(useCorruptionStore.getState().corruptionCount()).toBe(0)
  })
})
