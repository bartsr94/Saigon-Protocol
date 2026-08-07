// Casefile content definitions (docs/GAME_GUIDE.md §9). Ownership and unlock
// state live in casefileStore.ts; this module only defines the authored
// evidence/note metadata the UI can render once unlocked.

import type { DistrictId, LocationId } from './locations'

export type EvidenceTier = 'flavor' | 'clue' | 'key'

export type EvidenceId = 'drone-log' | 'torn-receipt' | 'water-sample' | 'burner-phone' | 'union-pin'
export const EVIDENCE_IDS: EvidenceId[] = ['drone-log', 'torn-receipt', 'water-sample', 'burner-phone', 'union-pin']

export interface EvidenceDefinition {
  id: EvidenceId
  name: string
  tier: EvidenceTier
  description: string
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
    districtId: 'district4',
    sourceLocationId: 'checkpoint',
    tags: ['surveillance', 'placeholder'],
  },
  'torn-receipt': {
    id: 'torn-receipt',
    name: 'Torn Receipt',
    tier: 'flavor',
    description: 'Half a receipt from a noodle stall. The other half would probably matter.',
    districtId: 'district5',
    sourceLocationId: 'noodleStall',
    tags: ['paper', 'placeholder'],
  },
  'water-sample': {
    id: 'water-sample',
    name: 'Water Sample',
    tier: 'key',
    description: "Brackish water from the drowned Delta district. Reads wrong for seawater — someone's dumping upstream.",
    districtId: 'district2',
    sourceLocationId: 'deltaSquat',
    tags: ['environment', 'placeholder'],
  },
  'burner-phone': {
    id: 'burner-phone',
    name: 'Burner Phone',
    tier: 'clue',
    description: 'No SIM, no contacts. One number dialed, over and over, never answered.',
    tags: ['communications', 'placeholder'],
  },
  'union-pin': {
    id: 'union-pin',
    name: 'Dockworkers Union Pin',
    tier: 'flavor',
    description: "A faded union pin, decades out of date. Sentimental, probably. Probably.",
    tags: ['personal-effect', 'placeholder'],
  },
}

export type CaseNoteId = 'note-01' | 'note-02'
export const CASE_NOTE_IDS: CaseNoteId[] = ['note-01', 'note-02']

export interface CaseNoteDefinition {
  id: CaseNoteId
  heading: string
  body: string
  districtId?: DistrictId
  tags?: string[]
}

export const CASE_NOTES: Record<CaseNoteId, CaseNoteDefinition> = {
  'note-01': {
    id: 'note-01',
    heading: 'The Checkpoint',
    body: "Someone flagged my watchlist entry manually. Corporate security doesn't usually bother.",
    districtId: 'district4',
    tags: ['investigation', 'placeholder'],
  },
  'note-02': {
    id: 'note-02',
    heading: "The Delta's Water",
    body: "Whatever's upstream of the Drowned Delta isn't natural runoff. Worth a second look.",
    districtId: 'district2',
    tags: ['environment', 'placeholder'],
  },
}
