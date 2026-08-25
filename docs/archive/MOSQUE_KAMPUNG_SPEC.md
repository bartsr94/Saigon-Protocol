# Musholla Al-Falah — Kampung Mosque Spec

*Working content spec for a new District 4 location: a small prayer house
serving the Kampung, the newer, Nusantara-linked Muslim community, as
distinct from `workerCanteen` (Quán Bà Châu), which belongs to the older,
settled Xóm Chàm. Grounded in `District 4.md`, `Nusantara Diaspora
Resettlement and Workforce Solutions.md`, and `Population and
Demographics.md` (`The Vault/Campaigns/04. Saigon Protocol/`, not yet
copied into `docs/lore/`). Production-planning document, not final canon;
direction only, not final prose.*

## Goal

Give District 4 its second, deliberately distinct Muslim-community
location. Where Quán Bà Châu is warm, settled, and generationally proud,
this location should read as newer, more precarious, and quietly
surveilled — the Kampung's own space, not a rehash of the canteen's beats
in a different room.

## Relationship to other docs

- **Source lore:** `District 4.md`, `Nusantara Diaspora Resettlement and
  Workforce Solutions.md`, `Population and Demographics.md` (all in `The
  Vault/Campaigns/04. Saigon Protocol/`, not yet copied into `docs/lore/`)
- **Companion location, explicitly not duplicated:**
  `docs/WORKER_CANTEEN_XOM_CHAM_SPEC.md` / `workerCanteen.ink` — same
  district, same "two Muslim communities" throughline from `District 4.md`,
  but the other community, and a different hook (surveillance, not
  Đáy/registry-conflation). Where the two locations could plausibly overlap
  (registry paperwork, generational-mod flavor), this spec deliberately
  picks a different angle rather than reusing the canteen's.
- **Downstream, explicitly out of scope:** `CASE_1_IMPLEMENTATION_SPEC.md` /
  `CASE_1_LOCATION_MATRIX.md` — this is an optional city-life location, not
  Case 1 authoring. It can seed a thread (Nusantara surveillance of its own
  workforce) for later payoff, not resolve one.

## One-line recap of the source lore

The Kampung is District 4's newer, most-exploited Muslim community —
Malay/Indonesian, Nusantara-linked, orthodox Sunni, tied directly to
Nusantara Diaspora Resettlement & Workforce Solutions' labor housing and
garrison presence near the port, still culturally tied to an archipelago
home most of them have never seen, and still more likely than not to still
be inside Nusantara's registry rather than free of it.

## Scope decisions (locked)

- **Community:** the Kampung specifically, not Xóm Chàm and not a shared
  space — same "one sub-group, not a flattened composite" logic the
  canteen spec used, for the same reason (cramming both communities into
  one small scene flattens both).
- **Hook:** Nusantara surveillance of its own diaspora, not another Đáy
  beat. Nusantara is simultaneously the Kampung's community backbone
  (resettlement, welfare, the one org that still gets them) and the private
  military contractor whose officers and internal culture would find a
  weekly gathering point genuinely useful to keep tabs on — who's still
  showing up, who's stopped, who's talking to whom. The location should
  hold both truths without resolving them: this is real communal space
  *and* a place quiet observation happens.
- **Structure:** single-node, matching `workerCanteen.ink`'s shape and this
  project's small-location precedent (`layout: 'cardList'`, one `inspect`
  action). No branching in this pass.
- **Named NPC:** yes — see below.

## Named NPC

- **Working name:** *Pak Rahman* — "Pak" (Malay/Indonesian honorific for an
  older man) plus a common Malay/Indonesian name. Placeholder, trivial to
  swap.
- **Role:** lay caretaker and prayer leader, not a credentialed cleric — the
  Kampung is too new and too poor to have imported one, so a respected
  elder fills the role informally. Ex-Nusantara rank-and-file himself
  (labor security, not officer track — officers are seconded Kaien/Baekho
  per the Nusantara doc, never Kampung), aged out or injured off active
  duty, now runs the space instead. This background is what lets him carry
  the Muscle Memory beat below (he still reads a room like a security
  detail) without turning him into an ex-soldier cliché — he's exactly the
  kind of person Nusantara's structure produces and then has no further use
  for.
- **New `NpcId`:** `pakRahman` in `src/content/npcs.ts`, no portrait
  required (matches `soraBaek`/`respondingOfficer`/`baChau`).
- Spoken via `speaker: npc:pakRahman` line tags, same convention as
  `baChau`/`meiHong`.

## Insight mapping

| Insight | Role in this pass |
|---|---|
| **Ledger** | Primary carrier for the surveillance hook — reads the room's headcount logic: who's here, who's missing, who'd notice either. Cold, transactional, matches the Insight's tagline directly. |
| **Root** | Archipelago grief and cultural memory — distinct from the canteen's Mekong Delta framing (a drowned Delta vs. a drowned archipelago most of this congregation has never personally seen, only inherited). Companion beat, not a duplicate. |
| **Muscle Memory** | New for this location — Pak Rahman (and maybe one other regular) reads as having carried a rifle for a living; a tell only this Insight catches, tying directly to Nusantara's armed-labor structure. |
| **Mask** | New for this location — the code-switching this room does for a stranger at the door: which face is worn for an outsider vs. for each other, directly on-theme for the social-chameleon Insight. |

`ledger` is already a declared/wired `VAR` (used in `workerCanteen.ink`
already, and live-synced via `INSIGHT_ID_TO_INK_VAR` in `storyEngine.ts`
for all seven Insights regardless of which `.ink` files use them). `root`,
`muscleMemory`, and `mask` just need `VAR` declarations in this new file,
same as `root`/`ledger` did for `workerCanteen.ink`. No new Insight.

## Content directions, per surface

### `content/ink/district4/mosque.ink` (new file)

- **Open on arrival, not on a service in progress** — a small, plain room,
  no minaret, no dome, converted from whatever platform-level space was
  available; poorer and newer than it will ever pretend not to be.
- **Pak Rahman present from the start**, same principle as Bà Châu — he's
  the one who'd greet a stranger at the door, politely and carefully.
- **Ledger beat**: the headcount read — who's here today, who's been
  absent three weeks running, and the unspoken fact that someone, somewhere
  in Nusantara's chain, tracks the same thing for less benign reasons.
- **Root beat**: cultural memory of the archipelago — inherited grief, not
  personal memory, for most of the room born in the SEZ. A prayer, an
  object, or a phrase carried three generations from islands most of the
  congregation has only heard described.
- **Muscle Memory beat**: Pak Rahman's own tell — how he stands near the
  door, how he clocks an entrance before he greets it — read as old
  security-detail habit, not menace.
- **Mask beat**: the visible code-switch for an outsider — warmer,
  vaguer, more guarded than the room would be with the door closed.
- **Hook, stated but not resolved**: something in-scene (a comment from Pak
  Rahman, a detail in the room) that makes clear this congregation knows
  it's a known quantity to Nusantara's command structure, and has made its
  peace with that the way people do with a risk they can't remove — worn
  in, not alarming, a thread Case 1 could pick up later.
- **Stays single-node**, one closing choice into `-> END`, same shape as
  `workerCanteen.ink`.

### `src/content/locations.ts`

- New `LocationId`: `'mosque'`, added to the union and `LOCATION_IDS`.
- New `LocationDefinition`: `districtId: 'district4'`, `name: 'Musholla
  Al-Falah'`, `unlockedByDefault: true` (matches `workerCanteen`'s
  always-open, optional-city-life treatment), blurb naming the Kampung
  explicitly and gesturing at the surveillance hook without spelling it
  out.
- `ambienceIds`: deliberately omit for now — a quiet interior is itself
  a contrast worth having against the canteen's `marketChatter`, and no
  real prayer-space ambience asset exists yet. Revisit if that changes.

### `src/content/locationHubs.ts`

- New `mosque` hub entry, `layout: 'cardList'`, `backgroundId: null`
  (matches `workerCanteen`/`transitPlatform`/etc.), one `inspect` action
  (`id: 'mosque-scene'`) with `storyLocationId: 'mosque'`, blurb and action
  description consistent in voice with the `locations.ts` blurb.
- Add `'mosque'` to whatever hub-ordering array lists `'workerCanteen'`
  (`content/locationHubs.ts` line ~136 per the current file).

### `src/content/districtStreets.ts`

- The player has already placed the POI via the live Map Editor: id
  `'poi-2'` at `{ x: 8, y: 0 }` in the `district4` street, currently a stub
  (`locationId: ''`, `label: ''`, `description: ''`). Fill it in rather
  than adding a new POI:
  - Rename `id` to `'district4-mosque'`, matching sibling POI id
    convention (`district4-worker-canteen`, `district4-transit-platform`).
  - `locationId: 'mosque'`
  - `label: 'Musholla Al-Falah'`
  - `description`: terse street-level glimpse, same length/register as
    sibling POIs (e.g. naming it as the Kampung's prayer house, a few words
    only — this is the AR-scan panel's per-square blurb, not scene prose).
- No layout/door changes needed — the map edit already carved the
  connecting corridor (column 8, rows 0–2) down to the main road.

## File impact summary

| File | Change |
|---|---|
| `content/ink/district4/mosque.ink` (new, + compiled `mosque.json`) | New single-node scene: Pak Rahman, Ledger/Root/Muscle Memory/Mask beats, surveillance hook |
| `src/content/npcs.ts` | Add `pakRahman` to `NpcId` and `NPCS` |
| `src/content/locations.ts` | Add `'mosque'` to `LocationId`/`LOCATION_IDS`; new `LocationDefinition` |
| `src/content/locationHubs.ts` | New `mosque` hub entry; add to hub-ordering array |
| `src/content/districtStreets.ts` | Fill in the existing `poi-2` stub (rename id, set `locationId`/`label`/`description`) |

One schema addition (`pakRahman` in `content/npcs.ts`); one new content
file; everything else is existing-field content, same shape as the canteen
pass.

## Recommended sequencing

1. Add `pakRahman` to `src/content/npcs.ts`.
2. Write `content/ink/district4/mosque.ink`: Pak Rahman, the four Insight beats,
   the surveillance hook, single node ending at `-> END`.
3. Compile via `npm run compile:ink`.
4. Add the `mosque` `LocationId`/`LocationDefinition` to `locations.ts`.
5. Add the `mosque` hub entry to `locationHubs.ts`.
6. Fill in the `poi-2` stub in `districtStreets.ts`.
7. Run the verification gate (`npm run lint`, `npx tsc -b`, `npm test`).
