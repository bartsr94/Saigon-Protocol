# Casefile Progression Spec

*Working spec for turning the current static Casefile overlay into a real investigation-progression system for Case 1 and beyond.*

## Goal

Make the Casefile a real gameplay layer instead of a static codex.

The player should gradually build a case by collecting:

- **evidence**: tangible artifacts, records, samples, files, witness materials
- **case notes**: deductions, summaries, interview takeaways, location conclusions

This system should support the noir investigation tone by making the player feel they are assembling truth out of fragments rather than simply watching scenes happen.

## Current state

Right now:

- `src/content/casefile.ts` is static placeholder content
- `src/components/screens/CasefileOverlay.tsx` always renders the full list
- no store tracks acquired evidence or unlocked notes
- save data does not persist casefile progression
- Ink has no way to grant evidence or notes

This is not enough for Case 1, where the story depends on the player gradually uncovering the Aveline / Nusantara trail.

## Design principles

- The Casefile should reflect **what the detective knows now**, not everything the writer knows.
- Not every useful discovery becomes evidence; some discoveries become notes.
- Evidence should feel concrete and collectible.
- Notes should feel interpretive and contextual.
- The system should be simple enough to implement now, but extensible for later cases.
- The Casefile should support open-world investigation order without collapsing the story into one rigid sequence.

## Core model

### Evidence

Evidence is a discrete item the detective has acquired, seen, copied, or logged.

Examples for Case 1:

- Aveline incident statement
- containment maintenance report
- HN-series intake ledger fragment
- clinic stabilizer bottle
- transit death certification copy
- ghost identity file
- Nhi Quyen message cache

Each evidence item should have:

- `id`
- `name`
- `tier`
- `description`
- optional `districtId`
- optional `sourceLocationId`
- optional `tags`

### Case notes

Case notes are authored detective-facing summaries unlocked when enough context exists.

Examples for Case 1:

- "Aveline's story doesn't fit the room they showed me."
- "The missing asset was a person, not a sample."
- "Nusantara transit records are cleaner than reality."
- "HN-12 was not the first failure."

Each note should have:

- `id`
- `heading`
- `body`
- optional `districtId`
- optional `order`
- optional `tags`

### Investigation flags

Separate from visible evidence and notes, the system may need hidden flags for gating dialogue and district unlocks.

Examples:

- `knows_break_in_story_is_false`
- `met_former_employee`
- `saw_containment_wing`
- `knows_hn12_real_name`

Recommendation:

Do **not** expose these directly in the Casefile UI. Keep them as implementation support for branching and unlock logic.

## Recommended content split

### `src/content/casefile.ts`

Should evolve into static definitions only.

Recommended exports:

- `EVIDENCE: Record<EvidenceId, EvidenceDefinition>`
- `CASE_NOTES: Record<CaseNoteId, CaseNoteDefinition>`

Do not use it to represent ownership or unlock state.

### New progression store

Add a dedicated store, likely:

- `src/stores/casefileStore.ts`

Responsibilities:

- track acquired evidence IDs
- track unlocked note IDs
- optionally track hidden investigation flags
- expose grant / query / reset / hydrate methods

### Optional pure engine

If the unlock logic becomes more than simple set membership, add:

- `src/engine/casefileEngine.ts`

This would hold pure helpers for:

- deriving sort order
- validating unlock transitions
- grouping evidence by district or tag

Recommendation:

Start simple. A store may be enough at first unless logic grows quickly.

## Store shape recommendation

Example shape:

```ts
interface CasefileState {
  evidenceIds: Set<EvidenceId>
  noteIds: Set<CaseNoteId>
  flags: Set<string>

  addEvidence: (id: EvidenceId) => void
  unlockNote: (id: CaseNoteId) => void
  setFlag: (flag: string) => void

  hasEvidence: (id: EvidenceId) => boolean
  hasNote: (id: CaseNoteId) => boolean
  hasFlag: (flag: string) => boolean

  hydrate: (state: SerializedCasefileState) => void
  reset: () => void
}
```

Important behavior:

- adding the same evidence twice is idempotent
- unlocking the same note twice is idempotent
- flags should also be idempotent

## Save/load requirements

Casefile progression must be saved.

### Save engine changes

Add to the save blob:

```ts
interface SerializedCasefileState {
  evidenceIds: EvidenceId[]
  noteIds: CaseNoteId[]
  flags: string[]
}
```

### Save store changes

`captureBlob()` should include casefile state.

`loadSlot()` should hydrate the casefile store.

### Versioning

Adding casefile progression should likely require a save format bump.

Recommendation:

- bump `SAVE_FORMAT_VERSION`
- treat old saves as incompatible rather than attempting migration

That matches the current repo philosophy and keeps implementation clean.

## UI behavior

### Overlay tabs

Keep the current two-tab structure:

- `Evidence`
- `Case Notes`

This is already a good shape and does not need reinvention.

### Evidence tab behavior

Show only acquired evidence by default.

Possible states:

- no evidence yet
- evidence list with selection
- selected evidence detail panel

Recommendation:

- do **not** show locked evidence silhouettes at first
- keep the Casefile grounded in known facts, not completionism

### Notes tab behavior

Show only unlocked notes in chronological or authored order.

Recommendation:

- newest notes can appear at the top
- or use explicit authored order if pacing matters more than recency

For Case 1, explicit authored order is likely safer because deductions may need to read cleanly as an investigation arc.

### Empty-state copy

Evidence empty state:

- "No logged evidence yet."

Notes empty state:

- "No case notes yet."

We should avoid making the detective look incompetent. Empty should feel like the case has not yielded anything yet, not like a missing feature.

## Acquisition model

### Evidence acquisition

Evidence should be granted when the detective:

- physically acquires an item
- copies a file
- logs a scene result
- receives a document through interview or records access

Not every clue becomes evidence. Evidence should feel like something the detective could plausibly review later.

### Note acquisition

Notes should unlock when:

- a scene resolves an open question
- a pattern becomes clear across multiple clues
- the detective reaches a meaningful conclusion

This means notes are often higher-order than evidence.

Example:

- evidence: `transit-death-certificate`
- evidence: `ghost-id-ledger`
- note unlocked: `The dead are being moved twice: once in body, once on paper.`

This is a good noir structure because the player gathers fragments, then sees the detective synthesize them.

## Integration with story content

### Phase 1 recommendation

Use store actions called from the component / story seam rather than immediately extending Ink externals in many directions.

Possible approaches:

1. **Story-driven via external functions**
Ink can directly grant evidence / notes through `EXTERNAL` calls.

2. **TS-driven via scene result hooks**
The game grants evidence after specific choices or scene checkpoints in TypeScript.

Recommendation:

Use **Ink-driven grant calls** once the interface is stable, because evidence acquisition is mostly authored content.

Likely future externals:

- `gain_evidence(evidenceId)`
- `unlock_note(noteId)`
- `set_case_flag(flag)`

These should remain TS-authoritative for actual mutation, as with checks and wellbeing.

## Case 1 evidence categories

To keep the Casefile readable, group evidence conceptually even if the first UI does not visually separate them yet.

Suggested categories:

- **Aveline Internal**
  - statements, maintenance logs, containment reports, project records

- **Medical / Biological**
  - stabilizers, symptom notes, lab samples, care instructions

- **Transit / Bureaucratic**
  - intake forms, death notices, identity records, permits

- **Witness Materials**
  - recordings, messages, recovered notes, personal effects

## Case 1 note categories

Suggested conceptual groupings:

- **Lab Irregularities**
- **Subject History**
- **Transit / Intake Pattern**
- **HN-Series Pattern**
- **HN-12 Personal Truth**

Again, these can stay conceptual at first if a category UI would slow us down.

## Suggested Case 1 progression structure

### Early case

Evidence examples:

- official Aveline incident report
- perimeter access log
- front-lab witness statement

Notes examples:

- "Aveline wanted official eyes here for a reason."

### Mid case

Evidence examples:

- clinic compound bottle
- former employee message fragment
- intake ledger mismatch
- engineering maintenance anomaly

Notes examples:

- "This was not theft. It was concealment."
- "Whoever they lost, they lost from inside."

### Late case

Evidence examples:

- HN-series summary page
- transit death certificate copies
- Nhi Quyen file cache
- containment breach records

Notes examples:

- "HN-12 was one attempt in a line of bodies."
- "The city was used to make these people disappear."
- "The thing Aveline lost is still a person."

## Gating use cases

Casefile state should be able to help unlock:

- deeper district access
- more precise questions in dialogue
- credibility with reluctant witnesses
- lab re-entry
- final understanding of HN-12

Important:

The player should not need to manually combine evidence in a puzzle UI yet. The Casefile should support authored branching and understanding first.

## Recommended implementation phases

### Phase 1 - Data and persistence

- define real evidence / note IDs
- add `casefileStore`
- add save blob support
- update Casefile overlay to render owned content only

### Phase 2 - Story integration

- add simple grant methods
- wire early locations and scenes to grant evidence / notes
- use hidden flags for story gating where needed

### Phase 3 - Polish

- sorting, grouping, district tagging
- improved empty states
- optional "new evidence" highlighting
- optional sound / UI feedback when the Casefile updates

## Current file impact

Likely required:

- `src/content/casefile.ts`
- `src/components/screens/CasefileOverlay.tsx`
- `src/stores/casefileStore.ts`
- `src/stores/casefileStore.test.ts`
- `src/engine/saveEngine.ts`
- `src/stores/saveStore.ts`

Possible later:

- `src/engine/casefileEngine.ts`
- `src/engine/casefileEngine.test.ts`

## Open questions

- Do we want notes to unlock strictly through authored triggers, or sometimes automatically when the player owns enough evidence?
- Should the overlay visually distinguish "evidence acquired" from "evidence logged but not physically retained"?
- Do we want district tags visible in the UI, or only used internally for sorting/filtering?
- How many hidden flags should live in the casefile store versus in Ink state?

## Recommendation

Implement the Casefile as a **real progression store with saved state** before writing large amounts of Case 1 story content.

Without that, the investigation cannot feel materially cumulative, and the player will be asked to care about clues the game itself is not truly tracking.
