// The seven personified Insights (GDD §3). Single source of truth for their
// identity/flavor; mechanical state (current level) lives in insightStore.

export type InsightId = 'ledger' | 'graft' | 'muscleMemory' | 'root' | 'static' | 'hustle' | 'mask'

export const INSIGHT_IDS: InsightId[] = ['ledger', 'graft', 'muscleMemory', 'root', 'static', 'hustle', 'mask']

export interface InsightDefinition {
  id: InsightId
  name: string
  tagline: string
  /**
   * Physical Insights raise Vitality's ceiling, mental ones raise Composure's
   * (GDD §3 "Max pool size may be tied to Insights"). Only Graft and Muscle
   * Memory are named as physical there — everything else defaults to mental.
   */
  domain: 'physical' | 'mental'
  /** Placeholder identity color — real iconography is a separate visual-design pass (UI doc §9). */
  color: string
}

export const INSIGHTS: Record<InsightId, InsightDefinition> = {
  ledger: {
    id: 'ledger',
    name: 'The Ledger',
    tagline: 'Cold corporate transactional logic — cost-benefit, leverage, what a thing is really worth.',
    domain: 'mental',
    color: '#facc15',
  },
  graft: {
    id: 'graft',
    name: 'The Graft',
    tagline: 'The voice of an altered body — adaptation, pain tolerance, kinship with the modified.',
    domain: 'physical',
    color: '#22c55e',
  },
  muscleMemory: {
    id: 'muscleMemory',
    name: 'Muscle Memory',
    tagline: 'Professional violence worn smooth by repetition. Threat assessment, tactical reads.',
    domain: 'physical',
    color: '#ef4444',
  },
  root: {
    id: 'root',
    name: 'Root',
    tagline: 'Homesickness and cultural memory. Grief for what’s underwater, empathy for the displaced.',
    domain: 'mental',
    color: '#38bdf8',
  },
  static: {
    id: 'static',
    name: 'Static',
    tagline: 'Low-grade climate dread as a running internal channel. Notices environmental danger early.',
    domain: 'mental',
    color: '#a78bfa',
  },
  hustle: {
    id: 'hustle',
    name: 'The Hustle',
    tagline: 'Scarcity-honed street cunning. Haggling, reading desperation, improvising.',
    domain: 'mental',
    color: '#fb923c',
  },
  mask: {
    id: 'mask',
    name: 'The Mask',
    tagline: 'The social-chameleon instinct. Knowing which face to wear for which faction.',
    domain: 'mental',
    color: '#f472b6',
  },
}

// PLACEHOLDER (GDD §3 tuning-pass item): starting range and level cap per Insight.
export const INSIGHT_MIN = 1
export const INSIGHT_MAX = 6
