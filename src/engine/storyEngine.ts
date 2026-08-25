// Wraps a bound inkjs Story: the ink<->TS boundary from Architecture §6.
// Pure and store-agnostic — takes a Story instance plus injected handlers,
// same testable-in-isolation style as checkResolution.ts. Never imports a
// Zustand store directly; storyStore.ts supplies the handlers.

import type { Story } from 'inkjs'
import { INSIGHT_IDS, type InsightId } from '../content/insights'
import type { ArchetypeId } from '../content/archetypes'
import { CASES, CASE_IDS, CASE_NOTE_IDS, EVIDENCE_IDS, type CaseId, type CaseNoteId, type EvidenceId } from '../content/cases'
import { THOUGHT_IDS, type ThoughtId } from '../content/thoughts'
import { NPC_IDS, type NpcId } from '../content/npcs'
import type { CheckResult } from './checkResolution'
import type { CheckRisk } from '../stores/insightStore'
import type { BackgroundId } from '../content/backgrounds'
import type { MusicId } from '../content/music'
import type { VoiceClipId } from '../content/voiceClips'
import type { AmbienceCue, LineSpeaker } from './contentTags'

/**
 * A single parsed batch of ink output plus whatever line-tags applied to it —
 * storyStore's per-`Continue()` unit, and also the unit saved/restored
 * verbatim by the Save/Persistence Layer and Conversation View's per-NPC
 * resume state (see saveEngine.ts's `inkStateLines` and conversationEngine.ts's
 * `SavedConversationState`), since ink's own serialized state doesn't
 * reliably round-trip `currentText`/`currentTags` for every knot shape —
 * see storyStore.ts's `hydrateFromRestoredState` for why. Defined here
 * rather than in storyStore.ts so those pure engine modules can reference it
 * without importing a store.
 */
export interface StoryLine {
  text: string
  speaker: LineSpeaker
  /** Set only on lines carrying a `# background: <id>` tag; null otherwise (caller keeps the last one shown). */
  background: BackgroundId | null
  /** Set only on lines carrying a `# portrait: <variantId>` tag (docs/NPC_PORTRAIT_VARIANTS_SPEC.md); null otherwise (caller keeps the last one shown). */
  portrait: string | null
  /** Set only on lines carrying a `# music: <id>` tag; null otherwise (caller keeps whatever track was last cued). */
  music: MusicId | null
  /** Always present — describes the ambience-layer diff this line applies, empty/false when the line carries no `ambience` tag. */
  ambienceOps: AmbienceCue
  /** Set only on lines carrying a `# voice: <id>` tag; one-shot, no persistence concept. */
  voice: VoiceClipId | null
}

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

/** Architecture §13 — ink grants case progress, TS owns ownership/unlock state. */
export interface CaseHandlers {
  gainEvidence: (id: EvidenceId) => void
  unlockNote: (id: CaseNoteId) => void
  /** Flags are free-form strings (also gate Location Hub locked doors) — no ID union to validate against. */
  setCaseFlag: (flag: string) => void
  /** Read-side counterparts, letting ink gate content on case state already granted (same shape as `has_thought`). */
  hasEvidence: (id: EvidenceId) => boolean
  hasNote: (id: CaseNoteId) => boolean
  hasFlag: (flag: string) => boolean
  /** Marks a case (`content/cases.ts`'s `CaseId`) Active — the Cases overlay only ever shows started cases. */
  startCase: (id: CaseId) => void
  /** Marks one of that case's authored objectives done. Does not itself complete the case. */
  completeObjective: (caseId: CaseId, objectiveId: string) => void
  /** Moves a case from Active to Completed. */
  completeCase: (id: CaseId) => void
  isCaseActive: (id: CaseId) => boolean
  isCaseCompleted: (id: CaseId) => boolean
  isObjectiveComplete: (caseId: CaseId, objectiveId: string) => boolean
}

function assertInsightId(value: unknown): InsightId {
  if (typeof value === 'string' && (INSIGHT_IDS as string[]).includes(value)) {
    return value as InsightId
  }
  throw new Error(`roll_check called with unknown insight "${String(value)}"`)
}

function assertEvidenceId(value: unknown): EvidenceId {
  if (typeof value === 'string' && (EVIDENCE_IDS as string[]).includes(value)) {
    return value as EvidenceId
  }
  throw new Error(`gain_evidence called with unknown evidence id "${String(value)}"`)
}

function assertCaseNoteId(value: unknown): CaseNoteId {
  if (typeof value === 'string' && (CASE_NOTE_IDS as string[]).includes(value)) {
    return value as CaseNoteId
  }
  throw new Error(`unlock_note called with unknown note id "${String(value)}"`)
}

function assertThoughtId(value: unknown): ThoughtId {
  if (typeof value === 'string' && (THOUGHT_IDS as string[]).includes(value)) {
    return value as ThoughtId
  }
  throw new Error(`thought function called with unknown thought id "${String(value)}"`)
}

function assertNpcId(value: unknown): NpcId {
  if (typeof value === 'string' && (NPC_IDS as string[]).includes(value)) {
    return value as NpcId
  }
  throw new Error(`adjust_affinity called with unknown npc id "${String(value)}"`)
}

function assertFlagName(value: unknown): string {
  if (typeof value === 'string' && value.length > 0) return value
  throw new Error(`set_case_flag called with an invalid flag name "${String(value)}"`)
}

function assertCaseId(value: unknown): CaseId {
  if (typeof value === 'string' && (CASE_IDS as string[]).includes(value)) {
    return value as CaseId
  }
  throw new Error(`case function called with unknown case id "${String(value)}"`)
}

/** Validated against the named case's own authored objectives — an objective id is only unique within its case, not globally. */
function assertObjectiveId(caseId: CaseId, value: unknown): string {
  if (typeof value === 'string' && CASES[caseId].objectives.some((o) => o.id === value)) {
    return value
  }
  throw new Error(`complete_case_objective called with unknown objective id "${String(value)}" for case "${caseId}"`)
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

/**
 * Binds the case EXTERNALs ink calls to grant investigation/quest progress
 * (Architecture §13): `gain_evidence(evidenceId)` and `unlock_note(noteId)`
 * are validated against `content/cases.ts`'s `EVIDENCE_IDS`/`CASE_NOTE_IDS`
 * the same way `roll_check` validates insight names, so a typo'd id fails
 * loudly at the ink call site rather than silently no-opping.
 * `set_case_flag(flag)` takes any non-empty string — flags aren't a closed
 * content set (Location Hub locked doors key off them too).
 * `has_evidence`/`has_note`/`has_case_flag` are the read-side counterparts,
 * letting ink gate a choice on case state it already granted — same "call
 * an EXTERNAL inside an ink conditional" pattern `has_thought`/
 * `is_red_check_consumed` already use.
 *
 * `start_case(caseId)`/`complete_case_objective(caseId, objectiveId)`/
 * `complete_case(caseId)` are the quest-tracking half (multiple concurrent
 * `CaseId`s, each with its own authored `objectives` — content/cases.ts):
 * a case only ever shows up in the Cases overlay once some scene calls
 * `start_case` on it, same "content drives state" convention as everything
 * else on this boundary. `is_case_active`/`is_case_completed`/
 * `is_objective_complete` are their read-side counterparts.
 */
export function bindCaseFunctions(story: Story, handlers: CaseHandlers): void {
  story.BindExternalFunction('gain_evidence', (id: string) => handlers.gainEvidence(assertEvidenceId(id)))
  story.BindExternalFunction('unlock_note', (id: string) => handlers.unlockNote(assertCaseNoteId(id)))
  story.BindExternalFunction('set_case_flag', (flag: string) => handlers.setCaseFlag(assertFlagName(flag)))
  story.BindExternalFunction('has_evidence', (id: string) => handlers.hasEvidence(assertEvidenceId(id)))
  story.BindExternalFunction('has_note', (id: string) => handlers.hasNote(assertCaseNoteId(id)))
  story.BindExternalFunction('has_case_flag', (flag: string) => handlers.hasFlag(assertFlagName(flag)))
  story.BindExternalFunction('start_case', (caseId: string) => handlers.startCase(assertCaseId(caseId)))
  story.BindExternalFunction('complete_case_objective', (caseId: string, objectiveId: string) => {
    const id = assertCaseId(caseId)
    handlers.completeObjective(id, assertObjectiveId(id, objectiveId))
  })
  story.BindExternalFunction('complete_case', (caseId: string) => handlers.completeCase(assertCaseId(caseId)))
  story.BindExternalFunction('is_case_active', (caseId: string) => handlers.isCaseActive(assertCaseId(caseId)))
  story.BindExternalFunction('is_case_completed', (caseId: string) => handlers.isCaseCompleted(assertCaseId(caseId)))
  story.BindExternalFunction('is_objective_complete', (caseId: string, objectiveId: string) => {
    const id = assertCaseId(caseId)
    return handlers.isObjectiveComplete(id, assertObjectiveId(id, objectiveId))
  })
}

/** Progression System plan — thought cabinet EXTERNALs. */
export interface ThoughtHandlers {
  unlockThought: (id: ThoughtId) => void
  isThoughtEnabled: (id: ThoughtId) => boolean
}

/**
 * Binds the two thought-cabinet EXTERNALs: `unlock_thought(thoughtId)` lets ink grant a
 * thought (same shape as `unlock_note`), `has_thought(thoughtId)` lets ink query whether
 * it's currently enabled for perception-gated content — the same "call an EXTERNAL inside
 * an ink conditional" pattern `is_red_check_consumed` already exercises.
 */
export function bindThoughtFunctions(story: Story, handlers: ThoughtHandlers): void {
  story.BindExternalFunction('unlock_thought', (id: string) => handlers.unlockThought(assertThoughtId(id)))
  story.BindExternalFunction('has_thought', (id: string) => handlers.isThoughtEnabled(assertThoughtId(id)))
}

/** Relationship System (SAIGON_PROTOCOL_ARCHITECTURE.md §14) — per-NPC affinity EXTERNAL. */
export interface RelationshipHandlers {
  adjustAffinity: (npcId: NpcId, amount: number) => void
}

/** Binds `adjust_affinity(npcId, amount)` — ink declares a delta, TS owns the actual score and clamping (wellbeing-EXTERNAL style, e.g. `damage_vitality`). */
export function bindRelationshipFunctions(story: Story, handlers: RelationshipHandlers): void {
  story.BindExternalFunction('adjust_affinity', (npcId: string, amount: number) =>
    handlers.adjustAffinity(assertNpcId(npcId), amount),
  )
}

/**
 * npcId ('lakshmiAvani') -> its synced ink global name ('affinity_lakshmi_avani').
 * Auto-derived rather than an explicit map like INSIGHT_ID_TO_INK_VAR below —
 * the NPC roster is open-ended and will keep growing, unlike the fixed 7
 * Insights, so hand-maintaining a parallel map here is pure toil for a fully
 * mechanical transform (SAIGON_PROTOCOL_ARCHITECTURE.md §14).
 */
export function npcIdToAffinityVar(id: NpcId): string {
  return `affinity_${id.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)}`
}

/**
 * Pushes each NPC's live affinity score into its synced ink global, same
 * skip-if-undeclared behavior as syncInsightVariables below. This is the
 * "ink can read the current score" half of the system; bindRelationshipFunctions
 * above is the "ink can nudge it" half.
 */
export function syncRelationshipVariables(story: Story, affinity: Record<NpcId, number>): void {
  const vs = story.variablesState
  for (const id of NPC_IDS) {
    const varName = npcIdToAffinityVar(id)
    if (vs.GlobalVariableExistsWithName(varName)) {
      vs.$(varName, affinity[id])
    }
  }
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
