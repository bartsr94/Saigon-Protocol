// Single source of truth for anything a check or damage event reads (Architecture §3):
// Insight levels, wellbeing tracks, chosen archetype, and White/Red check bookkeeping.

import { create } from 'zustand'
import { INSIGHT_IDS, INSIGHT_MAX, INSIGHT_XP_PER_CHECK, INSIGHT_XP_TO_LEVEL, type InsightId } from '../content/insights'
import { ARCHETYPES, type ArchetypeId } from '../content/archetypes'
import type { PortraitId } from '../content/portraits'
import { computeMaxComposure, computeMaxVitality } from '../content/wellbeing'
import { resolveCheck, type CheckResult } from '../engine/checkResolution'
import type { SerializedInsightState } from '../engine/saveEngine'
import { useThoughtStore } from './thoughtStore'

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

interface LeveledUpInsight {
  levels: Record<InsightId, number>
  xp: Record<InsightId, number>
}

/** Applies earned XP to one Insight, leveling it up (capped at INSIGHT_MAX) whenever it crosses INSIGHT_XP_TO_LEVEL. */
function gainInsightXp(
  levels: Record<InsightId, number>,
  xp: Record<InsightId, number>,
  insightId: InsightId,
  amount: number,
): LeveledUpInsight {
  let nextLevel = levels[insightId]
  let nextXp = xp[insightId] + amount
  while (nextXp >= INSIGHT_XP_TO_LEVEL && nextLevel < INSIGHT_MAX) {
    nextXp -= INSIGHT_XP_TO_LEVEL
    nextLevel += 1
  }
  return {
    levels: { ...levels, [insightId]: nextLevel },
    xp: { ...xp, [insightId]: nextLevel >= INSIGHT_MAX ? 0 : nextXp },
  }
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
  /** Chosen independently of archetype (docs/GAME_GUIDE.md §2.2 step 1) — picking one never clears the other. */
  portraitId: PortraitId | null
  /** Set during Character Creation's confirm step (docs/GAME_GUIDE.md §2.2 step 3). */
  playerName: string
  levels: Record<InsightId, number>
  freePointsRemaining: number
  vitality: WellbeingTrack
  composure: WellbeingTrack
  consumedRedChecks: Set<string>
  /** Progress toward each Insight's next level (rollCheck), earned once per unique checkId. */
  xp: Record<InsightId, number>
  /** Every checkId that has ever paid out XP — separate from consumedRedChecks, which only gates re-attempting a Red check. */
  xpAwardedCheckIds: Set<string>
  /** First fail-state reached wins; the run is over once this is set (GDD §3). */
  failState: FailStateCause

  selectArchetype: (id: ArchetypeId) => void
  selectPortrait: (id: PortraitId) => void
  setPlayerName: (name: string) => void
  spendFreePoint: (id: InsightId) => void
  refundFreePoint: (id: InsightId) => void

  /** Returns null if a Red check's checkId has already been consumed (one-shot, GDD §3). */
  rollCheck: (insightId: InsightId, targetNumber: number, checkId: string, risk: CheckRisk) => CheckResult | null
  isRedCheckConsumed: (checkId: string) => boolean

  damageVitality: (amount: number) => void
  healVitality: (amount: number) => void
  damageComposure: (amount: number) => void
  healComposure: (amount: number) => void

  /** Bulk-restores state from a save blob (Save/Persistence Layer). */
  hydrate: (state: SerializedInsightState) => void
  reset: () => void
}

const UNINITIALIZED_LEVELS: Record<InsightId, number> = Object.fromEntries(
  INSIGHT_IDS.map((id) => [id, 0]),
) as Record<InsightId, number>

function zeroedXp(): Record<InsightId, number> {
  return Object.fromEntries(INSIGHT_IDS.map((id) => [id, 0])) as Record<InsightId, number>
}

const INITIAL_INSIGHT_STATE = {
  archetype: null,
  portraitId: null as PortraitId | null,
  playerName: '',
  levels: UNINITIALIZED_LEVELS,
  freePointsRemaining: 0,
  vitality: { current: 0, max: 0 },
  composure: { current: 0, max: 0 },
  consumedRedChecks: new Set<string>(),
  xp: zeroedXp(),
  xpAwardedCheckIds: new Set<string>(),
  failState: null as FailStateCause,
}

export const useInsightStore = create<InsightState>((set, get) => ({
  ...INITIAL_INSIGHT_STATE,

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
      xp: zeroedXp(),
      xpAwardedCheckIds: new Set(),
      failState: null,
    })
  },

  selectPortrait: (id) => set({ portraitId: id }),

  setPlayerName: (name) => set({ playerName: name }),

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
    const { levels, xp, consumedRedChecks, xpAwardedCheckIds } = get()
    if (risk === 'red' && consumedRedChecks.has(checkId)) {
      return null
    }
    const bonus = useThoughtStore.getState().insightBonusFor(insightId)
    const result = resolveCheck(levels[insightId] + bonus, targetNumber)

    const updates: { consumedRedChecks?: Set<string>; xpAwardedCheckIds?: Set<string>; levels?: Record<InsightId, number>; xp?: Record<InsightId, number>; vitality?: WellbeingTrack; composure?: WellbeingTrack } = {}
    if (risk === 'red') {
      updates.consumedRedChecks = new Set(consumedRedChecks).add(checkId)
    }
    if (!xpAwardedCheckIds.has(checkId)) {
      updates.xpAwardedCheckIds = new Set(xpAwardedCheckIds).add(checkId)
      const leveledUp = gainInsightXp(levels, xp, insightId, INSIGHT_XP_PER_CHECK)
      updates.levels = leveledUp.levels
      updates.xp = leveledUp.xp
      const { vitality, composure } = get()
      const next = clampToNewMax(leveledUp.levels, vitality.current, composure.current)
      updates.vitality = next.vitality
      updates.composure = next.composure
    }
    if (Object.keys(updates).length > 0) set(updates)
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

  hydrate: (state) => {
    set({
      archetype: state.archetype,
      portraitId: state.portraitId,
      playerName: state.playerName,
      levels: state.levels,
      freePointsRemaining: state.freePointsRemaining,
      vitality: state.vitality,
      composure: state.composure,
      consumedRedChecks: new Set(state.consumedRedChecks),
      xp: state.xp,
      xpAwardedCheckIds: new Set(state.xpAwardedCheckIds),
      failState: state.failState,
    })
  },

  reset: () => {
    set({
      ...INITIAL_INSIGHT_STATE,
      consumedRedChecks: new Set(),
      xp: zeroedXp(),
      xpAwardedCheckIds: new Set(),
    })
  },
}))
