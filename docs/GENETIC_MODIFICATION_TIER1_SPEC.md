# Genetic Modification Tier 1 Spec

*Working implementation spec for turning "Genetic Modification — Saigon SEZ" (lore vault) into a first content pass. Production-planning document, not final canon.*

## Goal

Same shape and same bounded scope as `docs/ATMOSPHERE_TIER1_SPEC.md`'s pass: make the genetic-modification doc's central axis — somatic modification as compulsory survival-floor vs. germline/gamete editing as a vanishingly rare elective ceiling — felt across the nine existing placeholder locations, without building actual Case 1 content (HN-12, the Aveline cast, casefile progression). This pass should seed hooks Case 1 can pay off later, not preempt or duplicate that work.

## Relationship to other docs

- **Source lore:** "Genetic Modification — Saigon SEZ" (vault doc, not yet copied into this repo)
- **Sibling pass:** `docs/ATMOSPHERE_TIER1_SPEC.md` (climate/air/water/food) — same mechanism, same file set, same "texture the placeholders, don't rebuild them" philosophy
- **Downstream, explicitly out of scope here:** `docs/CASE_1_IMPLEMENTATION_SPEC.md` — this pass is not that project. It should make the eventual Case 1 build easier (paperwork already established, Graft already carrying weight), not substitute for it.

## One-line recap of the source doc

Somatic modification is compulsory-by-necessity survival tech for nearly everyone; germline/gamete-level editing is a vanishingly rare, elective luxury for the very top, legible via two coded camps — old EU-aligned phenotype vs. Aveline-adjacent Hapa/Wasian "best of both worlds."

## Insight mapping

**Primary carrier: Graft.** Currently the most underused Insight in the game — one gated line total, in `workerCanteen.ink` — despite already being wired into Vitality's max-pool formula (`src/content/wellbeing.ts`). This pass is effectively Graft's real debut.

**Secondary, reusing Insights already live in specific files rather than introducing new ones:**
- **Ledger** (`sezacRecords`, `corporatePlaza`) — already gates paperwork/cost-comparison reads in these two files; a natural fit for licensing/permit and cost-of-modification material.
- **Mask** (`cidOffice`, `corporatePlaza`) — already gates social-calibration reads in these two files; a natural fit for reading which camp someone's mods are signaling.

No new Insight, and no new `VAR` outside what's already declared per file.

## Option A — Ink texture pass (Graft-gated dialogue)

| Location | Existing VARs | New Graft content direction |
|---|---|---|
| `checkpoint` | hustle, static | Queue includes visibly labor-tier somatic mods waiting on mask/ration checks; Graft clocks an Aveline staffer passing through without a mask-seal check at all — the doc's Layer 2 elite signal glimpsed against the building it guards |
| `workerCanteen` | graft, hustle | Deepen the existing `graft >= 3` block rather than add a new one — extend it to name the floor explicitly: ordinary, utilitarian, chosen-because-the-job-demands-it mods, in contrast to what's glimpsed elsewhere in this pass |
| `transitPlatform` | hustle, static | A visible mod-class gradient among commuters — expensive, barely-noticeable work next to an obvious older-generation prosthetic |
| `cidOffice` | mask, static | Colleagues' mods as unremarkable workplace background — the one room where getting modified doesn't read as a confession |
| `sezacRecords` | ledger | Gene-therapy licensing/consent paperwork stacked in the same queue as the existing water/ration forms — the closest tie-in to Case 1's administrative-evil theme, without needing any new characters |
| `corporatePlaza` | mask, ledger | The doc's flagship beat: a Hapa/Wasian Aveline-adjacent exec vs. an old-EU-phenotype family in the same lobby, read as two political camps rather than two looks |
| `noodleStall` | root, hustle | A glimpse of unlicensed/black-clinic somatic mod work — a patched injection site, a DIY joint, clearly non-Aveline-grade |
| `deltaSquat` | static, root | Salvagers with failing, unmaintained somatic mods — the floor under the floor: modification without access to its own upkeep |
| `publicIncidentScene` | muscle_memory, static | Light touch only, matching this file's existing single-branch/no-else convention — skip unless a natural beat presents itself during writing |

8 files get new content; `publicIncidentScene` is a judgment call at write-time.

## Option B — Blurb-level touches (no new ink, no new schema)

Static text only, same mechanism as the existing blurb layer. No new `AmbienceId`, `LocationId`, or `NpcId` needed.

| File / field | Current text | Direction |
|---|---|---|
| `src/content/locations.ts` → `sezacRecords.blurb` | "...ration schedules, water permits, licensing renewals, filed and forgotten." | Extend to explicitly include gene-therapy/modification licensing |
| `src/content/locations.ts` → `corporatePlaza.blurb` | "...a fruit bowl in the lobby that isn't synthesized." | Add a clause gesturing at the visible elite phenotype blend in the room |
| `src/content/locations.ts` → `workerCanteen.blurb` | current | Small clause reinforcing labor-tier mods as ordinary background, not spectacle |
| `src/content/locationHubs.ts` → `checkpoint` hub blurb | "...mask seals checked at the door same as the street outside." | Extend to note the modification-check dimension, not just mask/ration |
| `src/content/locationHubs.ts` → `sezacRecords` hub blurb | "Queue numbers, sun-bleached forms, and clerks who have perfected the art of telling you nothing politely." | Small clause naming licensing paperwork specifically |
| `src/content/districtStreets.ts` → `district1-sezac-records` POI description | "...water permits and ration renewals filed in the same stack as everything else." | Extend to include modification licensing |
| `src/content/districtStreets.ts` → `district4-aveline-lab` POI description | "The lab everyone on this street is pretending not to watch." | Leave as-is — already carries the weight; resist over-explaining it here |

## File impact summary

- `content/ink/**/*.ink` (8 files, each recompiled to its sibling `.json`): `district4/checkpoint`, `district4/workerCanteen`, `district4/transitPlatform`, `district1/cidOffice`, `district1/sezacRecords`, `district1/corporatePlaza`, `district5/noodleStall`, `district2/deltaSquat`
- `src/content/locations.ts` — 3 blurb edits
- `src/content/locationHubs.ts` — 2 blurb edits
- `src/content/districtStreets.ts` — 1 POI description edit
- No new content-module schema anywhere in this pass

## Recommended sequencing

1. Write the Graft-gated ink additions (Option A), reusing each file's already-declared `VAR`s
2. Recompile via `npm run compile:ink`
3. Apply the Option B blurb/description edits across the three content files
4. Run the verification gate (`npm run lint`, `npx tsc -b`, `npm test`)
5. `/wrap-up` once approved

## Open questions

- Should `publicIncidentScene` get a minimal Graft beat, or stay untouched given its established light-touch precedent from Tier 1 atmosphere?
- Is "Hapa/Wasian" specific enough to write directly into `corporatePlaza`'s prose, or should the ink text describe the feature-blend without naming it, leaving "Hapa/Wasian" as the vault doc's own descriptive shorthand?
- Should `sezacRecords`' new Graft-gated paperwork line name Aveline directly, or stay generic enough not to front-load Case 1 material before that story actually gets built?
