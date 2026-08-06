// Single source of truth for anything a check or damage event reads (Architecture §3):
// Insight levels, wellbeing tracks, chosen archetype, and White/Red check bookkeeping.

import { create } from 'zustand'
import { INSIGHT_IDS, INSIGHT_MAX, type InsightId } from '../content/insights'
import { ARCHETYPES, type ArchetypeId } from '../content/archetypes'
import { computeMaxComposure, computeMaxVitality } from '../content/wellbeing'
import { resolveCheck, type CheckResult } from '../engine/checkResolution'

export type CheckRisk = 'white' | 'red'
export type FailStateCause = 'vitality' | 'composure' | null

interface WellbeingTrack {
  current: number
  max: number
}

interface RecomputedWellbeing {
  vitality: WellbeingTrack
  composure: WellbeingTrack
}

function clampToNewMax(
  levels: Record<InsightId, number>,
  currentVitality: number,
  currentComposure: number,
): RecomputedWellbeing {
  const maxVitality = computeMaxVitality(levels)
  const maxComposure = computeMaxComposure(levels)
  return {
    vitality: { current: Math.min(currentVitality, maxVitality), max: maxVitality },
    composure: { current: Math.min(currentComposure, maxComposure), max: maxComposure },
  }
}

interface InsightState {
  archetype: ArchetypeId | null
  levels: Record<InsightId, number>
  freePointsRemaining: number
  vitality: WellbeingTrack
  composure: WellbeingTrack
  consumedRedChecks: Set<string>
  /** First fail-state reached wins; the run is over once this is set (GDD §3). */
  failState: FailStateCause

  selectArchetype: (id: ArchetypeId) => void
  spendFreePoint: (id: InsightId) => void
  refundFreePoint: (id: InsightId) => void

  /** Returns null if a Red check's checkId has already been consumed (one-shot, GDD §3). */
  rollCheck: (insightId: InsightId, targetNumber: number, checkId: string, risk: CheckRisk) => CheckResult | null
  isRedCheckConsumed: (checkId: string) => boolean

  damageVitality: (amount: number) => void
  healVitality: (amount: number) => void
  damageComposure: (amount: number) => void
  healComposure: (amount: number) => void
}

const UNINITIALIZED_LEVELS: Record<InsightId, number> = Object.fromEntries(
  INSIGHT_IDS.map((id) => [id, 0]),
) as Record<InsightId, number>

export const useInsightStore = create<InsightState>((set, get) => ({
  archetype: null,
  levels: UNINITIALIZED_LEVELS,
  freePointsRemaining: 0,
  vitality: { current: 0, max: 0 },
  composure: { current: 0, max: 0 },
  consumedRedChecks: new Set(),
  failState: null,

  selectArchetype: (id) => {
    const def = ARCHETYPES[id]
    const levels = { ...def.baseline }
    const maxVitality = computeMaxVitality(levels)
    const maxComposure = computeMaxComposure(levels)
    set({
      archetype: id,
      levels,
      freePointsRemaining: def.freePoints,
      vitality: { current: maxVitality, max: maxVitality },
      composure: { current: maxComposure, max: maxComposure },
      consumedRedChecks: new Set(),
      failState: null,
    })
  },

  spendFreePoint: (id) => {
    const { levels, freePointsRemaining, vitality, composure } = get()
    if (freePointsRemaining <= 0 || levels[id] >= INSIGHT_MAX) return
    const nextLevels = { ...levels, [id]: levels[id] + 1 }
    const next = clampToNewMax(nextLevels, vitality.current, composure.current)
    set({
      levels: nextLevels,
      freePointsRemaining: freePointsRemaining - 1,
      vitality: next.vitality,
      composure: next.composure,
    })
  },

  refundFreePoint: (id) => {
    const { archetype, levels, freePointsRemaining, vitality, composure } = get()
    if (!archetype) return
    const baseline = ARCHETYPES[archetype].baseline[id]
    if (levels[id] <= baseline) return // can only refund points spent above baseline
    const nextLevels = { ...levels, [id]: levels[id] - 1 }
    const next = clampToNewMax(nextLevels, vitality.current, composure.current)
    set({
      levels: nextLevels,
      freePointsRemaining: freePointsRemaining + 1,
      vitality: next.vitality,
      composure: next.composure,
    })
  },

  isRedCheckConsumed: (checkId) => get().consumedRedChecks.has(checkId),

  rollCheck: (insightId, targetNumber, checkId, risk) => {
    const { levels, consumedRedChecks } = get()
    if (risk === 'red' && consumedRedChecks.has(checkId)) {
      return null
    }
    const result = resolveCheck(levels[insightId], targetNumber)
    if (risk === 'red') {
      set({ consumedRedChecks: new Set(consumedRedChecks).add(checkId) })
    }
    return result
  },

  damageVitality: (amount) => {
    const { vitality, failState } = get()
    const current = Math.max(0, vitality.current - amount)
    set({ vitality: { ...vitality, current }, failState: failState ?? (current <= 0 ? 'vitality' : null) })
  },

  healVitality: (amount) => {
    const { vitality } = get()
    set({ vitality: { ...vitality, current: Math.min(vitality.max, vitality.current + amount) } })
  },

  damageComposure: (amount) => {
    const { composure, failState } = get()
    const current = Math.max(0, composure.current - amount)
    set({ composure: { ...composure, current }, failState: failState ?? (current <= 0 ? 'composure' : null) })
  },

  healComposure: (amount) => {
    const { composure } = get()
    set({ composure: { ...composure, current: Math.min(composure.max, composure.current + amount) } })
  },
}))
