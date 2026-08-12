import { describe, expect, it } from 'vitest'
import { BASE_COMPOSURE, BASE_VITALITY, computeMaxComposure, computeMaxVitality } from './wellbeing'
import { INSIGHT_IDS, type InsightId } from './insights'

function levels(overrides: Partial<Record<InsightId, number>>): Record<InsightId, number> {
  const base = Object.fromEntries(INSIGHT_IDS.map((id) => [id, 0])) as Record<InsightId, number>
  return { ...base, ...overrides }
}

describe('computeMaxVitality', () => {
  it('equals the base with every Insight at zero', () => {
    expect(computeMaxVitality(levels({}))).toBe(BASE_VITALITY)
  })

  it('adds only the two physical Insights (Graft, Muscle Memory)', () => {
    expect(computeMaxVitality(levels({ graft: 2, muscleMemory: 3 }))).toBe(BASE_VITALITY + 5)
  })

  it('ignores every mental Insight entirely', () => {
    expect(computeMaxVitality(levels({ ledger: 6, root: 6, static: 6, hustle: 6, mask: 6 }))).toBe(BASE_VITALITY)
  })
})

describe('computeMaxComposure', () => {
  it('equals the base with every Insight at zero', () => {
    expect(computeMaxComposure(levels({}))).toBe(BASE_COMPOSURE)
  })

  it('ignores both physical Insights entirely', () => {
    expect(computeMaxComposure(levels({ graft: 6, muscleMemory: 6 }))).toBe(BASE_COMPOSURE)
  })

  it('sums the five mental Insights and rounds the /3 average up', () => {
    // ledger + root + static + hustle + mask = 1 -> ceil(1/3) = 1
    expect(computeMaxComposure(levels({ ledger: 1 }))).toBe(BASE_COMPOSURE + 1)
    // sum = 3 -> ceil(3/3) = 1 (exact division does not round up further)
    expect(computeMaxComposure(levels({ ledger: 3 }))).toBe(BASE_COMPOSURE + 1)
    // sum = 4 -> ceil(4/3) = 2
    expect(computeMaxComposure(levels({ ledger: 3, root: 1 }))).toBe(BASE_COMPOSURE + 2)
  })

  it('maxes out with every mental Insight at the level cap', () => {
    // 5 mental Insights x 6 = 30 -> ceil(30/3) = 10
    expect(computeMaxComposure(levels({ ledger: 6, root: 6, static: 6, hustle: 6, mask: 6 }))).toBe(BASE_COMPOSURE + 10)
  })
})
