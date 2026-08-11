# Worker Canteen — Xóm Chàm Spec

*Working content spec for turning `workerCanteen` (District 4, currently a
flavor-light placeholder — Architecture doc, "Open / not yet built") into a
specific place: the Xóm Chàm community's canteen. Grounded in
`District 4.md` and its linked pages in `The Vault/Campaigns/04. Saigon
Protocol/` (not yet copied into `docs/lore/`). Production-planning document,
not final canon; direction only, not final prose.*

## Goal

Replace the canteen's current undifferentiated "shift-change crowd" with a
specific, lived-in identity: this is Xóm Chàm's place — the older, settled
Cham Bani/Cham Islam dockworking community layered into District 4, per the
vault's District 4 doc. This doesn't discard the two Tier 1 passes already
applied here (`ATMOSPHERE_TIER1_SPEC.md`'s Food beat, the ration-bar/algae
grumbling; `GENETIC_MODIFICATION_TIER1_SPEC.md`'s Graft beat, the `graft >=
3` block) — it re-grounds both in a specific community instead of an
anonymous crowd, and adds to them.

## Relationship to other docs

- **Source lore:** `District 4.md`, `Population and Demographics.md`,
  `Nusantara Diaspora Resettlement and Workforce Solutions.md`, `Saigon
  SEZ — City Geography.md` (all in `The Vault/Campaigns/04. Saigon
  Protocol/`, not yet copied into `docs/lore/`)
- **Prior passes this builds on, not replaces:** `ATMOSPHERE_TIER1_SPEC.md`
  (Food) and `GENETIC_MODIFICATION_TIER1_SPEC.md` (Graft) — both already
  implemented in `workerCanteen.ink`. This spec deepens and re-attributes
  their existing content rather than duplicating it.
- **Downstream, explicitly out of scope:** `CASE_1_IMPLEMENTATION_SPEC.md` /
  `CASE_1_LOCATION_MATRIX.md` — this stays the optional city-life canteen,
  not Case 1 authoring. Where this spec opens a hook (Đáy, the
  registry-conflation resentment), it should seed a thread Case 1 can pay
  off later, not resolve one.

## One-line recap of the source lore

District 4 is a fortified port islet rebuilt vertically over its own
drowned street grid; its Vietnamese dockworking majority shares a finite
pool of stevedore contracts and platform housing with two distinct Muslim
communities — the older, settled Xóm Chàm (Cham Bani + Cham Islam) and the
newer, most-exploited Kampung (Nusantara-linked) — and beneath the whole
platform sits Đáy, an unregistered, flooded undercity where people who fall
off the books end up.

## Scope decision: one sub-group, not three

Per discussion: the canteen becomes specifically **Xóm Chàm's** canteen,
not a mixed three-community room — cramming Kinh old guard, Xóm Chàm, and
the Kampung into one small scene would flatten all three. Xóm Chàm reads as
generationally settled and a little proud, the opposite of the Kampung's
precarity, and that contrast is worth having somewhere even though the
Kampung itself isn't being built here. The Kinh old guard and the Kampung
stay unbuilt; a different location (or a future pass, if the design
changes) is where their distinct textures belong, not this file.

## Decisions (locked)

- **Cham Bani vs. Cham Islam:** light touch — one line acknowledging the two
  strands share the room without being the same practice. Not a subplot.
- **Đáy hook:** the specific version — `District 4.md`'s own framing
  ("religious or cultural practice that would rather not have SEZAC's
  attention") rather than a vague unexplained absence.
- **Structure:** stays single-node. Pure text/interjection pass within the
  current one-node shape; no branching in this pass.
- **Named NPC:** yes — see "Named NPC" section below. This is the one item
  that expands scope beyond a pure Tier-1-style text pass.

## Named NPC

Adds one recurring character instead of leaving the canteen's voice
anonymous: the counter's owner-cook, a former stevedore herself. She's the
natural carrier for three of this pass's beats at once — she's generational
(ties `graft >= 3`'s hydraulic-joint line to an actual face instead of an
unnamed regular), she's the plausible mouthpiece for the light-touch Cham
Bani/Islam line (an elder still keeping Bani practice while younger
regulars follow the more orthodox strand), and she's the one who'd
plausibly know about — without necessarily participating in — whatever
happens in Đáy that SEZAC shouldn't see.

- **Working name:** *Bà Châu* — the honorific (elder woman) plus an
  attested Cham-Vietnamese surname. Placeholder; trivial to swap if a
  different name reads better once the prose is actually written.
- **Role:** owner-cook, ex-stevedore. Old enough to have worked the wharf
  before whatever job took the arm/leg/joint that's now hydraulic; runs the
  counter now instead.
- **New `NpcId`:** `baChau` (or similar) in `src/content/npcs.ts`, following
  the existing `meiHong`/`soraBaek` shape. No portrait art has to exist for
  it to work — `portraitSrc` is optional on `NpcDefinition`, and
  `content/npcs.ts` already documents `soraBaek`/`respondingOfficer` as
  portrait-less entries — so this doesn't block on art sourcing.
- Spoken via `speaker: npc:baChau` line tags in the ink, same convention as
  `meiHong` in `intro.ink`.

## Insight mapping

| Insight | Existing in `workerCanteen.ink`? | Role in this pass |
|---|---|---|
| **Graft** | Yes (`graft >= 3`) | Deepen, don't replace — make it generational and stevedore-specific (hydraulic-joint/cargo-rig framing), matching the genetic-mod spec's original direction for this file. |
| **Hustle** | Yes (`hustle >= 3`) | Reframe the existing rumor beat: not grey-market imported rice, but off-the-books real fish, cash only, no questions — District 4's inherited Nam Cam-era "don't ask" culture (`District 4.md`, "Function in Play") is a sharper, more specific fit than the current generic rumor. |
| **Root** | No — new | Primary carrier for this pass. Root's tagline ("grief for what's underwater, empathy for the displaced") is a near-exact match for Xóm Chàm's Mekong Delta displacement. Model the beat on `noodleStall.ink`'s existing line ("something from a coast that isn't underwater yet"), per `ATMOSPHERE_TIER1_SPEC.md`'s own note that this is the tone to match. |
| **Ledger** | No — new | Registry-paperwork resentment: a SEZAC clerk ticking the same box for Xóm Chàm and the Kampung, which `District 4.md` calls out directly as a sore point ("resent being lumped in with newer arrivals just because a SEZAC clerk ticks the same box for both"). |

No new Insight. `graft`, `hustle`, `root`, `ledger` are all existing `VAR`
names already wired via `INSIGHT_ID_TO_INK_VAR` (`storyEngine.ts`) — `root`
and `ledger` just aren't declared in this file yet.

## Content directions, per surface

### `content/ink/workerCanteen.ink`

Current shape: anonymous "shift-change crowd" opener, one `graft >= 3`
block, one `hustle >= 3` block, single linear node ending at `-> END`.

Direction:

- **Open on Xóm Chàm identity directly**, not a generic crowd — halal by
  default (not a special accommodation on top of a Kinh menu), generational,
  dockworking. This replaces the opening two lines, not just adds to them.
- **Deepen the `graft >= 3` block**: generational and stevedore-specific —
  a regular's hydraulic-joint or cargo-rig mod read as "the wharf, and my
  father's before me" rather than the current generic "chosen because the
  job demands it" phrasing (which itself was `GENETIC_MODIFICATION_TIER1_SPEC.md`'s
  contribution — this pass narrows it further).
- **Reframe the `hustle >= 3` block**: drop the "algae batch"/imported-rice
  rumor, replace with real fish off an unlicensed catch, paid cash, no
  questions asked — ties directly to the district's inherited don't-ask
  culture instead of a generic Compact-import-lines rumor.
- **New `root >= 3` block**: a Mekong Delta food-memory beat — a spice,
  preparation, or ingredient that's the last piece of a coast that's
  underwater now, folded into the same Baekho ration bars everyone eats.
  Companion piece to `noodleStall.ink`'s existing Root line, not a
  duplicate of it.
- **New `ledger >= 3` (or a plain, ungated line — decide at write time)**:
  the registry-conflation resentment beat — paperwork that doesn't
  distinguish Xóm Chàm from the Kampung.
- **Bà Châu, present throughout**: introduce her early (she's the one
  running the counter) via `speaker: npc:baChau` lines, rather than
  bolting her on as a late addition — the graft/root/Bani-vs-Islam beats
  below should read as things she says or things noticed about her, not a
  separate character layer stacked on top of the existing anonymous-crowd
  text.
- **Light-touch generational beat**: one line gesturing at Cham Bani
  (syncretic, older — Bà Châu's own practice) vs. Cham Islam (more
  orthodox, newer strand — some of her regulars) without turning it into
  its own subplot.
- **Đáy hook**: use `District 4.md`'s own framing — "religious or cultural
  practice that would rather not have SEZAC's attention" — as something Bà
  Châu is aware of, plausibly without direct participation. Specific, not
  a vague missing-worker rumor.
- **Stays single-node**: all of the above lands as text/interjections
  within the current linear shape — no new choices or branches this pass.

### `src/content/locations.ts` → `workerCanteen.blurb`

Current: *"A late-shift canteen a few doors down from Aveline — ration bars
on every tray, more than a few hands at the counter patched together for a
job that demands it, thick with steam and shop talk."*

Direction: name it as Xóm Chàm's canteen explicitly; keep the
Aveline-proximity line (still true, still the same irony — a district's
oldest community eating twenty meters from a lab that could fix what the
wharf did to them and never will); fold in the halal/generational-fixture
framing established in the ink pass.

### `src/content/locationHubs.ts` → `workerCanteen` hub entry

Current blurb: *"Steam, tray clatter, and a shift-change crowd that talks
more freely than anyone inside the lab ever will."*
Current action description: *"Blend into the shift-change crowd and see
what the lab looks like from the workers who never make the official
statements."*

Direction: same Xóm Chàm-specific reframing, consistent tone with the
`locations.ts` blurb above — these three strings (location blurb, hub
blurb, action description) should read as one voice, not three attempts.

### `src/content/districtStreets.ts` → `district4-worker-canteen` POI

Current: *"Steam and shift-change chatter a few doors down from the lab."*

Direction: small clause naming it as Xóm Chàm's place, matching the
existing terse street-level-glimpse length other POIs on this street use —
this is the AR-scan panel's per-square blurb (Architecture §7), not a full
scene description.

## Ambience / audio

No new asset required. `workerCanteen` already carries `marketChatter`
(`src/content/locations.ts`). A Cham-specific ambience layer is a real
option long-term but is its own asset-sourcing project (recording/sourcing
+ `npm run audio:convert`, per `docs/GAME_GUIDE.md` §8) — out of scope for
this content-only pass unless explicitly pulled in.

## File impact summary

| File | Change |
|---|---|
| `content/ink/workerCanteen.ink` (+ recompiled `workerCanteen.json`) | Rewrite opener around Bà Châu and Xóm Chàm identity; deepen `graft >= 3`; reframe `hustle >= 3`; add `root >= 3`; add `ledger` beat; light-touch Cham Bani/Islam line; Đáy hook |
| `src/content/npcs.ts` | Add `baChau` to `NpcId` and `NPCS` (name only — `portraitSrc` omitted, matching `soraBaek`/`respondingOfficer`). |
| `src/content/locations.ts` | Rewrite `workerCanteen.blurb`. No schema change beyond the `npcs.ts` addition above. |
| `src/content/locationHubs.ts` | Rewrite `workerCanteen` hub `blurb` and its one action's `description`. No schema change. |
| `src/content/districtStreets.ts` | Rewrite `district4-worker-canteen` POI `description`. No schema change. |

One schema addition (`baChau` in `content/npcs.ts`); everything else is
existing-field content, same as prior Tier 1 passes.

## Recommended sequencing

1. Add `baChau` to `src/content/npcs.ts`.
2. Write the `workerCanteen.ink` content pass around her: opener, deepened
   `graft >= 3`, reframed `hustle >= 3`, new `root >= 3`, new `ledger`
   beat, the Bani/Islam line, the Đáy hook — reusing `graft`/`hustle` and
   adding `root`/`ledger` as declared `VAR`s.
3. Recompile via `npm run compile:ink`.
4. Apply the `locations.ts` / `locationHubs.ts` / `districtStreets.ts`
   blurb and description edits, matching the tone the ink pass establishes.
5. Run the verification gate (`npm run lint`, `npx tsc -b`, `npm test`).
