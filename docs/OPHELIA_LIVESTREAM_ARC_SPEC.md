# Ophelia Livestream Arc Spec

*Extends `docs/OPHELIA_CHARACTER_SPEC.md`'s three-stage structure
(Recognition → Pattern → Choice, per its "Story use" section) with the
connective scene between Recognition and Pattern: Ophelia leaning on the
detective to appear in one of her streams. Stays additive to the existing
`ophelia-stalker` case — no change to `CASES['ophelia-stalker'].objectives`
in `content/cases.ts`, only new ink content, one new case note, and a
couple of `set_case_flag` flags.*

## Goal

Give the detective a concrete, in-character reason to end up publicly
associated with Ophelia — not because the case demands it, but because she
talks him into it — and use that appearance as the thing that provokes the
stalker's next move. This is the bridge the character spec's "Story use"
section gestures at but doesn't detail: how the player actually gets from
"I met her" to "the pattern is real."

## Premise

Ophelia's numbers are down. Per `OPHELIA_CHARACTER_SPEC.md`'s "Real life
underneath it" (recommended option 2: a bad revenue-sharing contract with
whoever first "helped" her build the audience), a slow week isn't just
vanity — it's rent, cosmetic upkeep, and off-book security she's paying for
out of pocket, against a contract that already skims more than it should.
She needs something that reads as new. A cop who's already seen her scared
and still treats her like a person is, whether she'd admit it out loud or
not, the most interesting thing that's happened to her in months.

She does not ask directly. She never does. She wears him down.

## Placement

- Gated on `is_objective_complete("ophelia-stalker", "recognition")` — this
  can't fire before the player has met her at Turtle Lake.
- Recommend also gating on `affinity_ophelia >= 2` so it doesn't fire on
  the very next visit — a beat of ordinary topic-loop banter first makes
  the ask land as "we know each other a little now" instead of "I met you
  once and you already want something."
- Fires as a **forced beat inside `ophelia_topics`'s entry text**, not a
  selectable topic — she raises it before any topic buttons render, same
  place the existing `affinity_ophelia >= 3` greeting branch already lives
  in `turtleLakePlaza.ink`. This matches "she twists his arm," not "the
  player goes looking for this." Once resolved (agreed or refused), a case
  flag (`set_case_flag("ophelia-stream-asked")`) suppresses it from firing
  again — subsequent visits fall through to the normal topic loop.

## Scene 1 — The Ask (Turtle Lake Plaza, `ophelia_topics`)

Beat shape, in order:

1. **Casual, deniable.** She opens like it's nothing — "stand somewhere
   photogenic and look mysterious for twenty minutes" register. This is
   consistent with her established brattiness: attention is tribute she's
   owed, so the ask starts as an entitlement, not a favor.
2. **The real number, dropped like an accident.** She lets slip how bad
   the week's numbers actually are — the first crack, delivered like she
   resents having to say it out loud at all.
3. **The guilt turn.** If he hesitates, she doesn't argue the case — she
   goes quiet, sad, faux-wounded ("forget it, obviously it was a stupid
   thing to ask a cop"), daring him to feel like the bad guy for a normal
   boundary. This is the "acts all sad" beat from the pitch, and it should
   read as *recognizably* a tactic — Mask-insight players especially
   should be able to clock it as one — without that recognition making it
   any less effective, because underneath the tactic the fear and the
   financial pressure are real. Per the character spec's guardrails: this
   is armor cracking under real pressure, not a villain manipulating a
   mark.
4. **Landing.** Two real outcomes (see below), each reachable through
   several insight-flavored lines of dialogue so refusing doesn't read as
   the "mean" choice and agreeing doesn't read as the only warm one.

No check gates this decision — coercion-by-guilt shouldn't require a good
roll to say no to. Insight tags on the response lines are for flavor/voice
(a Mask-tagged refusal that names the tactic outright reads differently
than a Root-tagged one that just declines gently), not gates.

### Outcome A — Agrees (recommended primary path)

`set_case_flag("ophelia-stream-agreed")`. Unlocks Scene 2 at Pasteur
Street Taproom on the next visit there. Small immediate affinity bump
(`adjust_affinity("ophelia", 1)`) for saying yes — the larger swing happens
in Scene 2 based on how it actually goes.

### Outcome B — Refuses

`set_case_flag("ophelia-stream-refused")`. No affinity penalty for a clean,
respectful refusal (the writing guardrails below cover why). She does the
stream alone. Skips straight to a shorter version of Scene 3 (see "Pattern
without Scene 2") the next time the player returns to Turtle Lake — the
stalker escalates anyway, just discovered secondhand instead of lived
through, and the tone is colder: she's a little more guarded with the
detective afterward, not punitively, just further proof to her that people
mostly show up for the version of her that's useful to them.

## Scene 2 — The Stream (Ophelia's Apartment, new District 3 location)

**Revised per direction:** Scene 2 does not happen at Pasteur Street
Taproom. Agreeing to help unlocks a brand-new standalone location —
**Ophelia's Apartment** — on the District 3 street map, locked (greyed out,
`lockedReason` shown) until `ophelia-stream-agreed` is set in Scene 1. Once
unlocked, she relocates there for good: her Turtle Lake POI stops offering
the normal topic loop and instead plays a short "she's not here anymore,
you know where to find her" redirect. This is a new mechanism for this
codebase — the first case of a full overworld location (not just a
Location-Hub-internal `HubDoor`) unlocking off a case flag rather than the
existing unconditional `unlocksOnComplete` — see "Mechanical summary"
below for exactly how it's wired.

New `LocationId`: `opheliaApartment` (District 3, `unlockedByDefault:
false`). New District 3 street POI (spur, same shape as the existing
Pasteur Street Taproom / Tú Xương Clinic spurs) and a new small
`GridHubDefinition` in `content/locationHubs.ts` with one `talk` POI
(Ophelia, `topicsKnot: 'ophelia_apartment_topics'`) and one `inspect` POI
for atmosphere.

Shape of the scene itself (unchanged from the original draft otherwise):

- A small locked room, a ring light, a rented-looking backdrop doing its
  best to read as more glamorous than the building underneath it actually
  is. Ophelia in full performance mode — the "online" Ophelia from the
  character spec's "Public persona" section, not the Turtle Lake one.
- The bit: she frames him as a "mystery guest," feeds the audience just
  enough noir — a cop, off the record, here for reasons she won't confirm
  — to be interesting without naming anything real about the case. This
  keeps the tone in her established register (curated decadence, confession
  sold as unscripted) rather than turning into explicit content — nothing
  about the scene needs to depict the paid-intimacy work itself, only the
  performance of proximity to it, which is enough per her existing content
  (`ophelia_topics`'s "Sells online?" line already handles the specifics at
  this same level of remove).
- **One Red check** (one-shot, matches the stakes — this moment either
  works or doesn't and the story should carry that): `roll_check('mask', 7,
  'ophelia-stream-sell-it', 'red')`. TN 7 calibrated against the other Red
  checks already authored (`checkpoint-mei-hong-leverage` and
  `checkpoint-lakshmi-colleague` both use TN 7; District 3/5's White checks
  sit at TN 6). Mask is the right Insight — it's already the lens the game
  uses for reading/running performance (see the `mask >= 3` branches
  throughout `turtleLakePlaza.ink` and `ophelia_intro`'s "rationing panic
  with professional discipline" line).
  - **Success:** he sells the bit. The stream visibly spikes, she's
    genuinely delighted rather than performing delight, bigger affinity
    gain (`adjust_affinity("ophelia", 2)`).
  - **Failure:** he's stiff, over-formal, visibly a cop trying to be
    charming — and it works anyway, in the "unpolished proof this is a
    real person" way unscripted moments sometimes do for this kind of
    audience. Smaller affinity gain (`adjust_affinity("ophelia", 1)`), not
    a punishing outcome. No separate doubles-tier branch — `roll_check`
    only ever returns a pass/fail boolean to ink (the ink↔TS boundary,
    Architecture §6), so a natural-12/natural-2 distinction isn't available
    to branch on here, same as every other check in the codebase.
- Whatever the check result, the scene ends with the stream still running
  and the detective clearly visible in it — that's the mechanism that
  reaches the stalker, not the check outcome. The check governs tone and
  affinity, not whether Scene 3 fires.

## Scene 3 — Pattern confirmed

This is where `complete_case_objective("ophelia-stalker", "pattern")`
actually fires, replacing the current unauthored/pending state described in
`docs/GAME_GUIDE.md` §9.

- **With Scene 2 (agreed path):** fires on the *next* visit to Ophelia's
  Apartment after the stream scene (not the same visit — `ophelia_apartment_topics`
  gates on `has_case_flag("ophelia-stream-scene-done")` being true and the
  objective not yet complete, so it naturally waits for the player to leave
  and come back, same as any other knot re-entry). The stalker has seen the
  stream. He doesn't just escalate in volume — he escalates in *target*. He
  wanted to know who else was around her now (jealousy read as ownership,
  matching the character spec's stalker-logic section: "money spent equals
  emotional entitlement," now extended to "a rival for her attention"). This
  is escalation ladder step 4 from `OPHELIA_CHARACTER_SPEC.md` ("he targets
  people around her") arriving early and personally.
- **Without Scene 2 (refused path):** fires at Turtle Lake instead (she
  never relocates on this path), same objective completion, same new case
  note, but the detective learns about the escalation from Ophelia
  describing it after the fact rather than living through the audience
  reaction himself — a flatter, secondhand version of the same beat.
  Consistent with "no ending should feel clean": declining to help doesn't
  spare her the escalation, it just changes how the detective finds out
  about it, which is arguably worse for him (he wasn't there to see it
  happen).

Both branches unlock the same new case note (next free id after `note-05`,
so `note-06`) filed under `ophelia-stalker`, worded to hold up under either
version of events — the concrete "this is coordinated and real" artifact
the Cases overlay currently has nothing to show for this objective.

Both branches converge back into a normal repeat-topics loop afterward —
`ophelia_apartment_topics` for the agreed path, `ophelia_topics` (at Turtle
Lake, since she never relocated) for the refused path — now carrying
whichever flags/affinity state resulted, feeding into
`OPHELIA_CHARACTER_SPEC.md`'s Choice stage (unspecced beyond its existing
"Story use" sketch — out of scope here).

## Mechanical summary

| What | Mechanism |
|---|---|
| Gate: don't fire before meeting her | `is_objective_complete("ophelia-stalker","recognition")` |
| Gate: don't fire on first return visit | `affinity_ophelia >= 2` |
| Suppress re-firing The Ask | `set_case_flag("ophelia-stream-asked")` |
| Agreed / refused branch | `set_case_flag("ophelia-stream-agreed")` / `set_case_flag("ophelia-stream-refused")` |
| **Unlock the new `opheliaApartment` location** | New `LocationDefinition.unlocksOnFlag` field on `turtleLakePlaza`: `[{ flag: 'ophelia-stream-agreed', locationId: 'opheliaApartment' }]`, checked in `DialogueScreen.finalizeEndedScene` (`useCaseStore.getState().hasFlag(...)`) the same moment/place `unlocksOnComplete` already fires — additive, doesn't touch the unconditional case |
| Turtle Lake stops offering her topic loop | Top-of-knot guard in `ophelia_topics`: `has_case_flag("ophelia-stream-agreed")` diverts to a short relocation line instead |
| Scene 2 gate (don't replay the stream scene) | `has_case_flag("ophelia-stream-scene-done")` |
| Scene 2 pivotal moment | `roll_check('mask', 7, 'ophelia-stream-sell-it', 'red')` — no doubles-tier branching in ink, since `roll_check` only ever returns pass/fail (Architecture's ink↔TS boundary) |
| Scene 3 payoff (agreed path, at the Apartment) | Top-of-knot guard in `ophelia_apartment_topics`: `has_case_flag("ophelia-stream-scene-done") and not is_objective_complete(...)` → `complete_case_objective("ophelia-stalker","pattern")` + `unlock_note('note-06')` |
| Scene 3 payoff (refused path, at Turtle Lake) | Same shape, guarded on `has_case_flag("ophelia-stream-refused")` instead |
| Affinity deltas | +1 (agree) / +1 or +2 (Scene 2 result) / 0 (refuse, clean) |

No changes needed to `content/cases.ts`'s `CASE_IDS`/objectives array —
`pattern` already exists as an authored, unresolved objective; this arc is
what resolves it. New content-registry additions: one `CaseNoteDefinition`
(`note-06`), one new `LocationId`/`LocationDefinition` (`opheliaApartment`),
one new District 3 street POI, one new `GridHubDefinition`, and the
`unlocksOnFlag` field itself (small, additive extension of the existing
`unlocksOnComplete` pattern on `LocationDefinition`).

## Asset needs

- A `performing` portrait variant for Ophelia (already flagged as a
  candidate in `OPHELIA_CHARACTER_SPEC.md`'s "Asset needs") — Scene 2 is
  the natural place to actually use it, distinct from the `guarded`
  variant her Turtle Lake content already tags. Tagged in content ahead of
  the asset existing, same precedent `diemKhuong.ink`'s `# portrait:
  guarded` already sets (`npcs.ts` doesn't need a matching `portraits` entry
  for a tag to be valid — it just degrades to no swap).
- An `opheliaApartment` background — omitted for now (`backgroundId: null`
  on the new hub, same placeholder state several other Location Hubs are
  already in), not worth commissioning until the arc is playtested.

## Writing guardrails

- **"Coerces him" means social pressure, not literal force.** Guilt,
  sadness, invoking the fact that they know each other a little now — the
  player can always say no, cleanly, with no affinity penalty and no
  content dead-end. Nothing here should read as him losing agency.
- Keep the on-stream content at the same level of remove her existing
  dialogue already uses (`ophelia_topics`'s "Sells online?" answer) — mood
  and persona, not depicted acts. The "spice" is his presence and the
  noir-bit framing, not anything explicit.
- The guilt-trip tactic should be legible as a tactic — this is the same
  "brattiness is armor" character established in
  `OPHELIA_CHARACTER_SPEC.md`, escalated by genuine fear and genuine
  financial pressure, not a rewrite of her into someone manipulative in a
  way that curdles her likability.
- Don't let a failed Red check read as punishing — per the check-resolution
  engine's own philosophy (pass/fail booleans that ink branches on, never
  a hard blocker), failure should change tone and affinity size, not lock
  content or feel like the "wrong" choice.
- Refusing should not read as the emotionally correct or narratively
  rewarded option by default — both paths reach Pattern, both are
  legitimate, and the spec deliberately withholds an affinity penalty from
  refusal so the choice stays about the player's read of the situation,
  not a min-maxed affinity call.

## Open questions (resolved during implementation)

- ~~Exact Target Number~~ — set to 7, matching the existing Red-check
  calibration (`checkpoint-mei-hong-leverage`, `checkpoint-lakshmi-colleague`).
- ~~Whether Scene 2 needs its own topics loop~~ — stayed linear: one choice,
  one check, done. Matches the size of her other individual scenes.
- ~~Refused-path Scene 3 timing~~ — resolved via the same knot-re-entry
  pacing as the agreed path: `ophelia_topics`'s top-of-knot guard only fires
  the secondhand escalation beat once the player leaves and comes back, not
  inline with the refusal itself.
- ~~Note-06 wording~~ — finalized, worded to hold up under both the
  agreed (he saw the stream) and refused (he heard about "someone new"
  secondhand) versions of events.

## Recommendation

Build Scenes 1–3 as described: forced-beat ask at Turtle Lake, on-camera
scene at the new Ophelia's Apartment location gated behind agreement,
stalker escalation completing `pattern` either way. This is the smallest
addition that (a) gives the player a real reason to end up in the stalker's
crosshairs personally, (b) resolves the currently-unauthored `pattern`
objective with real content, and (c) stays fully additive to
`content/cases.ts` and `content/locations.ts` — no objective restructuring,
one new case note, one new (flag-gated) location.
