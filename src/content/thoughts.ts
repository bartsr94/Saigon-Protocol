// Thought Cabinet content definitions (Progression System plan). Ownership and
// enabled state live in thoughtStore.ts; this module only defines the authored
// thought metadata the UI can render and the numeric/perception effects an
// enabled thought grants. Same shape as content/cases.ts's evidence/notes.

import type { InsightId } from './insights'

export type ThoughtId = 'checkpoint-improviser' | 'company-man-doubt'
export const THOUGHT_IDS: ThoughtId[] = ['checkpoint-improviser', 'company-man-doubt']

export interface ThoughtBonus {
  insightId: InsightId
  amount: number
}

export interface ThoughtDefinition {
  id: ThoughtId
  name: string
  /** Shown once unlocked, before the player enables it. */
  unlockedDescription: string
  /** Shown while enabled — the "how this reshapes perception" text. */
  enabledDescription: string
  insightBonus?: ThoughtBonus
}

export const THOUGHTS: Record<ThoughtId, ThoughtDefinition> = {
  'checkpoint-improviser': {
    id: 'checkpoint-improviser',
    name: 'Talk First, Think Later',
    unlockedDescription:
      "That guard bought it. Not because the story was good — because you didn't hesitate before telling it. Worth remembering.",
    enabledDescription:
      "You've stopped rehearsing your lines before you talk your way past someone. The gap between thinking and doing gets shorter every time.",
    insightBonus: { insightId: 'hustle', amount: 1 },
  },
  'company-man-doubt': {
    id: 'company-man-doubt',
    name: 'Filed, Followed Up, Handled',
    unlockedDescription:
      "Lakshmi flagged it. Filed it. Followed up. Was told it was handled. That word — handled — is doing a lot of quiet work in this case.",
    enabledDescription:
      "Every closed file starts looking like a euphemism now. Someone decided 'handled' didn't need a follow-up question, and you can't stop noticing where else that logic got applied.",
    insightBonus: { insightId: 'ledger', amount: 1 },
  },
}

// PLACEHOLDER (tuning pass): how many thoughts can be enabled at once.
export const THOUGHT_SLOT_CAPACITY = 2
