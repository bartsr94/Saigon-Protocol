import { describe, expect, it } from 'vitest'
import { clampAffinity, createInitialRelationshipState } from './relationshipEngine'
import { NPC_IDS } from '../content/npcs'

describe('relationshipEngine', () => {
  it('clampAffinity saturates at -10/+10 and passes through in-range values', () => {
    expect(clampAffinity(0)).toBe(0)
    expect(clampAffinity(7)).toBe(7)
    expect(clampAffinity(-7)).toBe(-7)
    expect(clampAffinity(11)).toBe(10)
    expect(clampAffinity(-11)).toBe(-10)
    expect(clampAffinity(10)).toBe(10)
    expect(clampAffinity(-10)).toBe(-10)
  })

  it('createInitialRelationshipState defaults every NPC to 0', () => {
    const state = createInitialRelationshipState()
    expect(Object.keys(state).sort()).toEqual([...NPC_IDS].sort())
    for (const id of NPC_IDS) {
      expect(state[id]).toBe(0)
    }
  })
})
