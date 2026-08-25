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
    expect(state.getConversationState('checkpoint', 'meiHong')).toBeUndefined()
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

  it('saveConversationState stores per-NPC ink state and lines independently, and getConversationState reads it back', () => {
    useConversationStore.getState().saveConversationState('checkpoint', 'meiHong', '{"topic":"role"}', [])
    useConversationStore.getState().saveConversationState('checkpoint', 'baChau', '{"topic":"other"}', [])

    expect(useConversationStore.getState().getConversationState('checkpoint', 'meiHong')).toEqual({ ink: '{"topic":"role"}', lines: [] })
    expect(useConversationStore.getState().getConversationState('checkpoint', 'baChau')).toEqual({ ink: '{"topic":"other"}', lines: [] })
  })

  it('saveConversationState overwrites a previous save for the same NPC at the same location', () => {
    useConversationStore.getState().saveConversationState('checkpoint', 'meiHong', '{"topic":"role"}', [])
    useConversationStore.getState().saveConversationState('checkpoint', 'meiHong', '{"topic":"checkpoint"}', [])

    expect(useConversationStore.getState().getConversationState('checkpoint', 'meiHong')).toEqual({ ink: '{"topic":"checkpoint"}', lines: [] })
  })

  it('keeps a saved state per NPC-location pair, so the same NPC at two different locations does not collide', () => {
    useConversationStore.getState().saveConversationState('turtleLakePlaza', 'ophelia', '{"topic":"plaza"}', [])
    useConversationStore.getState().saveConversationState('opheliaApartment', 'ophelia', '{"topic":"apartment"}', [])

    expect(useConversationStore.getState().getConversationState('turtleLakePlaza', 'ophelia')).toEqual({ ink: '{"topic":"plaza"}', lines: [] })
    expect(useConversationStore.getState().getConversationState('opheliaApartment', 'ophelia')).toEqual({ ink: '{"topic":"apartment"}', lines: [] })
  })

  it('hydrate bulk-restores met NPCs (as a Set) and per-NPC conversation state from a save blob', () => {
    useConversationStore.getState().hydrate({
      metNpcIds: ['meiHong', 'meiHong', 'baChau'],
      stateByNpc: { 'checkpoint::meiHong': { ink: '{"topic":"role"}', lines: [] } },
    })

    const state = useConversationStore.getState()
    expect(state.metNpcIds).toEqual(new Set(['meiHong', 'baChau']))
    expect(state.hasMet('meiHong')).toBe(true)
    expect(state.hasMet('baChau')).toBe(true)
    expect(state.getConversationState('checkpoint', 'meiHong')).toEqual({ ink: '{"topic":"role"}', lines: [] })
  })

  it('reset clears both met NPCs and saved conversation state back to empty', () => {
    useConversationStore.getState().markMet('meiHong')
    useConversationStore.getState().saveConversationState('checkpoint', 'meiHong', '{"topic":"role"}', [])

    useConversationStore.getState().reset()

    const state = useConversationStore.getState()
    expect(state.metNpcIds.size).toBe(0)
    expect(state.hasMet('meiHong')).toBe(false)
    expect(state.getConversationState('checkpoint', 'meiHong')).toBeUndefined()
  })
})
