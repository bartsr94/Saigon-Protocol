# Cybernetics & Robotics Tier 1 Spec

*Working implementation spec for turning "Cybernetics — Saigon SEZ" and
"Robotics & Automation — Saigon SEZ" (vault docs) into a first content pass.
Production-planning document, not final canon.*

## Goal

Same shape and same bounded scope as `docs/ATMOSPHERE_TIER1_SPEC.md` and
`docs/GENETIC_MODIFICATION_TIER1_SPEC.md`'s passes: make the two new lore
docs' central distinction — genetic modification as chosen-or-not bodily
*survival*, cybernetics as *mandated infrastructure-substitution* nobody
really chooses, purpose-built robotics as a cold labor-economics choice —
legible across all 13 current locations, reusing Insight-gated content the
engine already supports. This pass **sharpens** the already-completed
Genetic Modification Tier 1 pass rather than replacing it: several existing
`graft`-gated lines already gesture at cybernetics without naming the
mechanism, and this spec's job is largely to make that split explicit.

**Explicitly out of scope:** synths (passing-as-human androids). They're
the most speculative, most case-shaped piece of the new lore — reserved for
a deliberate future case hook rather than spent as incidental texture here.

## Relationship to other docs

- **Source lore:** "Cybernetics — Saigon SEZ" and "Robotics & Automation —
  Saigon SEZ" (vault docs, not yet copied into this repo)
- **Builds directly on:** `docs/GENETIC_MODIFICATION_TIER1_SPEC.md`
  (already implemented — its `graft`-gated beats are live in
  `transitPlatform.ink`, `workerCanteen.ink`, `checkpoint.ink`,
  `sezacRecords.ink`, `cidOffice.ink`, `corporatePlaza.ink`,
  `noodleStall.ink`, and `deltaSquat.ink`). This pass edits several of those
  same lines rather than adding a parallel, disconnected layer.
- **Sibling passes:** `docs/ATMOSPHERE_TIER1_SPEC.md` — same mechanism,
  same "texture the placeholders, don't rebuild them" philosophy
- **Downstream, explicitly out of scope here:**
  `docs/CASE_1_IMPLEMENTATION_SPEC.md`, and any synth content (see Goal)

## One-line recap of the source docs

**Cybernetics:** almost nobody chooses it — mandated, employer-financed
hardware that substitutes for infrastructure a workplace would otherwise
need (dark-adapted eyes instead of mine lighting, heat-resistant skin
instead of factory HVAC), classified as "equipment provision" rather than
medicine, which is why it dodges the consent paperwork genetic therapy
doesn't. A small, inverted luxury tier exists at the top, elective and
read as fashion. **Robotics:** purpose-built automation saturates
security/surveillance and precision work but stays out of bulk labor,
because Nusantara's disposable, exploitable labor pool is cheaper than
capex — a corporate choice, not a technology ceiling.

## Insight mapping

**Primary carriers**, both already established, reused rather than
reinvented:

- **Graft** (physical) — cybernetics. Already the mod-kinship carrier from
  the Genetic Mod pass; this pass's job is mostly to make individual
  `graft`-gated lines explicitly name *which* mechanism (chosen genetic
  work vs. mandated cybernetic hardware) a given body is carrying, where
  the current text leaves it ambiguous.
- **Ledger** (mental) — robotics. Already established as the "who profits,
  what's the real cost" voice (`sezacRecords`, `corporatePlaza`,
  `pasteurStreetTaproom`'s family-wall beat); a natural fit for
  automate-or-don't cost logic.

**Secondary, reusing Insights already live in specific files:**

- **Hustle** — which systems can be gamed (a human, bribable) vs. which
  can't (an automated system, indifferent) — `checkpoint`, `noodleStall`.
- **Static, Muscle Memory** — light-touch robotics observation in the two
  files without `ledger` declared (`publicIncidentScene`, and `deltaSquat`
  for a very light optional touch).

No new Insight, and no new `VAR` in any file — every location below already
declares whichever Insight its new content needs.

## Already complete — cite, don't rewrite

Two locations already say exactly what the new lore needs, written before
either vault doc existed:

- **`turtleLakePlaza.ink`** — the cosmetic-graft teenagers scene already
  draws the luxury/fashion-vs-necessity line precisely: "nothing
  utilitarian about the work... the same graft on a District 4 dockworker
  would mean something entirely different." This *is* the Luxury Cyberware
  section, already shipped. No changes.
- **`deltaSquat.ink`** — the unmaintained servo leg ("a mod doesn't fail
  because the tech's bad — it fails because nobody this far out has the
  parts, or the money, to keep it running right") already is the
  maintenance-as-class-marker idea. At most a one-clause touch (see table);
  otherwise leave it alone.

## Option A — ink texture pass

| Location | Existing VARs | Cybernetics direction (Graft) | Robotics direction (Ledger/other) |
|---|---|---|---|
| `checkpoint` | hustle, static, graft, ledger | Existing Aveline-staffer line stays (elite/genetic signal). Add: a laborer passing through the same queue with an obviously mandated cybernetic mod (dark-adapted eyes or a dock-hardware hand), read as a class contrast to the Aveline staffer rather than a second version of the same thing. | New Ledger beat: the drone whose patrol log is already `drone-log` evidence doesn't take the bribe the guard just did (the existing red-check queue-jump) — a drone can't be talked past, which is exactly why it's still running the version of security that matters. |
| `workerCanteen` | graft, hustle, root, ledger, archetype | Light sharpen only: extend Bà Châu's "Wharf took the arm. I stayed for the wharf anyway" with one clause naming it as job-financed, still technically owned by whoever's contractor paid for it — not a chosen upgrade. | New Ledger beat: this canteen runs on zero automation — hand-ladled, no kiosk, no synth service — because a place this small and this marginal will never be worth anyone's capital expense. Robots run the bar; nobody bothers automating a stew pot. |
| `transitPlatform` | hustle, static, graft | Sharpen the existing two-commuter line: name the "still being paid off" prosthetic explicitly as mine- or dock-mandated hardware, and add the lock-in beat — it likely underperforms baseline vision/grip anywhere but the job it was issued for. | Light Hustle beat (optional): the vendor can be haggled; the platform's automated fare/scan gate a few meters off can't — same "gameable vs. not" contrast as `checkpoint`. |
| `cidOffice` | mask, static, graft | Light touch: the existing "field mod job nobody's asked about" line can stay deliberately ambiguous genetic-or-cyber — that ambiguity is itself fine texture for the one room where getting modified doesn't need explaining. No required change. | — (no `ledger` declared; skip) |
| `sezacRecords` | ledger, graft | Add the regulatory-gap punchline directly after the existing modification-consent-form line: no equivalent form exists for hardware installed under a labor contract's "equipment provision" rider — a detective's paperwork trail with nowhere to go, on purpose. | New Ledger beat: the clerk is human, deliberately — a slow human counter is a better liability buffer than an audited automated system would be, the same administrative-evil logic already established for this location. |
| `corporatePlaza` | mask, ledger, graft | Leave the existing gene-blend/old-money graft line untouched — it's genetics, already well-drawn, no cybernetic content needed here to avoid duplicating `turtleLakePlaza`. | New Ledger beat: no visible reception staff, just private security — domestic/service automation as an upper-platform status marker, the plaza's spotless silence read as a cost signal in itself. |
| `noodleStall` | root, hustle, graft | Leave the existing tolerance-graft (genetic) line untouched. Add a separate Hustle beat: grey-market cybernetic parts/repair changing hands here too — salvaged components, an unlicensed firmware unlock — distinct trade from the genetic black-clinic work already established. | — (covered by the Hustle beat above; no separate Ledger beat needed) |
| `deltaSquat` | static, root, graft | At most one clause on the existing servo-leg line noting the leg was originally job-mandated, not chosen — reinforcing why losing the parts/money to maintain it is losing a livelihood, not just a comfort. | Light Static beat (optional): a recon drone visible over the flood haze, doing reconnaissance a human salvager still has to follow up on directly — automation assists here, doesn't replace. |
| `mosque` | ledger, root, muscleMemory, mask | — (no `graft` declared; skip rather than add a VAR, per this pass's scope decision) | New Ledger beat: Pak Rahman's own manual headcount, already in the scene, gets a one-line contrast — a dozen mats isn't worth a surveillance drone's attention, so this room gets a cheaper, human informant instead. Automation saturates the checkpoint; it doesn't bother with a room this small. |
| `yDuocInstitute` | ledger, graft, root, static | Leave the existing tolerance-suppressant/rejection-management graft line untouched (genetic aftercare, already precise). | New Ledger beat next to the existing refrigeration-unit static line: automated diagnostic/dispensary systems handle the legitimate, auditable side of the building; the handwritten off-book slips are handwritten specifically *because* that's the one process automation can't quietly erase later. |
| `turtleLakePlaza` | root, graft, static, mask | **No changes — already complete** (see above). | — |
| `pasteurStreetTaproom` | ledger, root, mask | — (no `graft` declared; skip) | New Ledger beat on the existing family-wall POI: the family that left took its equity off-world; the family that stayed sells the one thing that can't be automated — ties the taproom's existing absentee-landlord content directly to the "authenticity as luxury" robotics idea already established for District 3. |
| `publicIncidentScene` | muscle_memory, static | — | Optional light Muscle-Memory beat: a forensics/security drone already working the scene, read as thorough and indifferent next to the uniforms still deciding what story they're telling — matches this file's existing light-touch precedent. |

11 of 13 locations get at least one new or sharpened line; `cidOffice` gets
an explicit pass-with-no-change; `turtleLakePlaza` is confirmed complete.

## Option B — blurb-level touches

Static text only, same mechanism as the existing blurb layer. No new
`AmbienceId`, `LocationId`, or `NpcId` needed.

| File / field | Current text | Direction |
|---|---|---|
| `src/content/locations.ts` → `sezacRecords.blurb` | "...ration schedules, water permits, modification consent forms, licensing renewals, filed and forgotten." | Add a clause naming the gap directly: "...and labor-contract equipment riders nobody reads twice." |
| `src/content/locations.ts` → `checkpoint.blurb` | "...mask seal checked, ration chit scanned, badge last, all under a recruitment screen..." | Add a clause noting the drone doing its rounds as routine background, establishing it before any dialogue starts. |
| `src/content/locations.ts` → `corporatePlaza.blurb` | "...a fruit bowl in the lobby that isn't synthesized." | Add a clause on the lobby's staffless quiet as its own kind of luxury signal. |

`workerCanteen.blurb` ("...still feeds half the district's hands and
hardware") and `pasteurStreetTaproom.blurb` ("hand-brewed and human-run")
already carry this pass's themes without needing a touch — leave both as
they are.

## File impact summary

- `content/ink/**/*.ink` (10 files, each recompiled to its sibling
  `.json`): `district4/checkpoint`, `district4/workerCanteen`,
  `district4/transitPlatform`, `district4/mosque`,
  `district4/publicIncidentScene` (optional), `district1/sezacRecords`,
  `district1/corporatePlaza`, `district5/noodleStall`,
  `district5/yDuocInstitute`, `district2/deltaSquat`
- `src/content/locations.ts` — 3 blurb edits
- No new content-module schema, no new `VAR` declarations, anywhere in
  this pass

## Recommended sequencing

1. Write the Graft-gated cybernetics sharpening first (`sezacRecords`,
   `transitPlatform`, `workerCanteen`, `deltaSquat`, `checkpoint`) — these
   edit lines that already exist, lowest risk of contradicting established
   tone.
2. Write the Ledger-gated robotics additions (`checkpoint`, `sezacRecords`,
   `corporatePlaza`, `workerCanteen`, `mosque`, `yDuocInstitute`,
   `pasteurStreetTaproom`) — all new lines, no existing text to reconcile.
3. Decide the two optional light touches (`deltaSquat`'s Static beat,
   `publicIncidentScene`'s Muscle-Memory beat) at write time.
4. Recompile via `npm run compile:ink`.
5. Apply the Option B blurb edits.
6. Run the verification gate (`npm run lint`, `npx tsc -b`, `npm test`).
7. `/wrap-up` once approved.

## Open questions

- `cidOffice`'s existing graft line is left deliberately ambiguous
  (genetic-or-cybernetic) in this spec — confirm that's the right call
  versus resolving it explicitly one way, given every other location in
  this pass now draws the line clearly.
- Should the architecture doc's "Open / not yet built" list get an
  explicit note that synths are deliberately excluded from this pass, so a
  future case doesn't have to rediscover that this was a decision and not
  an oversight?
- `mosque` and `pasteurStreetTaproom` don't declare `graft` — this spec's
  recommendation is to leave them Ledger/robotics-only rather than add the
  VAR, but flagging in case a future pass wants cybernetics texture there
  too (e.g., a Kampung laborer's mandated mod at the mosque).
