// Case content definitions (docs/GAME_GUIDE.md §9). Ownership/progress state
// lives in caseStore.ts; this module only defines the authored
// case/objective/evidence/note metadata the Cases overlay renders once
// unlocked. Replaces the old single-investigation `casefile.ts` — the game
// can now track several concurrent quest-lines (the main Case 1
// investigation plus optional sidequests) instead of one flat pool.

import type { DistrictId, LocationId } from './locations'

export type CaseId = 'case1' | 'ophelia-stalker'
export const CASE_IDS: CaseId[] = ['case1', 'ophelia-stalker']

export type CaseCategory = 'main' | 'side'

export interface CaseObjectiveDefinition {
  /** Unique within this case's `objectives` array, not globally — caseStore keys progress as `${caseId}::${objectiveId}`. */
  id: string
  label: string
  description: string
}

export interface CaseDefinition {
  id: CaseId
  title: string
  category: CaseCategory
  summary: string
  /** Authoring order is display order — not necessarily completion order. */
  objectives: CaseObjectiveDefinition[]
}

export const CASES: Record<CaseId, CaseDefinition> = {
  case1: {
    id: 'case1',
    title: 'Case 1 — Aveline Breakout',
    category: 'main',
    summary:
      "Officially, a burglary at an Aveline Biogenetics lab in District 4. Actually, a covered-up containment breach — an escaped experimental subject, a corporation buying itself time to search the city before the truth becomes impossible to manage.",
    objectives: [
      {
        id: 'investigate',
        label: 'Find out what really happened at the Aveline lab',
        description: "The official story is a theft. Keep pulling the thread until it stops being one.",
      },
    ],
  },
  'ophelia-stalker': {
    id: 'ophelia-stalker',
    title: "Ophelia's Shadow",
    category: 'side',
    summary:
      'A District 3 feed performer who moved to Saigon specifically to be unrecognizable is being followed by someone who refused to stay a paying stranger on a screen.',
    objectives: [
      {
        id: 'recognition',
        label: 'Learn why she thinks she is being followed',
        description: 'Ophelia has just clocked her stalker in the crowd at Turtle Lake Plaza and is trying very hard not to panic publicly.',
      },
      {
        id: 'pattern',
        label: 'Establish that the pattern is real, not just bad fans',
        description: 'He knows things about her routine a stranger should not. Confirm this is coordinated, repeated, and escalating.',
      },
      {
        id: 'choice',
        label: 'Help her decide what to do about him',
        description: 'Go public, go quiet, run, or let the detective draw him out — no ending here is clean.',
      },
    ],
  },
}

export type EvidenceTier = 'flavor' | 'clue' | 'key'

export type EvidenceId = 'drone-log' | 'torn-receipt' | 'aftercare-ledger-slip' | 'water-sample' | 'burner-phone' | 'union-pin'
export const EVIDENCE_IDS: EvidenceId[] = ['drone-log', 'torn-receipt', 'aftercare-ledger-slip', 'water-sample', 'burner-phone', 'union-pin']

export interface EvidenceDefinition {
  id: EvidenceId
  name: string
  tier: EvidenceTier
  description: string
  /** Which case's Cases-overlay tab this evidence is filed under. */
  caseId: CaseId
  districtId?: DistrictId
  sourceLocationId?: LocationId
  tags?: string[]
}

export const EVIDENCE: Record<EvidenceId, EvidenceDefinition> = {
  'drone-log': {
    id: 'drone-log',
    name: 'Checkpoint Drone Log',
    tier: 'clue',
    description: "A pulled maintenance log from the checkpoint drone. Timestamps don't match its patrol route.",
    caseId: 'case1',
    districtId: 'district4',
    sourceLocationId: 'checkpoint',
    tags: ['surveillance', 'placeholder'],
  },
  'torn-receipt': {
    id: 'torn-receipt',
    name: 'Torn Receipt',
    tier: 'flavor',
    description: 'Half a receipt from a noodle stall. The other half would probably matter.',
    caseId: 'case1',
    districtId: 'district5',
    sourceLocationId: 'noodleStall',
    tags: ['paper', 'placeholder'],
  },
  'aftercare-ledger-slip': {
    id: 'aftercare-ledger-slip',
    name: 'Aftercare Ledger Slip',
    tier: 'clue',
    description:
      'A carbon-copy intake slip from Y Duoc, logged under a false patient code but still carrying dosage shorthand for tolerance suppressants and adaptation-stress follow-up.',
    caseId: 'case1',
    districtId: 'district5',
    sourceLocationId: 'yDuocInstitute',
    tags: ['medical', 'paper', 'case1'],
  },
  'water-sample': {
    id: 'water-sample',
    name: 'Water Sample',
    tier: 'key',
    description: "Brackish water from the drowned Delta district. Reads wrong for seawater — someone's dumping upstream.",
    caseId: 'case1',
    districtId: 'district2',
    sourceLocationId: 'deltaSquat',
    tags: ['environment', 'placeholder'],
  },
  'burner-phone': {
    id: 'burner-phone',
    name: 'Burner Phone',
    tier: 'clue',
    description: 'No SIM, no contacts. One number dialed, over and over, never answered.',
    caseId: 'case1',
    tags: ['communications', 'placeholder'],
  },
  'union-pin': {
    id: 'union-pin',
    name: 'Dockworkers Union Pin',
    tier: 'flavor',
    description: "A faded union pin, decades out of date. Sentimental, probably. Probably.",
    caseId: 'case1',
    tags: ['personal-effect', 'placeholder'],
  },
}

export type CaseNoteId = 'note-01' | 'note-02' | 'note-03' | 'note-04' | 'note-05' | 'note-06' | 'note-07'
export const CASE_NOTE_IDS: CaseNoteId[] = ['note-01', 'note-02', 'note-03', 'note-04', 'note-05', 'note-06', 'note-07']

export interface CaseNoteDefinition {
  id: CaseNoteId
  heading: string
  body: string
  /** Which case's Cases-overlay tab this note is filed under. */
  caseId: CaseId
  districtId?: DistrictId
  tags?: string[]
}

export const CASE_NOTES: Record<CaseNoteId, CaseNoteDefinition> = {
  'note-01': {
    id: 'note-01',
    heading: 'The Checkpoint',
    body: "Someone flagged my watchlist entry manually. Corporate security doesn't usually bother.",
    caseId: 'case1',
    districtId: 'district4',
    tags: ['investigation', 'placeholder'],
  },
  'note-02': {
    id: 'note-02',
    heading: "The Delta's Water",
    body: "Whatever's upstream of the Drowned Delta isn't natural runoff. Worth a second look.",
    caseId: 'case1',
    districtId: 'district2',
    tags: ['environment', 'placeholder'],
  },
  'note-03': {
    id: 'note-03',
    heading: 'A Flagged Result',
    body: "Lakshmi Avani flagged an adaptation-stress anomaly on HN-12 weeks before the breach. Filed it, followed up, was told it was handled. Never asked what 'handled' meant.",
    caseId: 'case1',
    districtId: 'district4',
    tags: ['investigation', 'staff-testimony'],
  },
  'note-04': {
    id: 'note-04',
    heading: 'Off-Book Aftercare',
    body:
      "Y Duoc's public intake is real enough. So is the quieter stream behind it: unofficial follow-up care for bodies that look less like ordinary patients and more like something Aveline or its contractors wanted stabilized without leaving the cleanest possible trail.",
    caseId: 'case1',
    districtId: 'district5',
    tags: ['investigation', 'medical', 'case1'],
  },
  'note-05': {
    id: 'note-05',
    heading: "Lakshmi's Discrepancies",
    body: "Lakshmi Avani has been privately compiling adaptation-log entries that don't add up — kept off the record, away from whoever she doesn't trust with them yet. She offered to show them, carefully.",
    caseId: 'case1',
    districtId: 'district4',
    tags: ['investigation', 'staff-testimony', 'case1'],
  },
  'note-06': {
    id: 'note-06',
    heading: "Ophelia's Shadow, Confirmed",
    body: "He reacted almost the moment the stream went up — not fan enthusiasm, something closer to a man cross-checking a file he already keeps. He wanted to know who else was around her now. That is not how a bad fan behaves. That is how someone tracks a rival.",
    caseId: 'ophelia-stalker',
    districtId: 'district3',
    tags: ['stalking', 'ophelia'],
  },
  'note-07': {
    id: 'note-07',
    heading: "Ophelia's Shadow, Closed",
    body: "Quiet removal, public exposure, a full disappearance, or just tighter walls — whichever way it went, Ophelia is the one who decided how this ends, not the department, and not him. No version of it left her exactly where she started.",
    caseId: 'ophelia-stalker',
    districtId: 'district3',
    tags: ['stalking', 'ophelia'],
  },
}
