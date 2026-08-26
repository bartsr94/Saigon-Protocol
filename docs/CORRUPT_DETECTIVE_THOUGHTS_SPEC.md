# Corrupt Detective Thoughts Spec

*Extends the already-built Thought Cabinet (`content/thoughts.ts`,
`stores/thoughtStore.ts`, `ThoughtCabinetOverlay.tsx`, `bindThoughtFunctions`
in `storyEngine.ts`) with a cop-corruption thought branch: four thoughts,
plus one new piece of engine support the branch needs that doesn't exist
yet. The two shipped thoughts (`checkpoint-improviser`, `company-man-doubt`)
are both single-trigger, insight-bonus-only, and never read by ink. This
branch is the first content to actually exercise `has_thought` for
dialogue-gating, and the first to need a tally across multiple actions
instead of one `unlock_thought` call.*

## Goal

Give the player a mind-cabinet arc that rewards (and marks) playing the
detective as someone willing to bend or break the job — bribes, leverage,
looking away — with real mechanical teeth: Insight swings and new dialogue
reachable only once a thought is enabled. Four thoughts to start, building
toward one payoff thought that requires having taken more than one corrupt
action, not just one.

## New mechanism: the corruption tally

Nothing today lets a thought's unlock condition depend on *how many* things
the player has done, only *whether* one specific ink call fired. Thought #2
below needs a count. Add it as its own small system, same shape as the
Relationship System (§14) — mutate via one EXTERNAL, read via a synced ink
global — rather than overloading `caseStore`'s flag/evidence bag, since this
is fully general (any future "did this enough times" thought reuses it, not
just corruption-themed ones).

- **`stores/corruptionStore.ts`** — one `Set<string>` of marked action ids
  (not a bare counter) so replaying the same corrupt choice on a repeat
  visit doesn't inflate the tally — same dedup logic evidence/notes already
  get for free from being Set-membership rather than a counter.
  `markCorruptAction(actionId)` adds to the set; `corruptionCount` is a
  derived `size` read.
- **`engine/corruptionEngine.ts`** — `SerializedCorruptionState` (`markedActionIds:
  string[]`) + `serialize`/`hydrate`, same pattern as `thoughtEngine.ts`.
- **New EXTERNAL, `mark_corrupt_action(actionId)`** — ink declares a
  free-form id (same shape as `set_case_flag`), bound in
  `bindCorruptionFunctions` in `storyEngine.ts`.
- **New synced ink global, `corruption_count`** — pushed the same way
  `affinity_<npc>` is (`syncCorruptionVariables`, called alongside
  `syncInsightVariables`/`syncRelationshipVariables` in `storyStore.ts`'s
  `loadStory`, plus the same live-subscription-for-the-life-of-the-story
  pattern). Ink checks it directly: `{ corruption_count >= 2: ... }`.
- **Unlock stays ink-side, at each corrupt-action call site** — no
  centralized "watch the counter, auto-unlock" listener. Each corrupt
  choice that should count toward thought #2 calls
  `mark_corrupt_action("<unique-id>")` then checks
  `{ corruption_count >= 2: ~ unlock_thought("everyones-got-a-price") }`.
  `unlockThought` is already idempotent (no-ops if already unlocked), so
  it's safe to re-check this on every qualifying action past the threshold
  rather than needing a "did I already unlock this" guard.
- `SAVE_FORMAT_VERSION` bumps (currently 11) to capture
  `SerializedCorruptionState` in `SaveBlob`, same as the Cases-rework and
  Relationship-System bumps before it.

### Schema change this branch also needs

`ThoughtDefinition.insightBonus` is currently a single `ThoughtBonus`. Three
of the four thoughts below want a paired bonus/cost (gain one Insight, dull
another) — the DE-style trade-off the two shipped thoughts don't attempt
(both are pure upside). Change the field to `insightBonuses?: ThoughtBonus[]`
(plural), migrate the two existing thoughts to a one-entry array, and update
`ThoughtCabinetOverlay.tsx`'s bonus pill rendering to map over the array
instead of rendering a single pill. Purely additive to the data shape, no
store logic changes.

## The four thoughts

### 1. The Envelope Test *(gateway thought, single-trigger)*

- **Unlock:** first payoff taken instead of doing the job straight. New
  corrupt option in `content/ink/district4/checkpoint.ink`'s queue scene —
  a third choice alongside "Try to talk your way to the front" / "Just wait
  it out": accept a chit to wave a vehicle through unlogged (mirrors the
  Aveline-badged woman the scene already shows skipping the line for free).
  No check — taking the money is a flat choice, not a roll.
  `~ mark_corrupt_action("checkpoint-envelope")` then
  `~ unlock_thought("envelope-test")`.
- **Effect:** `+1 Hustle` / `-1 Root` — sharper at reading an angle,
  number to who it costs.
- **Dialogue:** unlocks a "test the water" option in
  `content/ink/district3/undercanopy.ink` (Cò the fixer) — he only offers
  off-book work to cops who've already shown they'll take one:
  `{ has_thought("envelope-test"): * [Ask Cò what "off the books" actually pays.] }`.

### 2. Everyone's Got a Price *(tally thought — needs the mechanism above)*

- **Unlock:** `corruption_count >= 2` — the player has taken at least two
  distinct marked corrupt actions anywhere (Envelope Test's checkpoint
  payoff counts as one; this thought needs at least one more corrupt beat
  authored elsewhere, e.g. a District 3 vice-economy payoff at Tú Xương
  Clinic or a second checkpoint-style shortcut, to actually be reachable —
  flagged under Open questions).
- **Effect:** `+1 Ledger` / `-1 Static` — everything becomes negotiable;
  the climate-dread noticing-things voice goes quiet.
- **Dialogue:** unlocks a general "name a price" shortcut on
  negotiation-flavored checks — a new choice option that bypasses the roll
  by paying or taking payoff instead, gated `has_thought("everyones-got-a-price")`
  wherever a Hustle/Ledger check is already offered. (Scope note: start with
  one instance rather than retrofitting every existing check — see Open
  questions.)

### 3. Leaned On *(renamed from "Badge Heavy" — see below)*

- **Unlock:** taking the **leverage path** already authored in
  `content/ink/district4/aveline/meiHong.ink` — the existing
  `checkpoint-mei-hong-leverage` Red check (ledger, TN 7, gated on holding
  both `drone-log` and `note-05`) that coerces the Inner Containment Wing
  door open by threatening Mei Hong rather than earning Lakshmi's trust.
  This scene already exists; the only addition is
  `~ unlock_thought("leaned-on")` on its success branch. No new content
  required for the trigger.
- **Effect:** `+1 Muscle Memory` / `-1 Mask` — the threat reads off you
  now, at the cost of the social-chameleon options.
- **Dialogue:** unlocks intimidation-flavored choice variants at District 3
  vice-economy locations (Cò, Tú Xương Clinic) — people who clock a cop as
  "leaned on someone once already" are more easily pushed, less easily
  charmed. **Deliberately not hooked to Lakshmi Avani** — her warmth arc
  (affinity-gated portraits up to `love`, `CASE_1_CAST_SPEC.md`) is fully
  authored and shouldn't be retroactively gated by a thought that didn't
  exist when it shipped; see Open questions.

### 4. Look the Other Way

- **Unlock:** letting something slide at a District 3 vice-economy location
  instead of pursuing it — new content, e.g. at Tú Xương Clinic or the
  fixer bar (`undercanopy.ink`), a choice to not report what's obviously an
  off-book operation. `~ mark_corrupt_action("clinic-look-away")` (also
  counts toward thought #2's tally) then
  `~ unlock_thought("look-the-other-way")`.
- **Effect:** `+1 Graft` / `-1 Ledger` — numbness reads as kinship with the
  modified and the vice economy, at the cost of the moral math.
- **Dialogue:** unlocks complicity/silence options with vice-economy NPCs
  (Cò, clinic staff) who now treat the player as safe to talk in front of.
  **Deliberately not hooked to the Aveline cover-up thread** (Lakshmi's
  notes, `note-03`/`note-05`) — that's Case 1's spine evidence, and gating
  it behind an optional thought risks either blocking or trivializing
  main-case content; see Open questions.

## Mechanical summary

| What | Mechanism |
|---|---|
| New store | `stores/corruptionStore.ts` — `Set<string>` of marked action ids |
| New engine module | `engine/corruptionEngine.ts` — serialize/hydrate, mirrors `thoughtEngine.ts` |
| New EXTERNAL | `mark_corrupt_action(actionId)`, bound in `bindCorruptionFunctions` |
| New synced ink global | `corruption_count`, pushed by `syncCorruptionVariables` in `storyStore.ts`'s `loadStory` |
| Schema change | `ThoughtDefinition.insightBonus` → `insightBonuses?: ThoughtBonus[]`; migrate the 2 existing thoughts; update `ThoughtCabinetOverlay.tsx` pill rendering |
| Save format | `SAVE_FORMAT_VERSION` 11 → 12, `SaveBlob` gains `corruption: SerializedCorruptionState` |
| Thought 1 trigger | New checkpoint payoff choice, `checkpoint.ink` |
| Thought 2 trigger | `corruption_count >= 2`, checked wherever a marked action already fires |
| Thought 3 trigger | Existing `checkpoint-mei-hong-leverage` success branch, `meiHong.ink` — zero new scene content |
| Thought 4 trigger | New vice-economy look-away choice, `undercanopy.ink` or `tuXuongClinic.ink` |
| Dialogue gates | All via existing `has_thought(id)` EXTERNAL — no engine change needed, just `{ has_thought("..."): ... }` in new/edited ink content |

## Asset needs

None identified — no new portraits or locations required. All four thoughts
route through existing or lightly-extended scenes.

## Open questions

- **Thought 2's second tally source.** One marked action (Envelope Test)
  isn't enough to reach `corruption_count >= 2` on its own — needs a second
  marked corrupt beat authored somewhere. Leaned On's leverage check and
  Look the Other Way's clinic choice are both natural candidates to also
  call `mark_corrupt_action`, which would make thought 2 reachable via any
  two of the other three rather than needing its own dedicated trigger
  scene. Recommend this over authoring a fifth standalone corrupt beat.
- **Where "Leaned On" and "Look the Other Way" gate dialogue.** Deliberately
  routed to Cò/vice-economy NPCs instead of Lakshmi Avani or the Aveline
  cover-up thread, to avoid retroactively touching already-shipped,
  carefully authored content (Lakshmi's warmth arc) or Case 1's spine
  evidence. Flag if you'd rather have one of these actually intersect
  Lakshmi or the cover-up — it's a bigger change (touches shipped content)
  and should be a deliberate call, not a default.
- **Thought 2's "name a price" dialogue gate scope.** Proposed as one new
  instance to start (not a retrofit of every existing Hustle/Ledger check)
  — confirm that's the right scope for a first pass versus picking a
  specific existing check to attach it to.
- **Naming.** "Badge Heavy" renamed to "Leaned On" in this draft (reads
  less like a stat name, more like the DE-style thought title convention
  the two shipped thoughts use — "Talk First, Think Later," "Filed,
  Followed Up, Handled"). Open to alternates.

## Recommendation

Build the corruption tally as its own small system (store + engine module +
one EXTERNAL + one synced global), migrate `ThoughtDefinition` to support
paired bonus/cost, then author the four thoughts in order 1 → 3 → 4 → 2
(3 needs zero new scene content since its trigger already exists; 1 and 4
are small additions to existing files; 2 falls out for free once 1/3/4 each
call `mark_corrupt_action`). No changes to `content/cases.ts` or any
already-shipped NPC arc.
