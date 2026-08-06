// Cop archetypes (GDD §4 Character Creation). Each sets a baseline Insight
// distribution — a genuine strength and an honest cost — before free-point spend.

import { INSIGHT_IDS, type InsightId } from './insights'

export type ArchetypeId = 'enforcer' | 'companyMan' | 'oldSaigon' | 'wire' | 'hustler' | 'boringCop'

export interface ArchetypeDefinition {
  id: ArchetypeId
  name: string
  backstory: string
  strength: InsightId | null
  weakness: InsightId | null
  /** Starting Insight levels before free-point spend (placeholder numbers — GDD §3 tuning-pass item). */
  baseline: Record<InsightId, number>
  freePoints: number
  /** `/portraits/archetypes/<id>.png` — served from public/, missing art falls back to initials (PortraitFrame). */
  portraitSrc: string
}

// PLACEHOLDER values (GDD §3 tuning-pass item): baseline spread and free-point pool size.
const BASELINE_DEFAULT = 2
const BASELINE_HIGH = 4
const BASELINE_LOW = 1
const FREE_POINTS_DEFAULT = 3
const FREE_POINTS_BORING_COP = 6

function baselineFor(strength: InsightId | null, weakness: InsightId | null): Record<InsightId, number> {
  const baseline = Object.fromEntries(INSIGHT_IDS.map((id) => [id, BASELINE_DEFAULT])) as Record<InsightId, number>
  if (strength) baseline[strength] = BASELINE_HIGH
  if (weakness) baseline[weakness] = BASELINE_LOW
  return baseline
}

export const ARCHETYPES: Record<ArchetypeId, ArchetypeDefinition> = {
  enforcer: {
    id: 'enforcer',
    name: 'The Enforcer',
    backstory:
      'Ex-PMC contractor turned SEZ police. Bulldozes situations a smarter cop would talk through; bad at negotiation and fine print.',
    strength: 'muscleMemory',
    weakness: 'ledger',
    baseline: baselineFor('muscleMemory', 'ledger'),
    freePoints: FREE_POINTS_DEFAULT,
    portraitSrc: '/portraits/archetypes/enforcer.png',
  },
  companyMan: {
    id: 'companyMan',
    name: 'The Company Man',
    backstory:
      'Transferred from corporate internal security. Reads leverage instinctively, numb to the human cost of what the SEZ runs on.',
    strength: 'ledger',
    weakness: 'root',
    baseline: baselineFor('ledger', 'root'),
    freePoints: FREE_POINTS_DEFAULT,
    portraitSrc: '/portraits/archetypes/companyMan.png',
  },
  oldSaigon: {
    id: 'oldSaigon',
    name: 'Old Saigon',
    backstory:
      'Local-born, maybe from a family that refused to leave. Deep cultural fluency and empathy; easy to outmaneuver in a boardroom.',
    strength: 'root',
    weakness: 'ledger',
    baseline: baselineFor('root', 'ledger'),
    freePoints: FREE_POINTS_DEFAULT,
    portraitSrc: '/portraits/archetypes/oldSaigon.png',
  },
  wire: {
    id: 'wire',
    name: 'The Wire',
    backstory:
      "Heavily modified by choice or necessity. Visceral insight into mods and cybernetics; can't blend in — the body gives them away.",
    strength: 'graft',
    weakness: 'mask',
    baseline: baselineFor('graft', 'mask'),
    freePoints: FREE_POINTS_DEFAULT,
    portraitSrc: '/portraits/archetypes/wire.png',
  },
  hustler: {
    id: 'hustler',
    name: 'The Hustler',
    backstory:
      'Came up through the gray-capital economy. Reads desperation and improvises well; avoids violence and it shows when it can’t be avoided.',
    strength: 'hustle',
    weakness: 'muscleMemory',
    baseline: baselineFor('hustle', 'muscleMemory'),
    freePoints: FREE_POINTS_DEFAULT,
    portraitSrc: '/portraits/archetypes/hustler.png',
  },
  boringCop: {
    id: 'boringCop',
    name: 'Boring Cop',
    backstory: 'Flat, unremarkable spread. For players who want to build fully custom from a blank slate.',
    strength: null,
    weakness: null,
    baseline: baselineFor(null, null),
    freePoints: FREE_POINTS_BORING_COP,
    portraitSrc: '/portraits/archetypes/boringCop.png',
  },
}

export const ARCHETYPE_IDS: ArchetypeId[] = Object.keys(ARCHETYPES) as ArchetypeId[]
