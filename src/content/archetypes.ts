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
      "Rotated out of a PMC contract into SEZ blue once the checks stopped clearing on the corporate side — the uniform changed, the instincts didn't. Bulldozes a scene a smarter cop would still be talking through, and it works often enough to keep doing it that way; paperwork, negotiation, anything that isn't a straight line gets handed off whenever there's someone else to hand it to.",
    strength: 'muscleMemory',
    weakness: 'ledger',
    baseline: baselineFor('muscleMemory', 'ledger'),
    freePoints: FREE_POINTS_DEFAULT,
  },
  companyMan: {
    id: 'companyMan',
    name: 'The Company Man',
    backstory:
      "Transferred in once SEZAC decided its own investigators needed a badge to go with the clearance, not just corporate internal security credentials. Reads leverage and org charts on instinct — who reports to whom, who's expendable, what a favor is actually worth — and went numb to the human cost of what keeps the SEZ running well before this posting, back when numbing to it was the job description.",
    strength: 'ledger',
    weakness: 'root',
    baseline: baselineFor('ledger', 'root'),
    freePoints: FREE_POINTS_DEFAULT,
  },
  oldSaigon: {
    id: 'oldSaigon',
    name: 'Old Saigon',
    backstory:
      "Local-born, from one of the families that stayed when half the district emptied out for the platforms and the corporate towers going up over the old streets. Reads a room the way only someone raised in it can — the unspoken debts, the silences that mean something, who actually runs a block versus who's listed as running it — and gets outmaneuvered by anyone who can turn that same room into a spreadsheet.",
    strength: 'root',
    weakness: 'ledger',
    baseline: baselineFor('root', 'ledger'),
    freePoints: FREE_POINTS_DEFAULT,
  },
  wire: {
    id: 'wire',
    name: 'The Wire',
    backstory:
      "Modified past the point of easy passing, by choice or by necessity or by whatever mix of the two it takes to stop being able to tell which was which. Reads mod work and cybernetics with a visceral fluency no manual teaches — feels the make and the mileage on a graft the way someone else reads a face — but the same body doing the reading gives the game away in one glance, every time.",
    strength: 'graft',
    weakness: 'mask',
    baseline: baselineFor('graft', 'mask'),
    freePoints: FREE_POINTS_DEFAULT,
  },
  hustler: {
    id: 'hustler',
    name: 'The Hustler',
    backstory:
      "Brought over as a small kid from somewhere in Europe nobody here can place by the accent, raised since in New Saigon's gray-capital economy — fluent in the tongue, still read as an outsider on sight. Reads desperation and improvises well; avoids violence and it shows when it can’t be avoided.",
    strength: 'hustle',
    weakness: 'muscleMemory',
    baseline: baselineFor('hustle', 'muscleMemory'),
    freePoints: FREE_POINTS_DEFAULT,
  },
  boringCop: {
    id: 'boringCop',
    name: 'Boring Cop',
    backstory:
      "No standout skill, no standout flaw, and no interesting story attached to how they ended up wearing the badge — transferred in, tested average straight down the line, and nobody's ever had reason to ask for more detail than that. For players who'd rather build the whole spread themselves than inherit somebody else's idea of a strength.",
    strength: null,
    weakness: null,
    baseline: baselineFor(null, null),
    freePoints: FREE_POINTS_BORING_COP,
  },
}

export const ARCHETYPE_IDS: ArchetypeId[] = Object.keys(ARCHETYPES) as ArchetypeId[]
