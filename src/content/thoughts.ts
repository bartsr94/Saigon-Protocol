// Thought Cabinet content definitions (Progression System plan). Ownership and
// enabled state live in thoughtStore.ts; this module only defines the authored
// thought metadata the UI can render and the numeric/perception effects an
// enabled thought grants. Same shape as content/cases.ts's evidence/notes.

import type { InsightId } from './insights'

export type ThoughtId =
  | 'checkpoint-improviser'
  | 'company-man-doubt'
  | 'envelope-test'
  | 'everyones-got-a-price'
  | 'leaned-on'
  | 'look-the-other-way'

export const THOUGHT_IDS: ThoughtId[] = [
  'checkpoint-improviser',
  'company-man-doubt',
  'envelope-test',
  'everyones-got-a-price',
  'leaned-on',
  'look-the-other-way',
]

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
  /**
   * One entry per Insight this thought shifts while enabled — plural so a
   * thought can carry a paired gain/cost (docs/CORRUPT_DETECTIVE_THOUGHTS_SPEC.md),
   * not just pure upside. `amount` may be negative.
   */
  insightBonuses?: ThoughtBonus[]
}

export const THOUGHTS: Record<ThoughtId, ThoughtDefinition> = {
  'checkpoint-improviser': {
    id: 'checkpoint-improviser',
    name: 'Talk First, Think Later',
    unlockedDescription:
      "That guard bought it. Not because the story was good — because you didn't hesitate before telling it. Worth remembering.",
    enabledDescription:
      "You've stopped rehearsing your lines before you talk your way past someone. The gap between thinking and doing gets shorter every time.",
    insightBonuses: [{ insightId: 'hustle', amount: 1 }],
  },
  'company-man-doubt': {
    id: 'company-man-doubt',
    name: 'Filed, Followed Up, Handled',
    unlockedDescription:
      "Lakshmi flagged it. Filed it. Followed up. Was told it was handled. That word — handled — is doing a lot of quiet work in this case.",
    enabledDescription:
      "Every closed file starts looking like a euphemism now. Someone decided 'handled' didn't need a follow-up question, and you can't stop noticing where else that logic got applied.",
    insightBonuses: [{ insightId: 'ledger', amount: 1 }],
  },
  'envelope-test': {
    id: 'envelope-test',
    name: 'The Envelope Test',
    unlockedDescription:
      "The chit went into his glove and the barrier went up and nothing happened. No alarm, no report, no version of today where anyone ever asks. Filed away, for later, exactly how easy that was.",
    enabledDescription:
      "You're better at spotting the opening now — the guard who's bored enough, the door that only needs a little grease. You're also a little worse at remembering whose door it was.",
    insightBonuses: [
      { insightId: 'hustle', amount: 1 },
      { insightId: 'root', amount: -1 },
    ],
  },
  'everyones-got-a-price': {
    id: 'everyones-got-a-price',
    name: "Everyone's Got a Price",
    unlockedDescription:
      "Twice now. Not a slip, not a one-off — a pattern, and patterns are just prices you haven't named yet. Somewhere in there the job stopped being the job and started being a rate card.",
    enabledDescription:
      "Every negotiation resolves to a number now, fast, before the rest of the conversation even finishes loading. It's efficient. It's also stopped registering as a compromise at all — just a price, like anything else.",
    insightBonuses: [
      { insightId: 'ledger', amount: 1 },
      { insightId: 'static', amount: -1 },
    ],
  },
  'leaned-on': {
    id: 'leaned-on',
    name: 'Leaned On',
    unlockedDescription:
      "She folded because you made her, not because you convinced her. That's a different tool than the one you meant to reach for, and it worked, and you noticed it working.",
    enabledDescription:
      "People clock the threat before they clock the badge now — a half-second of recalculation you didn't used to get, and don't entirely dislike getting. It opens doors. It also means fewer people bother trying to like you first.",
    insightBonuses: [
      { insightId: 'muscleMemory', amount: 1 },
      { insightId: 'mask', amount: -1 },
    ],
  },
  'look-the-other-way': {
    id: 'look-the-other-way',
    name: 'Look the Other Way',
    unlockedDescription:
      "You saw exactly what that arrangement was, and you took the cut instead of the report. Nobody made you decide that fast. You just already knew which one you were going to pick.",
    enabledDescription:
      "The moral math stops running before it used to — you clock what's wrong and just... file it under not your problem, same reflex every time. It reads as kinship to the people who live this way out of necessity. It's also a door quietly closing somewhere behind your ledger.",
    insightBonuses: [
      { insightId: 'graft', amount: 1 },
      { insightId: 'ledger', amount: -1 },
    ],
  },
}

// PLACEHOLDER (tuning pass): how many thoughts can be enabled at once.
export const THOUGHT_SLOT_CAPACITY = 2
