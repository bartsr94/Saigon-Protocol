// Wraps a bound inkjs Story: the ink<->TS boundary from Architecture §6.
// Pure and store-agnostic — takes a Story instance plus injected handlers,
// same testable-in-isolation style as checkResolution.ts. Never imports a
// Zustand store directly; storyStore.ts supplies the handlers.

import type { Story } from 'inkjs'
import { INSIGHT_IDS, type InsightId } from '../content/insights'
import type { ArchetypeId } from '../content/archetypes'
import type { CheckResult } from './checkResolution'
import type { CheckRisk } from '../stores/insightStore'

export interface CheckHandlers {
  isRedCheckConsumed: (checkId: string) => boolean
  rollCheck: (insightId: InsightId, targetNumber: number, checkId: string, risk: CheckRisk) => CheckResult | null
  /** Lets the caller (storyStore) capture the full result — dice, doubles tier — for UI use, since ink itself only gets pass/fail. */
  onCheckResult?: (result: CheckResult) => void
}

export interface WellbeingHandlers {
  damageVitality: (amount: number) => void
  healVitality: (amount: number) => void
  damageComposure: (amount: number) => void
  healComposure: (amount: number) => void
}

function assertInsightId(value: unknown): InsightId {
  if (typeof value === 'string' && (INSIGHT_IDS as string[]).includes(value)) {
    return value as InsightId
  }
  throw new Error(`roll_check called with unknown insight "${String(value)}"`)
}

function assertCheckRisk(value: unknown): CheckRisk {
  if (value === 'white' || value === 'red') return value
  throw new Error(`roll_check called with unknown risk "${String(value)}"`)
}

/**
 * Binds the two check-related EXTERNALs: `is_red_check_consumed(checkId)` lets
 * ink gate whether a Red-check choice is even offered, `roll_check(insight,
 * targetNumber, checkId, risk)` resolves it and returns pass/fail to ink.
 */
export function bindCheckFunctions(story: Story, handlers: CheckHandlers): void {
  story.BindExternalFunction('is_red_check_consumed', (checkId: string) => handlers.isRedCheckConsumed(checkId))

  story.BindExternalFunction(
    'roll_check',
    (insight: string, targetNumber: number, checkId: string, risk: string) => {
      const result = handlers.rollCheck(assertInsightId(insight), targetNumber, checkId, assertCheckRisk(risk))
      if (result) handlers.onCheckResult?.(result)
      return result?.success ?? false
    },
  )
}

/** Binds the four wellbeing EXTERNALs ink calls to declare damage/healing (Architecture §6). */
export function bindWellbeingFunctions(story: Story, handlers: WellbeingHandlers): void {
  story.BindExternalFunction('damage_vitality', (amount: number) => handlers.damageVitality(amount))
  story.BindExternalFunction('heal_vitality', (amount: number) => handlers.healVitality(amount))
  story.BindExternalFunction('damage_composure', (amount: number) => handlers.damageComposure(amount))
  story.BindExternalFunction('heal_composure', (amount: number) => handlers.healComposure(amount))
}

/** ink identifiers are snake_case; InsightIds are camelCase. Explicit map, not a generic transform. */
const INSIGHT_ID_TO_INK_VAR: Record<InsightId, string> = {
  ledger: 'ledger',
  graft: 'graft',
  muscleMemory: 'muscle_memory',
  root: 'root',
  static: 'static',
  hustle: 'hustle',
  mask: 'mask',
}

/**
 * Pushes Insight levels + archetype into ink globals so choices can be
 * gated/shown conditionally (Architecture §6). Skips any variable the loaded
 * story didn't declare with VAR — writing an undeclared global throws in
 * inkjs, and minimal/test stories aren't expected to declare the full set.
 */
export function syncInsightVariables(
  story: Story,
  levels: Record<InsightId, number>,
  archetype: ArchetypeId | null,
): void {
  const vs = story.variablesState
  for (const id of INSIGHT_IDS) {
    const varName = INSIGHT_ID_TO_INK_VAR[id]
    if (vs.GlobalVariableExistsWithName(varName)) {
      vs.$(varName, levels[id])
    }
  }
  if (archetype !== null && vs.GlobalVariableExistsWithName('archetype')) {
    vs.$('archetype', archetype)
  }
}
