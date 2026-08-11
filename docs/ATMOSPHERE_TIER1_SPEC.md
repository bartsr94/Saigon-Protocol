# Atmosphere Tier 1 Content Spec

*Working spec for a content-only atmosphere pass that surfaces the setting's
environmental decline (climate, fresh water, air quality, food/agriculture)
through systems the engine already has — ink content tags and the Insight
system. This is a production-planning document, not final canon; it does not
contain final prose, only direction for where and how that prose should
land.*

## Goal

Saigon Protocol should read as a world on the decline, not just be described
as one. The game already has the plumbing for this — ink line tags
(`speaker`/`background`/`music`/`ambience`/`voice`), Insight-gated
interjections, per-location `blurb`s, and the Location Hub / District Street
layers' per-square text (Architecture §7) — but current location content is
explicitly flavor-light placeholder (Architecture doc, "Open / not yet
built"). This spec turns four already-written environmental concept notes
(**Climate**, **Fresh Water**, **Air Quality**, **Food & Agriculture** — 2226
Saigon SEZ extrapolations, currently held outside the repo pending a vault
move, not yet checked in under `docs/lore/`) into concrete, per-file content
requirements, using only tools that exist today. No engine or mechanic
changes are in scope.

This is Tier 1 of a three-tier plan discussed in the same conversation that
produced this spec:

- **Tier 1 (this spec):** content only — blurbs, ink interjections, ambience
  assets, grid/POI blurb text. No code changes beyond new content-module
  entries (new `AmbienceId`s) in the existing content-registry pattern.
- **Tier 2 (not this spec):** a small mechanical hook — environmental
  Vitality drain, using the already-wired `damage_vitality` ink→TS boundary
  call, triggered from Tier 1's new content.
- **Tier 3 (not this spec):** real new systems — ration/registry status as a
  mechanical gate, casefile evidence content built around these hazards.
  Blocked on casefile ink integration, which the architecture doc already
  lists as unbuilt.

## Relationship to `CASE_1_IMPLEMENTATION_SPEC.md`

That spec plans to eventually replace the current placeholder location chain
(`checkpoint`, `noodleStall`, `deltaSquat`, plus the four dev-fixture
locations added since) with real District 1/2/4/5 Case 1 content. This spec
is not in conflict with that plan — it targets the *current* 9 placeholder
locations for an atmosphere pass that's worth doing regardless of when Case
1's rewrite lands, and it should be treated as the texture template Case 1's
eventual real locations inherit, not a parallel one-off. If Case 1's location
rewrite lands before this spec is actioned, retarget the per-location
requirements below at the new location set instead of building placeholder
content that's about to be replaced.

## The four source docs, in one line each

- **Climate** — heat as an acute, sometimes-lethal threshold (wet-bulb
  survivability), worse seasonal extremes, a permanently hazy sky.
- **Fresh Water** — access controlled by multiple separately-owned valves
  (Mekong inflow gated by the geopolitical rival to the north, Compact-owned
  desalination, exhausted groundwater); water debt as a coercion tool.
- **Air Quality** — a chronic, cumulative hazard rather than an acute one;
  daily filter-mask wear is a class gradient from mandatory at street level
  to invisible at the top; gene-modified people can go maskless as a visible
  status/body-horror marker.
- **Food & Agriculture** — most residents require institutional rationing to
  meet daily calories, sourced from semi-floating greenhouse platforms
  (Baekho-operated, Nusantara-guarded/staffed) plus imports (Kaien Sōgō) and
  Cholon's informal market; ration/registry status is a coercion lever.

## Per-Insight environmental voice mapping

Two Insights are the primary carriers for this pass; the rest are secondary
or not used. Content authors should default to this table rather than
re-deriving which Insight fits a given hazard beat.

| Insight | Domain | Role in this pass |
|---|---|---|
| **Static** | mental | Primary. "Notices environmental danger early" — the default voice for heat, haze, water-quality, and scarcity dread as lived interiority. Use for any beat that's about noticing a hazard. |
| **Root** | mental | Primary. "Grief for what's underwater, empathy for the displaced" — the default voice for greenhouse/Nusantara labor, salvage and foraging, and cultural food loss. `noodleStall.ink`'s existing line ("something from a coast that isn't underwater yet") is the model to match. |
| **Hustle** | mental | Secondary. Scarcity-honed cunning — black-market water/filters/ration fraud beats, haggling over real vs. synth food. |
| **Ledger** | mental | Secondary. Cost-benefit read — who profits from a given scarcity (Baekho's greenhouses, Kaien's import lines, SEZAC's rationing bureaucracy). |
| **Graft** | physical | Secondary. Altered-body kinship — maskless/gene-modified people as a visible marker, per the Air Quality doc's gene-mod off-ramp. |
| Muscle Memory, Mask | — | Not used for this pass. |

## Per-location content requirements

For each current `LocationId` (`src/content/locations.ts`): which docs apply,
and the texture opportunity to write toward. Direction only — exact copy is
implementation, not spec.

| Location | District | Applicable docs | Texture direction |
|---|---|---|---|
| `checkpoint` | 4 | Air Quality, Food | First thing the player sees. A filter-mask/ration-scan checkpoint queue establishes both as background-normal, not exceptional, before any dialogue starts. Static interjection on entry. |
| `publicIncidentScene` | 4 | Climate (light touch) | Incident-scene focus stays primary; at most a Static aside about exposure if the scene reads as exterior/unsheltered. |
| `workerCanteen` | 4 | Food | Baekho ration bars on the counter, grumbling about this week's algae batch, a rumor of "real" imported rice elsewhere. Hustle/Root voice. |
| `transitPlatform` | 4 | Climate, Air Quality | Waiting exposed — heat and haze both apply to an outdoor platform. Static voice. |
| `cidOffice` | 1 | Air Quality, Climate (as *absence*) | Interior, climate-controlled home base — the interesting move here is the hazard going quiet, not present. Worth a line establishing that CID itself is shielded, a contrast point against street-level scenes. |
| `sezacRecords` | 1 | Fresh Water, Food | Bureaucracy-of-scarcity angle — permits, tariffs, rationing schedules that are real paperwork pointing nowhere near the actual decision-makers (consistent with SEZAC's established role). Ledger voice. |
| `corporatePlaza` | 1 | Food, Air Quality | Upper-tier luxury on display — imported "real" food, filtered air, as visible status markers. Ledger/class-contrast voice. |
| `noodleStall` | 5 (Cholon) | Food | Already has a Root line to match tone against. Add the Food doc's Bình Tây market thread directly — real, smuggled, or grey-market ingredients as the point of the place. |
| `deltaSquat` | 2 | Fresh Water, Food, Air Quality | The convergence point — sacrificed-district salvage/foraging, greenhouse-fringe proximity, contaminated water, all plausibly present in one location. Highest-density texture opportunity in the current roster. |

## Ambience additions

Current library (`src/content/ambience.ts`) has three assets:
`engineIdle`, `rain`, `marketChatter`. Proposed additions, each requiring a
short loop sourced or recorded and converted via `npm run audio:convert`
(source as `.wav`, ship as `.mp3` per `docs/GAME_GUIDE.md` §8 conventions):

| Proposed `AmbienceId` | Carries | Suggested locations |
|---|---|---|
| `greenhouseHum` | Food — hydroponic/algae-bay machinery drone | `deltaSquat` (fringe proximity), any future greenhouse-platform content |
| `filterStatic` | Air Quality — the low mechanical hiss of a worn filter mask | `checkpoint`, `transitPlatform`, other exterior street-level scenes |
| `rationQueue` | Food — a queue's low murmur, distinct from `marketChatter`'s market energy | `checkpoint`, `sezacRecords` |
| `hazeWind` | Climate/Air Quality — wind through a haze-day exterior | `transitPlatform`, `deltaSquat` |

Each new id needs: an entry in `AMBIENCE_IDS` and `AMBIENCE`
(`src/content/ambience.ts`), an asset at `public/audio/ambience/<id>.mp3`,
and application either as a location's baseline `ambienceIds` or via an
in-scene `# ambience: +<id>` line tag per `docs/GAME_GUIDE.md` §5.2's
existing tagging convention.

## Grid / District Street per-square blurb content

The Hub grid (`src/content/locationHubs.ts`, currently only `checkpoint` uses
`layout: 'grid'`) and District Street (`src/content/districtStreets.ts`,
currently `district4` and `district1`) both carry per-POI `description` text
shown in the AR-scan panel when a player stands on that square (Architecture
§7's per-square blurb behavior). This is a second surface for the same
texture, independent of ink dialogue:

- `checkpoint`'s grid POIs and floor squares are a natural home for
  Air Quality/Food checkpoint-queue detail, consistent with the location's
  `blurb` direction above.
- `district4`'s and `district1`'s street POIs should get at least one
  environmental beat each, matching whichever doc applies to that street's
  district identity (District 4: industrial/Climate; District 1:
  corporate-core/Air Quality-as-absence, mirroring `cidOffice`'s direction).

No schema change needed — this is content added to existing `description`
fields on `HubActionDefinition`/`HubCharacterPresence`-equivalent POI
entries.

## File impact summary

| File | Change |
|---|---|
| `src/content/locations.ts` | Rewrite `blurb` for all 9 `LocationId` entries per the table above. No schema change. |
| `content/ink/*.ink` (8 files: `checkpoint`, `noodleStall`, `deltaSquat`, `publicIncidentScene`, `workerCanteen`, `transitPlatform`, `cidOffice`, `sezacRecords`, `corporatePlaza`) | Add Static/Root (and secondary Hustle/Ledger/Graft where noted) interjection lines carrying the relevant doc's specifics, following `noodleStall.ink`'s existing Root-line pattern. |
| `src/content/ambience.ts` | Add 4 proposed `AmbienceId` entries (or fewer, if scoped down) and their `AMBIENCE` records. |
| `public/audio/ambience/*.mp3` | New assets for each added ambience id, sourced/recorded and run through `npm run audio:convert`. |
| `src/content/locationHubs.ts` | Add/extend POI `description` text for `checkpoint`'s grid to carry environmental beats. |
| `src/content/districtStreets.ts` | Add/extend POI `description` text for `district4`/`district1` street POIs. |

## Recommended sequencing

1. Lock this spec's per-location table (confirm or adjust the doc-to-location
   mapping above).
2. Write ink interjection lines location-by-location, starting with
   `checkpoint` (first player-facing scene) and `deltaSquat` (highest
   texture density).
3. Source/record the 4 proposed ambience assets in parallel — this can
   happen independently of the ink writing pass.
4. Extend `locationHubs.ts`/`districtStreets.ts` POI text last, once the ink
   pass has established the per-location tone to match.
5. Once Tier 1 content exists, revisit Tier 2 (Vitality drain hook) — the
   `damage_vitality` ink→TS call already exists; Tier 1's scenes are what
   would call it.

## Open questions

- Should the 4 proposed `AmbienceId`s all ship in one pass, or should this
  be scoped down to 1–2 for a first cut (e.g. `filterStatic` and
  `rationQueue`, the two with the broadest cross-location applicability)?
- Does `publicIncidentScene` warrant any environmental texture at all, or
  should it stay focused on the incident itself with zero additions?
- Should `cidOffice`'s "hazard goes quiet" treatment extend to any other
  interior/upper-tier location once one exists, or is it a one-off worth
  making distinctive precisely because it's rare in the current roster?
