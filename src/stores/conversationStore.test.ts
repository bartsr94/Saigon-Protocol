import { beforeEach, describe, expect, it } from 'vitest'
import { useConversationStore } from './conversationStore'

describe('conversationStore', () => {
  beforeEach(() => {
    useConversationStore.setState(useConversationStore.getInitialState(), true)
  })

  it('starts with no NPCs met and no saved conversation state', () => {
    const state = useConversationStore.getState()
    expect(state.metNpcIds.size).toBe(0)
    expect(state.hasMet('meiHong')).toBe(false)
    expect(state.getConversationState('meiHong')).toBeUndefined()
  })

  it('markMet is idempotent — calling it twice does not grow the Set or replace it unnecessarily', () => {
    useConversationStore.getState().markMet('meiHong')
    const setAfterFirst = useConversationStore.getState().metNpcIds

    useConversationStore.getState().markMet('meiHong')

    expect(useConversationStore.getState().metNpcIds.size).toBe(1)
    expect(useConversationStore.getState().hasMet('meiHong')).toBe(true)
    // The early-return path deliberately skips the `set()` call entirely
    // when the NPC is already met, so the Set reference itself is unchanged.
    expect(useConversationStore.getState().metNpcIds).toBe(setAfterFirst)
  })

  it('marking one NPC met does not affect another', () => {
    useConversationStore.getState().markMet('meiHong')

    expect(useConversationStore.getState().hasMet('meiHong')).toBe(true)
    expect(useConversationStore.getState().hasMet('baChau')).toBe(false)
  })

  it('saveConversationState stores per-NPC ink state independently, and getConversationState reads it back', () => {
    useConversationStore.getState().saveConversationState('meiHong', '{"topic":"role"}')
    useConversationStore.getState().saveConversationState('baChau', '{"topic":"other"}')

    expect(useConversationStore.getState().getConversationState('meiHong')).toBe('{"topic":"role"}')
    expect(useConversationStore.getState().getConversationState('baChau')).toBe('{"topic":"other"}')
  })

  it('saveConversationState overwrites a previous save for the same NPC', () => {
    useConversationStore.getState().saveConversationState('meiHong', '{"topic":"role"}')
    useConversationStore.getState().saveConversationState('meiHong', '{"topic":"checkpoint"}')

    expect(useConversationStore.getState().getConversationState('meiHong')).toBe('{"topic":"checkpoint"}')
  })

  it('hydrate bulk-restores met NPCs (as a Set) and per-NPC conversation state from a save blob', () => {
    useConversationStore.getState().hydrate({
      metNpcIds: ['meiHong', 'meiHong', 'baChau'],
      stateByNpc: { meiHong: '{"topic":"role"}' },
    })

    const state = useConversationStore.getState()
    expect(state.metNpcIds).toEqual(new Set(['meiHong', 'baChau']))
    expect(state.hasMet('meiHong')).toBe(true)
    expect(state.hasMet('baChau')).toBe(true)
    expect(state.getConversationState('meiHong')).toBe('{"topic":"role"}')
  })

  it('reset clears both met NPCs and saved conversation state back to empty', () => {
    useConversationStore.getState().markMet('meiHong')
    useConversationStore.getState().saveConversationState('meiHong', '{"topic":"role"}')

    useConversationStore.getState().reset()

    const state = useConversationStore.getState()
    expect(state.metNpcIds.size).toBe(0)
    expect(state.hasMet('meiHong')).toBe(false)
    expect(state.getConversationState('meiHong')).toBeUndefined()
  })
})
