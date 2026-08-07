// Casefile/Evidence overlay content (docs/GAME_GUIDE.md §9). Placeholder,
// flavor-light dev fixtures standing in for real evidence — same throwaway
// status as locations.ts. Purely static for now: nothing in the ink<->TS
// boundary grants evidence yet (no EXTERNAL for it), and how much of the
// Case Notes tab auto-populates vs. is hand-authored is an open question
// (docs/GAME_GUIDE.md §9) — this is the fixture that question will eventually
// replace, not an answer to it.

export type EvidenceTier = 'flavor' | 'clue' | 'key'

export type EvidenceId = 'drone-log' | 'torn-receipt' | 'water-sample' | 'burner-phone' | 'union-pin'

export const EVIDENCE_IDS: EvidenceId[] = ['drone-log', 'torn-receipt', 'water-sample', 'burner-phone', 'union-pin']

export interface EvidenceDefinition {
  id: EvidenceId
  name: string
  tier: EvidenceTier
  description: string
}

export const EVIDENCE: Record<EvidenceId, EvidenceDefinition> = {
  'drone-log': {
    id: 'drone-log',
    name: 'Checkpoint Drone Log',
    tier: 'clue',
    description: "A pulled maintenance log from the checkpoint drone. Timestamps don't match its patrol route.",
  },
  'torn-receipt': {
    id: 'torn-receipt',
    name: 'Torn Receipt',
    tier: 'flavor',
    description: 'Half a receipt from a noodle stall. The other half would probably matter.',
  },
  'water-sample': {
    id: 'water-sample',
    name: 'Water Sample',
    tier: 'key',
    description: "Brackish water from the drowned Delta district. Reads wrong for seawater — someone's dumping upstream.",
  },
  'burner-phone': {
    id: 'burner-phone',
    name: 'Burner Phone',
    tier: 'clue',
    description: 'No SIM, no contacts. One number dialed, over and over, never answered.',
  },
  'union-pin': {
    id: 'union-pin',
    name: 'Dockworkers Union Pin',
    tier: 'flavor',
    description: "A faded union pin, decades out of date. Sentimental, probably. Probably.",
  },
}

export interface CaseNoteDefinition {
  id: string
  heading: string
  body: string
}

export const CASE_NOTES: CaseNoteDefinition[] = [
  {
    id: 'note-01',
    heading: 'The Checkpoint',
    body: 'Someone flagged my watchlist entry manually. Corporate security doesn’t usually bother.',
  },
  {
    id: 'note-02',
    heading: "The Delta's Water",
    body: "Whatever's upstream of the Drowned Delta isn't natural runoff. Worth a second look.",
  },
]
