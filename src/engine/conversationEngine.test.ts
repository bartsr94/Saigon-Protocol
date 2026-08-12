import { describe, expect, it } from 'vitest'
import { hydrateConversationState, serializeConversationState } from './conversationEngine'

describe('serializeConversationState', () => {
  it('converts the met-NPC Set to an array and copies stateByNpc', () => {
    const serialized = serializeConversationState({
      metNpcIds: new Set(['meiHong', 'baChau']),
      stateByNpc: { meiHong: '{"a":1}' },
    })

    expect(serialized.metNpcIds).toEqual(expect.arrayContaining(['meiHong', 'baChau']))
    expect(serialized.metNpcIds).toHaveLength(2)
    expect(serialized.stateByNpc).toEqual({ meiHong: '{"a":1}' })
  })

  it('does not mutate the original Set or object when copying', () => {
    const metNpcIds = new Set<'meiHong'>(['meiHong'])
    const stateByNpc = { meiHong: '{"a":1}' }

    const serialized = serializeConversationState({ metNpcIds, stateByNpc })
    serialized.metNpcIds.push('baChau')
    serialized.stateByNpc.meiHong = '{"a":2}'

    expect(metNpcIds).toEqual(new Set(['meiHong']))
    expect(stateByNpc).toEqual({ meiHong: '{"a":1}' })
  })
})

describe('hydrateConversationState', () => {
  it('rebuilds metNpcIds as a Set and copies stateByNpc', () => {
    const hydrated = hydrateConversationState({
      metNpcIds: ['meiHong', 'meiHong', 'baChau'],
      stateByNpc: { meiHong: '{"a":1}' },
    })

    expect(hydrated.metNpcIds).toEqual(new Set(['meiHong', 'baChau']))
    expect(hydrated.stateByNpc).toEqual({ meiHong: '{"a":1}' })
  })

  it('round-trips through serialize/hydrate unchanged', () => {
    const original = {
      metNpcIds: new Set<'meiHong' | 'baChau'>(['meiHong', 'baChau']),
      stateByNpc: { meiHong: '{"topic":"role"}' },
    }

    const roundTripped = hydrateConversationState(serializeConversationState(original))

    expect(roundTripped.metNpcIds).toEqual(original.metNpcIds)
    expect(roundTripped.stateByNpc).toEqual(original.stateByNpc)
  })

  it('handles an empty save blob', () => {
    const hydrated = hydrateConversationState({ metNpcIds: [], stateByNpc: {} })

    expect(hydrated.metNpcIds.size).toBe(0)
    expect(hydrated.stateByNpc).toEqual({})
  })
})
