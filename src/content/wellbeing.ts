// Wellbeing pool sizing (GDD §3 "Wellbeing & Damage"). Max pool size is tied to
// Insight levels — physical Insights raise Vitality, mental ones raise Composure.

import { INSIGHT_IDS, type InsightId } from './insights'

// PLACEHOLDER (GDD §3 tuning-pass item): base pool sizes.
export const BASE_VITALITY = 4
export const BASE_COMPOSURE = 4

const PHYSICAL_INSIGHTS: InsightId[] = INSIGHT_IDS.filter((id) => id === 'graft' || id === 'muscleMemory')
const MENTAL_INSIGHTS: InsightId[] = INSIGHT_IDS.filter((id) => !PHYSICAL_INSIGHTS.includes(id))

function sumLevels(ids: InsightId[], levels: Record<InsightId, number>): number {
  return ids.reduce((sum, id) => sum + levels[id], 0)
}

/** PLACEHOLDER formula (GDD §3 tuning-pass item): Vitality max = base + Graft + Muscle Memory. */
export function computeMaxVitality(levels: Record<InsightId, number>): number {
  return BASE_VITALITY + sumLevels(PHYSICAL_INSIGHTS, levels)
}

/**
 * PLACEHOLDER formula (GDD §3 tuning-pass item): Composure max = base + the
 * five mental Insights averaged down by 3, so it doesn't dwarf Vitality's range.
 */
export function computeMaxComposure(levels: Record<InsightId, number>): number {
  return BASE_COMPOSURE + Math.ceil(sumLevels(MENTAL_INSIGHTS, levels) / 3)
}
