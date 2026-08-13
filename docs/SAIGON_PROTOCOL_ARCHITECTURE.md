# Saigon Protocol — Architecture

*As-built technical reference: how the codebase is actually structured, not
a build guide. Companion to `SEA_CYBERPUNK_GDD.md` (lore/setting — no
technical content there) and `GAME_GUIDE.md` (content-authoring, UI/visual
conventions, and system *behavior* from a designer's point of view — no
store/file wiring detail here that belongs there instead). If a system's
design changes, update the relevant section below and append to the running
log at the bottom — don't rewrite past log entries.*

---

## 1. Stack

| Layer | Choice |
|---|---|
| Language | TypeScript, strict mode |
| UI framework | React 19 |
| Build tool | Vite |
| State management | Zustand |
| Styling | Tailwind CSS 4 (CSS-first `@theme`, no config file) |
| Narrative authoring | **inkjs** — `.ink` source compiled to `.json`, run via the lean `Story` runtime in-browser |
| Testing | Vitest (`environment: 'node'` — no DOM, no `.test.tsx` files) |
| Linting | Oxlint |
| Deployment | Static site, client-side only. No backend. Saves live in `localStorage`. |

Combat and tactical exploration are out of scope — a distant,
Underrail: Expedition–style future consideration, not designed for here.

## 2. Entry point & load order

- `index.html` loads `src/main.tsx`, which mounts `src/App.tsx`.
- `App.tsx` is the root router. It reads `uiStore.screen` (`'title' |
  'chargen' | 'game'`) and, within `'game'`, whether `storyStore.story` is
  non-null to decide between `TitleScreen`, `CharacterCreationScreen`,
  `DialogueScreen` (a story is active), or `OverworldScreen` (no active
  story). `OverlayHost` renders unconditionally on top, reading
  `uiStore.activeOverlay`.
- `App.tsx` also owns two small cross-cutting effects: syncing
  `settingsStore`'s `reduceMotion`/`highContrast`/`largeText` onto
  `document.documentElement` (via `data-*` attributes and inline styles the
  rest of the app's CSS keys off), and calling `audioStore.playTitleMusic()`
  whenever `screen` is `'title'`/`'chargen'`.

## 3. The core rule: simulation never lives in a component

Dice math, stat calculations, and ink story state are computed in
stores/engine modules. Components read store state and dispatch actions —
they never compute a roll or mutate a stat directly. This is enforced by
convention, not tooling; hold the line when reviewing or writing code here.

**Pure/impure split.** Every stateful system pairs a pure `engine/*.ts`
module (no store imports, no browser APIs, fully unit-testable) with an
impure `stores/*.ts` Zustand layer that owns side effects and wires the
pure module's functions to other stores:

| Pure engine | Impure store |
|---|---|
| `engine/checkResolution.ts` | `stores/insightStore.ts` |
| `engine/storyEngine.ts` | `stores/storyStore.ts` |
| `engine/contentTags.ts` | (consumed by `storyStore.ts`) |
| `engine/saveEngine.ts` | `stores/saveStore.ts` |
| `engine/audioEngine.ts` | `stores/audioStore.ts` |
| `engine/casefileEngine.ts` | `stores/casefileStore.ts` |

**Zustand stores** (all module-scoped singletons, `create<State>(...)`,
cross-store reads via `getState()`):

- `insightStore` — the seven Insights, wellbeing tracks, archetype, player
  name, chargen free points, Red-check consumption. Single source of truth
  for anything a check or damage event reads.
- `storyStore` — wraps the active inkjs `Story` instance.
- `navigationStore` — unlocked/selected Overworld locations. No knowledge
  of `storyStore`/inkjs.
- `saveStore` — owns all `localStorage` I/O for save slots. No knowledge of
  `uiStore` (doesn't navigate on load/save; callers do that).
- `audioStore` — owns real `HTMLAudioElement`s for music/ambience/voice/SFX.
  Pure *consumer* of `storyStore`'s output; ink itself has no audio
  `EXTERNAL` of any kind.
- `settingsStore` — audio levels, voice toggle, text speed, accessibility
  toggles (Reduce Motion/High Contrast/Large Text). Session-only — not
  persisted to a save slot.
- `uiStore` — `screen` + `activeOverlay` only. Owns nothing but "what's on
  screen."

Each store keeps to one responsibility and, where two stores need to
interact, the handoff happens either via an explicit action call at the
**component layer** (e.g. `OverworldScreen.handleSelect` calling both
`navigationStore.selectLocation` and `storyStore.loadStory`) or via a
store **subscription** set up at load time (e.g. `storyStore.loadStory`
subscribing to `insightStore` for live Insight-variable sync into ink, or
`audioStore` subscribing to `settingsStore` for live volume resync). No
store imports another store's file at module scope to call its actions
directly outside of one of those two seams.

## 4. Insight System

`src/content/insights.ts` defines the seven Insights (Ledger, Graft, Muscle
Memory, Root, Static, Hustle, Mask) — the game's only character stat, no
separate attributes/skills/equipment sheet. Each has an id, display name,
tagline, identity color, and a **domain** (`physical` or `mental`) that
drives wellbeing derivation. `insightStore.levels` holds the current level
per Insight; that level *is* the check modifier, unmediated —
`checkResolution.ts`'s `resolveCheck(modifier, targetNumber)` reads it
directly. Range: `INSIGHT_MIN = 1`, `INSIGHT_MAX = 6`.

**Starting values are set once, at Character Creation, and don't change for
the rest of the run.** Each of the six archetypes (`content/archetypes.ts`)
names a strength/weakness Insight (or neither, for Boring Cop) and gets a
baseline spread from `baselineFor()` — default 2, strength 4, weakness 1.
The player spends a free-point pool (3 for the five story archetypes, 6 for
Boring Cop) via `spendFreePoint(id)`, up to `INSIGHT_MAX`;
`refundFreePoint(id)` reverses a spend but won't drop a level below that
archetype's own baseline. Confirming Character Creation locks these in —
there is no in-play leveling (XP, investigation rewards) in v1.

There is no temporary-modifier mechanism. `insightStore.levels` is the sole
number `resolveCheck` reads for a given Insight.

**Wellbeing pools derive from Insight levels** (`content/wellbeing.ts`),
recomputed on every level change (`clampToNewMax` in `insightStore.ts`):
Vitality max = `BASE_VITALITY (4)` + Graft + Muscle Memory; Composure max =
`BASE_COMPOSURE (4)` + (sum of the five mental Insights ÷ 3, rounded up).
The specific numbers (`BASELINE_*`, free-point pool sizes, `BASE_*`, the ÷3
divisor) are flagged `PLACEHOLDER` at their source as GDD §3 tuning-pass
items — the mechanism is settled, the values are expected to move.

## 5. Check Resolution Engine

`engine/checkResolution.ts`'s `resolveCheck(modifier, targetNumber, random?)`
is the only place dice math lives: `2d6 + modifier vs targetNumber`. Natural
12 always succeeds, natural 2 always fails, regardless of modifier/target
(doubles are decisive). `random` is injectable (`RandomSource = () =>
number`) so tests can fix the outcome; production calls default to
`Math.random`.

**White vs. Red checks** are bookkept in `insightStore`, not ink:
`consumedRedChecks: Set<string>` tracks which Red `checkId`s have already
fired. `checkId` strings must be globally unique across all loaded content
(no per-location namespace) — the convention is prefixing with the
scene/location name (`"checkpoint-jump-queue"`), enforced by convention,
not by any runtime check.

## 6. Story Engine & the ink ↔ TypeScript boundary

ink owns narrative branching and prose only; it never rolls its own dice or
mutates wellbeing directly. `engine/storyEngine.ts` is pure and
store-agnostic — it binds `EXTERNAL` functions and syncs variables onto a
given `Story` instance from injected handlers, same testable style as
`checkResolution.ts`. `stores/storyStore.ts` is the Zustand layer that
constructs the `Story`, supplies those handlers from `insightStore`, and
exposes derived UI state.

**`EXTERNAL` contract** (declared ink-side, bound TS-side in
`storyEngine.ts`):
- `is_red_check_consumed(checkId)` — lets ink gate whether a Red-check
  choice is even offered.
- `roll_check(insight, targetNumber, checkId, risk)` — resolves a check,
  returns only a pass/fail boolean to ink. The full `CheckResult` (dice,
  doubles tier) is captured TS-side via an `onCheckResult` callback for the
  UI — ink never sees more than the boolean.
- `damage_vitality` / `heal_vitality` / `damage_composure` /
  `heal_composure` — ink declares damage/healing; TS owns the actual
  mutation and any fail-state (zero-track) check. Ink never owns the death
  check.

**Insight variable sync.** Insight levels + archetype are pushed into ink
globals via an explicit snake_case map (`INSIGHT_ID_TO_INK_VAR` — e.g.
`muscleMemory` → `muscle_memory`) and kept live-synced through an
`insightStore` subscription for the run. The sync silently skips any
variable a given story didn't declare with `VAR` (writing an undeclared ink
global throws), so minimal/test stories don't need to declare the full set.

**Only import the lean `Story` runtime from `inkjs` in shipped code.**
`Compiler` (from `inkjs/full`) is an authoring-time-only tool
(`scripts/compile-ink.mjs`) for producing `.json` from `.ink` source — never
import it outside that script.

**`storyStore` state shape:**

```ts
interface StoryState {
  story: Story | null
  activeStoryId: string | null   // 'intro' or a LocationId — which compiled story is loaded
  currentLines: StoryLine[]      // one entry per ink line since the last choice, each individually tagged
  currentChoices: Choice[]
  canContinue: boolean
  ended: boolean
  lastCheckResult: CheckResult | null
}
```

`activeStoryId` exists so `saveStore` knows which compiled JSON a restored
`inkStateJson` belongs to — it's opaque to `storyStore` itself.
`currentLines` is rebuilt per `Continue()` batch by `advance()`, reading
`story.currentTags` right after each line's own `Continue()` call (a batch
can mix narrator/NPC/Insight lines that each need their own speaker tag).
Restoring a save calls `hydrateFromRestoredState()` instead — `story.state
.LoadJson()` positions the story exactly, but ink's serialized state
collapses the whole "output since last choice" into one flat
`currentText`/`currentTags` pair, so a restored batch renders as a single
block rather than its original per-line breakdown. This is a documented,
deliberate simplification: Insight values, wellbeing, consumed Red checks,
and the story's actual position are all restored exactly regardless.

See `GAME_GUIDE.md` for the ink content-tagging vocabulary
(`speaker`/`background`/`music`/`ambience`/`voice`/choice tags) that
`contentTags.ts` parses out of `story.currentTags`/`choice.tags`.

## 7. Overworld/Navigation Layer

`stores/navigationStore.ts` tracks `unlockedLocationIds: Set<LocationId>`
(seeded from each location's `unlockedByDefault` flag in
`content/locations.ts`) and `selectedLocationId`. Deliberately has **no
knowledge of `storyStore`/inkjs** — the handoff to the Story Engine
("selecting a location loads its story") happens at the component layer,
via the shared `enterLocationHub()` helper
(`components/screens/enterLocationHub.ts`), not inside either store.

`unlockLocation(id)` exists on the store but nothing in production code
currently calls it outside of `unlocksOnComplete` wiring on the checkpoint
→ noodleStall → deltaSquat chain — see `GAME_GUIDE.md`'s content pipeline
section for the current location list and what triggers an unlock.

Rendered today as a clickable district map rather than a plain card grid.
`content/mapRegions.ts` owns the district hotspot geometry/labels, while
`content/locations.ts` owns the actual playable destinations via a
`districtId` field. `OverworldScreen` overlays SVG hotspots on a temporary
modern-day Saigon map image and opens a district-details panel from there;
the background art is expected to change in a future 2226 pass without
changing the underlying district/location split.

**Location Hub Layer:** entering a location from the Overworld (or a
District Street, below) lands the player in a `LocationHubScreen` rather
than straight into an ink scene — a `content/locationHubs.ts`
`HubDefinition` (keyed by `HubId = LocationId`) describes what's there
before a specific encounter is chosen. `HubDefinition` is a discriminated
union on `layout`: `'cardList'` (the original shape — `characters:
HubCharacterPresence[]` + `actions: HubActionDefinition[]`, rendered as
clickable cards by `HubCardListView`) or `'grid'` (a walkable fog-of-war
tile grid, rendered by `HubGridView`). Only `checkpoint` (Aveline Lab) uses
`'grid'` today; `noodleStall`/`deltaSquat` stay `'cardList'` until they
have enough authored content to be worth gridding — both shapes coexist on
the same content module and screen, no engine-level reason to migrate a hub
before it's ready.

A grid hub's `HubGridDefinition` authors its floor plan as `layoutRows`
(one string per row, `'.'` floor / `'#'` wall / `'o'` POI / `'d'` door /
`' '` void — void meaning "not part of this location's floor plan," not
just an unmarked obstacle) plus `pois: HubPoi[]` carrying the real
interaction data keyed by `position`; the `'o'`/`'d'` markers in
`layoutRows` must line up 1:1 with `pois[].position`/`doors[].position`. A
`HubPoi` holds an ordered list of `HubInteraction`s (`type: 'talk' |
'inspect'`) — one tile can be several things to do, not just one NPC or one
action. Movement/collision/fog math is pure and store-agnostic
(`engine/gridMovement.ts`'s `step`/`isWalkable`/`reachableTiles`/
`tileKindAt`/`tilesWithinRadius`/`poiAt`/`doorAt`, typed against the
minimal structural shape each needs — `{ layoutRows }`, `{ pois }`,
`{ doors? }`, `{ layoutRows, entryTile }` for the two that flood-fill —
rather than `HubGridDefinition` directly, which is what lets District
Streets, below, reuse these functions without duplicating them). Only
floor, POI, and door tiles are ever rendered as a square (walls and void
draw nothing, not even a wall glyph or fog) or enter fog-of-war
bookkeeping, so a hub's rendered silhouette is exactly its walkable
footprint — `checkpoint`'s grid is a ring around a void core, not a filled
rectangle.

**Locked doors:** a `HubDoor` (`{ id, position, unlockFlag, label,
lockedReason }`) gates part of a hub's floor plan behind a
`casefileStore.hasFlag(unlockFlag)` check — `gridMovement.ts` stays
store-agnostic, so `reachableTiles` takes an injected `isDoorUnlocked`
predicate rather than reading the store directly; `HubGridView`/
`DistrictStreetView` build that predicate from `useCasefileStore` and pass
it through. `isWalkable` treats a door tile as walkable regardless of lock
state — a locked door can always be stepped onto and read up close — and
it's `reachableTiles` (a flood-fill from `grid.entryTile` that stops
expanding past any door it finds locked, while still including the door
tile itself) that actually enforces "can't pass beyond": `step()` takes
that same `reachable` set as a plain parameter — computed once per move by
the caller, not recomputed inside `step()` itself — and only completes a
move whose target is in it, so leaving a locked door tile is possible only
back toward the free side, never onward into the gated area. The same
`reachableTiles` result also gates the "Known Places" click-to-move
shortcut in `HubGridView`/`DistrictStreetView` — one flood-fill per move,
shared by both consumers rather than each recomputing its own — so a POI
fog-of-war reveals through a locked door (radius-1 vision reaches one tile
past the door once you're standing on it) can be seen and listed but not
clicked through. A locked door tile is revealed by fog-of-war like
any other tile (worth seeing even when you can't pass), rendered distinctly
(red tint + a "▣" glyph, tooltip showing `lockedReason`) — same shape on
`DistrictStreetDefinition` for the shared engine, though `checkpoint`'s
Inner Containment Wing (behind `checkpoint-inner-wing-unlocked`,
`CASE_1_LOCATION_MATRIX.md`'s gated reveal location) is the only door
authored so far.

`gameplayStore` (deliberately separate from `navigationStore`'s
overworld-level unlock/select bookkeeping) owns which hub is current, the
player's tile position, and fog-of-war memory: `currentHubId`,
`playerPosition`, `revealedTiles: Partial<Record<HubId, Set<string>>>`
(`"x,y"` keys, persists once revealed — re-entering a hub never re-fogs
it). The component calls `gridMovement.step()` to compute a candidate
tile, then `gameplayStore.moveTo()` to actually mutate position and reveal
fog around it — the same pure-computation/impure-mutation split
`checkResolution.ts`/`storyEngine.ts` already use elsewhere. Standing on a
POI tile surfaces its interaction list in a bottom action bar; launching
one runs the same `selectLocation`/`loadStory`/`enterLocation`
(audio)/`autosave` sequence a card-list hub's action already used
(`LocationHubScreen.enterStory`).

Scene end returns to the current hub by default, not the Overworld —
`DialogueScreen`'s return-to-hub handling is the seam; a card-list hub's
click-driven positioning means nothing needs resetting, and a grid hub
simply leaves `playerPosition` wherever it was when the encounter launched.
Returning to the Overworld is an explicit "Map" action from the hub
(`LocationHubScreen.handleReturnToMap`), not an automatic side effect of a
scene ending.

**District Street Layer (2026):** a third map layer now sits between the
Overworld and a Location Hub for districts that have earned one
(`content/districtStreets.ts`'s `DISTRICT_STREETS`, currently `district4`
and `district1`) — a walkable fog-of-war grid using the exact same tile
vocabulary and pure `gridMovement.ts` functions as a Location Hub grid
(above), where each POI names a `LocationId` rather than a talk/inspect
list; walking onto one calls `enterLocationHub()`. `gameplayStore` tracks
this one level above the existing hub fields (`currentDistrictId`/
`districtPlayerPosition`/`districtRevealedTiles`, same shape as
`currentHubId`/`playerPosition`/`revealedTiles`), and `App.tsx` routes to
the new `DistrictStreetScreen` between `LocationHubScreen` and
`OverworldScreen`. "Map" pops one layer at a time — leaving a Hub entered
from within a street returns to that street (`currentDistrictId` still
set), not straight to the Overworld. Districts without a street map keep
the plain panel-with-Enter-buttons flow described above, unchanged.

## 8. Save/Persistence Layer

A pure `engine/saveEngine.ts` (save-blob shape, `parseSaveBlob`,
`summarizeSlot`) plus `stores/saveStore.ts`, which owns all `localStorage`
I/O. No index file — `refreshSlots()` scans `localStorage` directly for
`SAVE_KEY_PREFIX`-prefixed keys.

**Slots:** one system-managed Autosave slot (overwritten on returning to
the Overworld and on selecting a location) plus player-named manual slots
(create-new or overwrite), via `SettingsOverlay`'s Save/Load section and
`TitleScreen`'s Continue (loads the most recent slot).

**`SaveBlob` shape** (`SAVE_FORMAT_VERSION = 2`): `insight`
(`SerializedInsightState`), `navigation` (`SerializedNavigationState`),
`inkStateJson: string | null`, and `activeStoryId: string | null` —
`inkStateJson`/`activeStoryId` are always captured/restored together (both
set mid-scene, both `null` on the Overworld). `activeStoryId` is what lets
`loadSlot` recompile the *same* story `inkStateJson` was serialized from
(`resolveStoryJson()` maps `'intro'` → `introStoryJson`, else looks up
`LOCATION_STORY_JSON`) instead of always restoring against one fixture —
this was a real bug (see running log) that the version bump exists to
guard against for any pre-fix save.

**Version handling:** `parseSaveBlob` treats a version mismatch as "no
save" (returns `null`) rather than throwing or attempting migration — there
is no migration path, a stale-shape blob is just discarded.

`insightStore`/`navigationStore` each expose a `hydrate()` bulk-restore
action (rebuilds `Set`s from serialized arrays); `storyStore.loadStory()`
takes an optional `savedStateJson` + `storyId` pair that routes to
`hydrateFromRestoredState()` instead of `advance()`. `settingsStore` is
explicitly **not** part of a save blob — it's a persistent user preference
tier, not a game-run snapshot, and stays session-only.

## 9. Voiceover/Audio Layer

A pure `engine/audioEngine.ts` (`nextMusicId`, `applyAmbienceCue`,
`computeChannelVolume`, `pickSfxSrc` — no browser APIs, unit-testable since
Vitest's environment is `node`) feeds an impure `stores/audioStore.ts`,
which owns real `HTMLAudioElement`s directly (no Web Audio API, no
third-party library). `audioStore` is a pure consumer of `storyStore`'s
output — it reads `StoryLine`s for `music`/`ambienceOps`/`voice`, never
drives narrative state, and ink has no audio `EXTERNAL` of any kind.

- **Music**: two pooled elements (A/B), crossfaded via a `setInterval`
  ramp (not `requestAnimationFrame` — rAF can stall indefinitely in a
  backgrounded tab, confirmed by a real bug fix, see running log).
- **Ambience**: one looping element per active layer, independently faded
  in/out, additive (not replace-on-change).
- **Voice**: single element, one-shot, interrupted on advance.
- **SFX**: fresh un-pooled element per call (`playSfx`), so rapid
  overlapping triggers don't cut each other off; category/variant pool
  resolved by `audioEngine.pickSfxSrc`.
- **Volume**: subscribes to `settingsStore` at module init (same
  live-resync pattern `storyStore.loadStory` uses for `insightStore`).
- **No React player component** — Zustand stores are module singletons
  outside the render tree, so `audioStore`'s elements survive every screen
  swap without special mounting.

`content/locations.ts` carries optional `musicId`/`ambienceIds` as a
location's static baseline mood, applied on entering (`enterLocation`) and
reset on returning to the Overworld (`enterOverworld`) — the only place
audio is driven from outside ink. Audio state is entirely session-only, no
`SaveBlob` involvement.

Full tag vocabulary, content-module shapes, and asset-pipeline conventions
(where files live, naming, category folders) are in `GAME_GUIDE.md`.

## 10. UI layer

`src/components/ui/` holds pure/presentational primitives — props in, no
store imports (`Panel`, `CyberButton`, `PipTrack`, `InsightChip`,
`ChoiceRow`, `CheckResultBlock`, `GlitchText`, `NeonSlider`, `NeonCheckbox`,
`PortraitFrame`). `src/components/screens/` holds the real screens/overlays
built on top of them (`TitleScreen`, `CharacterCreationScreen` +
`ChargenArchetypeStep`/`ChargenFreePointsStep`/`ChargenConfirmStep`,
`OverworldScreen`, `DialogueScreen`, `SettingsOverlay`, `CasefileOverlay`,
`CharacterOverlay`, `NavRail`, `OverlayHost`, `FailStateOverlay`).

`NavRail`'s `RailButton` and `CyberButton` are the one deliberate exception
to "UI primitives don't import stores" — both call `audioStore.playSfx`
directly for hover/click feedback, since UI sound isn't the kind of
game-state coupling the simulation/UI rule exists to prevent.

Visual tokens (chrome/semantic colors, cut-corner panel sizes, fonts),
motion/accessibility conventions, and the full screen-by-screen UI spec
live in `GAME_GUIDE.md`, not here — this section only maps *where the code
lives*, not what it looks like or why.

## 11. Content pipeline (code-level summary)

Each Overworld location owns exactly one `content/ink/<locationId>.ink`
file, compiled to a sibling `.json` via `npm run compile:ink`
(`scripts/compile-ink.mjs`, walks `content/ink/*.ink`, writes each sibling
`.json` via `inkjs/full`'s `Compiler`). `src/content/locationStories.ts`
maps `LocationId` → compiled JSON; `OverworldScreen.handleSelect` reads
from it. This is a manual step — no build-time or pre-commit hook forces
recompilation, so a stale `.json` after an `.ink` edit is a real hazard a
content author has to remember.

Static content modules (`src/content/*.ts`) — `insights.ts`,
`archetypes.ts`, `wellbeing.ts`, `locations.ts`, `npcs.ts`, `backgrounds.ts`,
`music.ts`, `ambience.ts`, `voiceClips.ts`, `sfx.ts`, `casefile.ts` — are
all plain exported `Record<Id, Definition>` objects keyed by a
string-literal ID type, with a companion `_IDS` array for iteration. New
content modules should follow this shape rather than inventing a new
pattern.

`content/ink/demo.ink`/`demo.json` is a throwaway Story Engine wiring
fixture (`storyStore.test.ts`/`storyEngine.test.ts` depend on its exact
content) — not real GDD content, don't treat it as canonical.

Ink authoring conventions (the `speaker`/`background`/`music`/`ambience`/
`voice` tag vocabulary, choice tags, check-definition placement, `checkId`
naming) are documented in `GAME_GUIDE.md`, which is the reference a content
author actually needs open while writing `.ink` files.

## 12. Testing & verification

No CI config exists yet. The manual gate before considering work done:
`npm run lint` (Oxlint), `npx tsc -b` (strict typecheck), `npm test`
(Vitest, single run). Every pure `engine/*.ts` module and every store has a
companion `*.test.ts`; there are zero `.test.tsx` component tests anywhere
in the repo (Vitest's environment is `node`, no DOM) — UI-primitive
behavior and real browser audio/playback are verified by manual passes
instead, which is why the pure/impure split above matters: it keeps the
untested surface area to browser-only mechanics, not decision logic.

## 13. Casefile / Investigation Progression Layer

`content/casefile.ts` defines static evidence/note content —
`EVIDENCE: Record<EvidenceId, EvidenceDefinition>` (three-tier
`EvidenceTier`: `flavor`/`clue`/`key`) and `CASE_NOTES: Record<CaseNoteId,
CaseNoteDefinition>` — while ownership/unlock state lives in
`stores/casefileStore.ts`: `evidenceIds`/`noteIds`/`flags` as `Set`s, with
idempotent `addEvidence`/`unlockNote`/`setFlag`/`clearFlag` plus
`hasEvidence`/`hasNote`/`hasFlag` queries (`clearFlag` exists for the debug
console's flag toggle, below — production content only ever sets flags
forward). `engine/casefileEngine.ts` holds the pure
`hydrateCasefileState` the store's `hydrate()` uses. Hidden `flags` are
never rendered in `CasefileOverlay` — reserved for story-gating logic that
doesn't belong in front of the player.

Casefile state is captured/restored as part of the `SaveBlob`
(`SerializedCasefileState`), the same as Insight/navigation/gameplay state.

**Not yet built:** nothing in the ink↔TS boundary grants evidence, notes, or
flags — there's no `gain_evidence`/`unlock_note`/`set_case_flag` `EXTERNAL`
(or TS-side scene-result hook) wired up yet, and `content/casefile.ts`'s
five evidence items and two notes are still flavor-light placeholders, not
Case 1-canonical content. Until that lands, the Debug Console's Flags tool
(`components/screens/DebugFlagsTool.tsx`, dev-build-only) is the only way
to set a flag — e.g. to test a Location Hub Layer locked door. See "Open /
not yet built" below.

**Debug Console (dev-only):** `App.tsx` renders a `DEV`-gated corner button
(stripped from production builds) that opens `DebugOverlay` — a flat menu
of one-off tools rather than a real console, since there's only ever a
couple of these at once. Today: **Map Builder**
(`components/screens/MapBuilderTool.tsx`), a grid-authoring UI that paints
`layoutRows`/`pois`/`doors` and exports JSON matching `HubGridDefinition`/
`DistrictStreetDefinition` for hand-integration into content files; and
**Flags** (`DebugFlagsTool.tsx`), the `casefileStore.setFlag`/`clearFlag`
toggle above. Both are plain component state / direct store calls — no new
persisted state, no save-format changes.

---

## Key Architectural Decisions (running log)

*Append-only in spirit — don't rewrite past entries, add new ones below.*

- **inkjs owns narrative branching; TypeScript owns all mechanical
  resolution.** Ink never rolls its own dice — it calls out via `EXTERNAL`
  functions, and reads Insight values via pushed ink variables for
  choice-gating.
- **Insight system replaces the character sheet.** Seven personified
  Insights serve as both check modifiers and narrative voices.
- **Resolution is Disco Elysium–style, not Celestial Return–style.** `2d6 +
  Insight vs. TN`, doubles decisive, no consumable dice currency. White
  checks retriable, Red checks one-shot.
- **Combat and tactical exploration are out of v1 scope** — a distant,
  Underrail: Expedition–style future consideration.
- **Overworld is a district-hotspot presentation over a flat
  unlocked-location model** — presentation-agnostic; ships today as a
  clickable Saigon map backed by district hotspot geometry rather than a
  plain card grid.
- **District geometry and story destinations are now separate content
  layers**: `content/mapRegions.ts` defines clickable districts and
  `content/locations.ts` defines the playable locations inside them via
  `districtId`.
- **Character creation is a flow, not a runtime system** — writes starting
  Insight values, records archetype, sets initial flags. Full three-step
  wizard (`ChargenArchetypeStep` → `ChargenFreePointsStep` →
  `ChargenConfirmStep`).
- **Wellbeing is a Disco-style two-track fail-state system**
  (Composure/Vitality), driven by narrative damage through the ink↔TS
  boundary. Zero in either track ends the run. Max pools derive from
  Insight levels. Death-check logic is TS-authoritative; ink only declares
  damage.
- **Story Engine, Navigation/Overworld, Save/Persistence, and
  Voiceover/Audio Layer are all fully implemented** — none of the six
  systems named in §2 remain unbuilt. (`SAVE_PERSISTENCE_SPEC.md` and
  `AUDIO_VOICEOVER_SPEC.md` previously listed these as open; both are
  superseded by this doc + `GAME_GUIDE.md`.)
- **Ink content-tagging convention implemented**: `speaker` (narrator /
  `npc:<id>` / `insight:<id>`), `background`, `music`, `ambience`, `voice`
  line tags plus `insight`/`check`/`locked` choice tags. `storyStore`
  carries tags **per line**, not flattened across a `Continue()` batch.
- **Portrait/backdrop art convention**: `PortraitFrame` falls back to
  initials on missing/failed art; `DialogueScreen`'s backdrop image has the
  same `onError` tolerance — art can land incrementally without breaking
  anything.
- **Save/load bug fixed (2026):** `loadSlot` used to unconditionally
  reload `demo.json` regardless of which story a save was actually taken
  in, risking corrupted restores for any mid-scene save. Fixed by threading
  `activeStoryId` through `storyStore` → `SaveBlob` → `saveStore`
  (`resolveStoryJson`), with `SAVE_FORMAT_VERSION` bumped to 2 so any
  pre-fix save is correctly treated as absent rather than mis-restored.
- **`reduceMotion` wired to an actual visual effect** via a
  `data-reduce-motion` attribute on `document.documentElement`
  (`App.tsx`), mirrored by a CSS selector in `index.css` alongside the
  `prefers-reduced-motion` media-query fallback — same pattern
  `highContrast`/`largeText` already use.
- **A real playback bug in the audio crossfade was fixed**: `rAF`-driven
  fades could permanently stall at their starting volume in a backgrounded/
  unfocused tab (rAF isn't a guaranteed timer). `audioStore.fadeTo` now
  uses `setInterval` (50ms steps), which keeps firing regardless of tab
  visibility.
- **Two orphaned dev-scaffolding components (`InsightHarness.tsx`,
  `NavigationHarness.tsx`) were removed** — superseded by the real screens
  under `src/components/screens/`, confirmed unreferenced anywhere.
- **Docs restructured (2026):** the eight settled-design spec docs
  (`CONTENT_PIPELINE_SPEC.md`, `INK_CONTENT_TAGGING_SPEC.md`,
  `INTRO_SCENE_SPEC.md`, `NAVIGATION_OVERWORLD_SPEC.md`,
  `SAVE_PERSISTENCE_SPEC.md`, `AUDIO_VOICEOVER_SPEC.md`,
  `UI_VISUAL_STYLE_SPEC.md`, `SAIGON_PROTOCOL_UI_DESIGN.md`) were
  consolidated into `GAME_GUIDE.md`, since all of them described work that
  is now built rather than pending. This file was rewritten from a
  pre-implementation design doc into the as-built reference above; each
  superseded file now just redirects to `GAME_GUIDE.md` so existing code
  comments that cite them by path stay valid.
- **Hub grids can be non-rectangular, and only render enterable tiles
  (2026):** `gridMovement.ts` gained a fourth tile kind, `'void'` (` ` in
  `layoutRows`), alongside floor/wall/POI. `isWalkable` moved from a
  blocklist (`tile !== '#'`) to an explicit allowlist via a new exported
  `tileKindAt`, which `HubGridView` also uses instead of re-deriving tile
  meaning itself. Only floor/POI tiles are ever rendered as a square or
  entered into fog-of-war reveal bookkeeping — walls and void alike draw
  nothing (not even a wall glyph or a fog square) and are never revealed, so
  a hub's rendered silhouette is exactly its walkable footprint rather than
  a rectangle with holes painted into it. `checkpoint`'s grid was reshaped
  from a filled rectangle into a loop around a void core with clipped
  corners — a TiTS "deck map"-style ring — as the first real example of the
  shape.
- **District Street Layer added (2026):** a third map layer between the
  Overworld and a Location Hub, for districts that have earned one —
  `content/districtStreets.ts`'s `DISTRICT_STREETS` (currently just
  `district4`). Reuses the Location Hub grid's exact tile vocabulary and
  pure engine rather than duplicating it: `engine/gridMovement.ts`'s
  `tileAt`/`tileKindAt`/`isWalkable`/`step`/`tilesWithinRadius` were loosened
  from `HubGridDefinition`-specific signatures to the minimal structural
  shape they actually need (`{ layoutRows }`), and `poiAt` became generic
  over any POI carrying a `position`, so `DistrictStreetGridDefinition`/
  `DistrictStreetPoi` satisfy them with zero movement-math duplication.
  `gameplayStore` tracks district-street position/fog one level above the
  existing hub fields; `App.tsx` routes a new `DistrictStreetScreen` between
  `LocationHubScreen` and `OverworldScreen`; "Map" pops one layer at a time.
  `OverworldScreen`'s per-location "Enter" and `DistrictStreetView`'s
  "Enter Location" both call one shared `enterLocationHub()` helper
  (`components/screens/enterLocationHub.ts`) instead of each hand-rolling
  the same four-step sequence. `SAVE_FORMAT_VERSION` bumped to 6.
  The intro scene's completion (`DialogueScreen.handleReturnToOverworld`,
  keyed off `storyStore.activeStoryId === 'intro'`) was also updated to
  match: it now spawns the player straight into the `checkpoint` Hub with
  `currentDistrictId` pre-set to `'district4'`, rather than landing on the
  plain Overworld — the intro's squad-car montage narratively already ends
  at Aveline Lab (`docs/CASE_1_LOCATION_MATRIX.md`), so the player shouldn't
  have to separately navigate there afterward. Pre-setting
  `currentDistrictId` means "Map" from inside the Hub still pops to the
  District 4 street first, not straight out to the Overworld, matching
  every other route into `checkpoint`.
- **Casefile progression is a real store, not static placeholder data
  (2026):** `stores/casefileStore.ts` (`evidenceIds`/`noteIds`/`flags`,
  idempotent grant methods) plus `engine/casefileEngine.ts` and a
  `SerializedCasefileState` slice of the `SaveBlob` replaced the original
  static-only `content/casefile.ts`. Ink-side grant hooks and real Case 1
  evidence/note content remain unbuilt — see §13 and "Open / not yet
  built" below.
- **Second docs cleanup pass (2026):** `CASEFILE_PROGRESSION_SPEC.md`,
  `LOCATION_GRID_EXPLORATION_SPEC.md`, `LOCATION_HUB_ENCOUNTER_FLOW_SPEC.md`,
  and `SAIGON_2226_OVERWORLD_SPEC.md` described systems that are now fully
  built (Location Hub Layer, District Street Layer, Casefile progression
  store) — their content was folded into §7/§13 here and `GAME_GUIDE.md`
  §6, and the four files were deleted outright (unlike the first cleanup
  pass, which left redirect stubs — those stubs no longer exist either;
  `CLAUDE.md`'s doc-routing note was corrected to stop claiming they do).
  Every code comment citing the four deleted paths was repointed at the
  consolidated section instead of left dangling. `docs/CASE_1_*.md` were
  deliberately left alone in this pass — they spec Case 1 content that
  hasn't been built yet, so they don't qualify as superseded.
- **Locked doors added to the Location Hub Layer (2026):** a `HubDoor`
  (`{ id, position, unlockFlag, label, lockedReason }`) blocks off part of
  a grid hub's/district street's floor plan until a `casefileStore` flag is
  set — `gridMovement.ts` gained a fifth tile kind, `'door'` (`'d'` in
  `layoutRows`), and `isWalkable`/`step` take an injected
  `isDoorUnlocked(position)` predicate (default: always locked) rather than
  reading `casefileStore` themselves, keeping the engine store-agnostic;
  `HubGridView`/`DistrictStreetView` build that predicate from
  `useCasefileStore` at the component layer, the same split
  `checkResolution.ts`/`storyEngine.ts` already use. Unlike walls/void, a
  locked door is still revealed by fog-of-war (`tilesWithinRadius` treats
  `'door'` as revealable regardless of lock state — a sealed door is worth
  seeing) and renders distinctly (red tint, tooltip). Applied to
  `checkpoint`: the grid grew from 6 to 9 rows to fit a small Inner
  Containment Wing room behind a door gated on
  `checkpoint-inner-wing-unlocked` (`CASE_1_LOCATION_MATRIX.md`'s gated
  reveal location) — placeholder content proving the mechanism, not the
  real scene. Since ink still can't set flags (§13), a new dev-only Debug
  Console (`App.tsx`'s `DEV`-gated corner button → `DebugOverlay`) was
  added with a Flags tool to set/clear them for testing, plus a Map Builder
  tool (a grid-painting UI exporting `HubGridDefinition`/
  `DistrictStreetDefinition`-shaped JSON) as its first two entries — see
  §13's "Debug Console" callout.
- **Locked doors made enterable-but-not-passable, and the AR-scan panel
  went per-square (2026):** locked doors originally blocked `step()`
  outright, the same as a wall — a door tile could never actually be
  stood on while locked. Changed so a locked door can always be stepped
  onto (read its tooltip up close) but not walked past: `isWalkable` no
  longer takes an `isDoorUnlocked` predicate (a door tile is walkable
  unconditionally); a new `gridMovement.ts` export, `reachableTiles`,
  flood-fills from `grid.entryTile` through floor/POI/unlocked-door tiles,
  including a locked door tile itself but never expanding past it, and
  `step()` only completes a move onto a tile that flood-fill reached —
  which also means retreating off a locked door always works (the tile you
  arrived from is necessarily reachable) with no extra "which way did I
  come from" state to track or persist. Both grid shapes already carried
  `entryTile`, so no content changes were needed. This closed a bypass the
  old always-blocked door had implicitly prevented: standing on a locked
  door reveals one fog-of-war tile past it (radius-1 vision from the door
  position), so a gated POI can become "known" while still locked —
  `HubGridView`/`DistrictStreetView`'s "Known Places" shortcut list now
  checks `reachableTiles` too and disables (rather than hides) an
  unreachable entry, so clicking it can't teleport past the door the way
  walking there normally can't. Separately, the AR-scan panel's blurb line
  (previously always the hub/street's static `blurb`) now describes
  whatever square the player is standing on — a POI's interaction
  description(s) (or `lockedReason` for an unavailable one), a door's
  `label`/`lockedReason` depending on lock state, falling back to the
  general `blurb` on plain floor — computed in the component, not the
  store, consistent with simulation-vs-presentation staying split.
- **District 1 earned a street map (2026):** `district1` is now the second
  entry in `DISTRICT_STREETS` (§7), following the exact `district4`
  precedent — a walkable street between the Overworld and three new
  `cardList` Location Hubs matching `CASE_1_LOCATION_MATRIX.md`'s District 1
  section: CID Office (recurring home-base hub, always unlocked), SEZAC
  Records / Licensing Office (paper-trail location, always unlocked), and
  the District 1 Corporate Plaza (locked from the street — `unlockedByDefault:
  false` plus a `lockedReason` on its street POI — until the case earns
  enough leverage to justify the meeting; no unlock wiring exists yet, so it
  stays permanently locked for now). Simpler geometry than District 4's
  cross: a single T-branch (one dead-end up to SEZAC Records off a short
  main road) since there are only three destinations to place. No new
  mechanism — same tile vocabulary, same `enterLocationHub()` handoff, same
  placeholder-flavor `.ink` scene shape (one Insight-gated observation, one
  choice, `END`) the District 4 second-wave locations already established.
- **Performance pass (2026):** three hot-path fixes from a review of what
  actually re-runs at high frequency in a game with no per-frame simulation
  tick. `gridMovement.ts`'s `step()` no longer recomputes `reachableTiles`
  internally — it now takes an already-computed `reachable: Set<string>`
  parameter (§7 above), so `HubGridView`/`DistrictStreetView` flood-fill
  once per move and share the result between their keydown handler and
  their "Known Places" panel instead of each running its own;
  `useGridKeydownMovement` was updated to match. `storyTranscript.tsx`'s
  `TranscriptLog` now renders each entry through a `React.memo`'d
  `LogEntryRow`, keeping every already-typed entry's props referentially
  stable so only the entry currently typing re-renders on a typewriter
  tick — previously every tick (as fast as 8ms on the `fast` text-speed
  setting) re-rendered and re-parsed the *entire* transcript regardless of
  how many entries it held. `useTranscript` also gained an optional
  `maxEntries` cap; `ConversationScreen` passes `40` since its ink Story
  stays parked on one topic-loop session indefinitely (unlike
  `DialogueScreen`'s one-scene sessions, left uncapped). `audioStore.fadeTo`
  now tracks one in-flight fade interval per `HTMLAudioElement` in a
  module-scope `WeakMap` and cancels it before starting a new one, closing
  a case where advancing dialogue faster than `CROSSFADE_MS` could leave
  two intervals racing on the same element's volume. `PERFORMANCE_PASS_SPEC.md`
  covered the original findings and is now folded in here and deleted.

### Open / not yet built

- Real ElevenLabs voice clips — `content/voiceClips.ts`'s `meiHongIntro` id
  is still the only voice asset path pointing at a file that doesn't exist.
  Music, ambience, and UI SFX assets are all real.
- Real per-location narrative content beyond `checkpoint`/`noodleStall`/
  `deltaSquat` and the `intro` scene — these remain flavor-light, not GDD-
  canonical.
- In-play Insight leveling (XP, investigation rewards) — doesn't exist;
  the chargen sheet is fixed for the run.
- Combat/tactical exploration — explicitly out of scope, distant future.
- Casefile ink integration (§13) — the store/save layer is built, but
  nothing grants evidence, notes, or flags from ink yet, and
  `content/casefile.ts`'s content is still placeholder. This also means
  `checkpoint`'s locked inner-wing door (§7) has no real in-fiction unlock
  trigger yet — only the Debug Console's Flags tool can open it today.
- The Inner Containment Wing itself (§7's locked-door example) is a
  placeholder room with one generic inspect POI — `CASE_1_LOCATION_MATRIX.md`'s
  actual forensic-reveal scene for that location isn't authored yet.
- **Archetype-gated content convention established (2026):** `archetype` was
  already synced into ink globals by `storyEngine.ts`'s `syncInsightVariables`,
  but no content read it. `workerCanteen.ink` now gates a narrator beat on
  `{ archetype == "hustler": ... }` — the same native ink-conditional pattern
  Insight-level gating already used (e.g. `deltaSquat.ink`'s `{ root >= 3 }`),
  so no engine change was needed, only the `VAR archetype = ""` declaration
  and the convention itself (`GAME_GUIDE.md` §5.4). Deliberately has no
  visible UI tag/pill (unlike `insight:`/`check:` choice tags) — an
  archetype-gated line or choice silently appears or doesn't, by design
  decision, not an oversight.
- **The Hustler's backstory was rewritten (2026)** to be a European-born
  emigre raised in New Saigon since early childhood — fluent in the local
  tongue but still read as an outsider by native-born Saigonese, an
  intentional "outsider without being a full outsider" framing. Strength
  (Hustle) and weakness (Muscle Memory) are unchanged; only `backstory` in
  `content/archetypes.ts` and the mirrored line in `SEA_CYBERPUNK_GDD.md`
  §4 changed.
