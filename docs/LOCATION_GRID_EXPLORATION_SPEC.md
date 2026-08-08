# Location Grid Exploration Spec

*Working spec for replacing the Location Hub's card-grid interaction list with
a walkable, fog-of-war tile grid — reference: a TiTS-style "deck map" (small
squares, revealed by walking through them, an interaction list surfacing at
the bottom of the screen when something is there).*

## Goal

Replace how the player interacts with a single **Location Hub** (Architecture
§7, `docs/LOCATION_HUB_ENCOUNTER_FLOW_SPEC.md`) — currently a static grid of
clickable cards — with a small walkable tile grid the player moves through
with WASD/arrow keys. Walking uncovers fog-of-war. Standing on a tile that
holds people or things to interact with surfaces a list of interaction
options at the bottom of the screen.

**This spec does not touch the Overworld.** District-to-district travel
(`OverworldScreen.tsx`, `docs/SAIGON_2226_OVERWORLD_SPEC.md`) stays exactly as
it is — a district map you click into. This is purely about what happens
*inside* a Location Hub once you're already there.

**This spec does not change the Overworld → Hub → Encounter → Hub → Overworld
flow** established in `LOCATION_HUB_ENCOUNTER_FLOW_SPEC.md` and already built
(`gameplayStore.currentHubId`, `App.tsx` routing, scenes returning to the hub
by default). It supersedes only that spec's "Character presentation in the
hub" section, which explicitly recommended hotspot cards over spatial
movement — that recommendation is now superseded by direct product
direction.

## Why

The current `LocationHubScreen` (`src/components/screens/LocationHubScreen.tsx`)
shows every talk/inspect option as a card, all at once, positioned either as
floating anchors over the background image or as a flat list. That reads as
a menu, not a place. It doesn't support:

- a sense of *where* something is relative to something else in the room
- discovering something by moving toward it, rather than it just being listed
- a location that visibly grows more familiar / more mapped the more you
  return to it

A walkable tile grid with fog-of-war gives us all three without requiring a
full 2D adventure-game engine: it's still small, authored, discrete-tile
movement — just enough spatial structure to make "being in a place" legible.

## Decisions locked in

These were open questions; each is settled for this spec rather than left
for implementation time to improvise:

1. **Grid backdrop** — the existing location background image (e.g. Aveline
   Lab exterior) stays, dimmed/blurred as an atmosphere layer behind the
   grid. The grid itself renders as a HUD/AR-scan overlay on top — reads as
   the detective's own augmented-reality room scan, not a separate painted
   map. No new per-tile art is required.
2. **Rollout scope** — this spec designs the general grid system, but the
   concrete implementation plan (Phase 1, below) targets **one hub only**:
   `checkpoint` (Aveline Lab), the only hub with real characters/actions
   authored today. `noodleStall` and `deltaSquat` keep today's card-list
   presentation until they have real content worth placing on a grid.
   `HubDefinition` becomes a discriminated union on a new `layout` field
   (`'grid' | 'cardList'`) so both presentations coexist in the same content
   module and screen.
3. **Fog-of-war persistence** — once a tile is revealed, it stays revealed
   for the rest of the playthrough (persisted per hub, per save). Re-entering
   a hub does not re-fog it.
4. **Interaction trigger** — POI tiles are walkable, not solid. Stepping
   directly onto a POI tile is what surfaces its interaction list at the
   bottom of the screen (not "adjacent tile," which is what the TiTS
   reference does — we're deliberately simpler here).
5. **Multiple interactions per tile** *(added mid-spec, per direct
   instruction)* — a single POI tile is not one interaction, it's a **place**
   that can hold a **list** of interactions: one or more people to talk to
   and/or things to inspect, all surfaced together in the bottom bar when the
   player stands on that tile. A tile is not required to map 1:1 to a single
   NPC or action.

## Conceptual model

Four tile kinds — but only two of them ever draw a square. **Only enterable
tiles (floor and POI) are rendered at all** — walls and void are both
invisible, occupying no more than their CSS grid slot, so the room's true
silhouette is exactly its walkable footprint rather than a rectangle with
holes painted into it:

- **Floor** — walkable, empty, no interaction. Rendered.
- **POI (point of interest)** — walkable. Holds an ordered list of
  `HubInteraction`s (talk and/or inspect entries). Standing on it opens the
  bottom interaction bar for everything authored there. Rendered.
- **Wall** — not walkable; blocks movement. Never rendered as a square (same
  invisible treatment as void) and excluded from fog-of-war reveal
  bookkeeping — there's nothing to reveal about a tile that's never drawn.
- **Void** — not part of this location's floor plan at all. Not walkable,
  never rendered, excluded from fog-of-war reveal bookkeeping. The
  wall/void distinction is purely authorial (a deliberate obstacle vs. "the
  room doesn't extend here") — both behave identically at runtime. This is
  what lets a hub's walkable footprint be a non-rectangular shape — e.g. a
  loop around a blank core — instead of always a filled rectangle. See
  `checkpoint`'s grid in `content/locationHubs.ts` for a worked example (a
  TiTS "deck map"-style ring).

Fog-of-war state, per hub, per save (floor/POI tiles only — walls and void
are never part of `revealedTiles`):

- **Unrevealed** — rendered as an opaque scan-fog square; nothing under it
  is visible, including whether it's a floor or POI tile.
- **Revealed** — rendered as a mostly-transparent HUD cell over the dimmed
  background, showing its contents (a walkable tile or a POI marker). Stays
  revealed permanently once uncovered.

Player state, per active hub:

- **Position** — current tile coordinate.
- A short **vision radius** around the player's current tile reveals fog as
  they move (recommend a small fixed radius, e.g. the current tile plus its
  four orthogonal neighbors — a "+" shape — rather than full room-clearing
  line-of-sight; keep it simple for a first pass, tune later).

## Data model

`src/content/locationHubs.ts` — `HubDefinition` becomes a discriminated
union so the two legacy hubs (`noodleStall`, `deltaSquat`) don't need to be
touched:

```ts
interface HubDefinitionBase {
  id: HubId
  name: string
  blurb: string
  backgroundId: BackgroundId | null
}

/** Today's shape, unchanged — kept for hubs not yet worth gridding. */
interface CardListHubDefinition extends HubDefinitionBase {
  layout: 'cardList'
  characters: HubCharacterPresence[]
  actions: HubActionDefinition[]
}

interface GridHubDefinition extends HubDefinitionBase {
  layout: 'grid'
  grid: HubGridDefinition
}

export type HubDefinition = CardListHubDefinition | GridHubDefinition
```

Grid content:

```ts
interface GridPosition {
  x: number
  y: number
}

/** One row per grid row, one char per column: '.' floor, '#' wall, 'o' POI, ' ' void (not part of the location — see "Conceptual model" above). */
type HubLayoutRows = string[]

export interface HubInteraction {
  id: string
  type: 'talk' | 'inspect'
  npcId?: NpcId // present when type === 'talk'
  label: string
  description: string
  storyLocationId: LocationId
  available: boolean
  lockedReason?: string
}

export interface HubPoi {
  id: string
  position: GridPosition
  interactions: HubInteraction[] // one tile, one or more things to do there
}

export interface HubGridDefinition {
  width: number
  height: number
  entryTile: GridPosition // where the player spawns, arriving from the Overworld
  layoutRows: HubLayoutRows // walls/floor/POI-marker authoring surface
  pois: HubPoi[] // POI tiles, keyed by position, carrying the real interaction data
  visionRadius?: number // defaults to 1 (the "+" shape above) if omitted
}
```

`layoutRows` is an ASCII authoring convenience (quick to hand-place, easy to
eyeball in a diff) — the `o` markers in it must line up 1:1 with `pois[].position`,
which carries the actual interaction data. This mirrors how
`HubCharacterPresence.anchor` works today (normalized `{x, y}` percentages);
we're just swapping percentages for integer tile coordinates.

`HubCharacterPresence` / `HubActionDefinition` (today's shape) stay exactly
as-is for `cardList` hubs. `HubInteraction` is the grid equivalent, merging
what those two types used to split by `type: 'talk' | 'inspect'` — same
approach, since a POI's interaction list can now mix both kinds.

## Store / engine impact

**Movement math is pure and lives outside the component**, per the repo's
core rule (`CLAUDE.md`): a new pure module,

`src/engine/gridMovement.ts`

```ts
type Direction = 'up' | 'down' | 'left' | 'right'

function step(
  grid: HubGridDefinition,
  from: GridPosition,
  direction: Direction,
): GridPosition // returns `from` unchanged if the target tile is out of
                 // bounds or a wall — collision is a pure function, testable
                 // without a store or a DOM
```

**`gameplayStore`** (already the "where is the player, non-story" store —
Architecture §7's original recommendation) gets extended rather than
introducing a new store:

```ts
interface GameplayState {
  currentHubId: HubId | null
  playerPosition: GridPosition | null // null when not inside a grid hub
  revealedTiles: Partial<Record<HubId, Set<string>>> // "x,y" keys, persists across visits

  enterHub: (hubId: HubId) => void
  leaveHub: () => void
  moveTo: (position: GridPosition) => void // sets position + reveals around it
  activePoiAt: (hubId: HubId, position: GridPosition) => HubPoi | null

  hydrate: (state: SerializedGameplayState) => void
  reset: () => void
}
```

The component calls `gridMovement.step()` to compute the candidate next
tile, then calls `gameplayStore.moveTo()` if it changed — `moveTo` is the
only thing that mutates state, and it's responsible for updating
`revealedTiles` for the new position's vision radius. This keeps the same
split `checkResolution.ts`/`storyEngine.ts` already use: pure computation
separate from the store that owns the mutation.

`entering a hub` (`enterHub`) always sets `playerPosition` to the hub's
`entryTile` and touches its own tile into `revealedTiles`. Returning to the
hub after a finished encounter should resume at the tile whose POI launched
that encounter — `DialogueScreen.handleReturnToHub` already exists as the
seam for this; it just needs to not reset position when the story simply
continued from a POI already stood on (grid hubs never move the player
except through `moveTo`, so this is automatic — no special-casing needed
there beyond leaving `playerPosition` alone on return).

## Movement & interaction rules

- **Controls**: WASD and arrow keys, either bound to the same handler.
  Discrete tile-stepping — one key press/repeat = one tile, not continuous
  free movement. (No existing keybinding conflicts: WASD is unused
  elsewhere in the app today.)
- **Collision**: walls block movement outright; the player simply doesn't
  move (no bump animation needed for v1, but not precluded later).
- **Interaction surfacing**: whenever `playerPosition` matches a `HubPoi`'s
  position, render that POI's `interactions` list as buttons in a bottom
  action bar. Leaving the tile hides the bar. An interaction with
  `available: false` renders disabled with its `lockedReason`, same
  presentation the current card view already uses for locked
  characters/actions.
- **Launching an interaction**: identical to today's `enterStory()` in
  `LocationHubScreen.tsx` — `selectLocation`, `loadStory`, `enterLocation`
  (audio), `autosave`. No change to the story-launch seam, only to how the
  player arrives at the click.
- **Reduce Motion**: tile movement should snap instantly rather than
  animate/slide when `settingsStore.reduceMotion` is set, following the
  existing `data-reduceMotion` root-attribute convention (`App.tsx`,
  `index.css`) rather than a new one-off check.

## Rendering / UI requirements

New component, `src/components/screens/HubGridView.tsx`, rendered from
`LocationHubScreen.tsx` when `hub.layout === 'grid'` (the existing card JSX
moves into a sibling `HubCardListView.tsx`, unchanged, used when
`hub.layout === 'cardList'`).

Visual layers, back to front:

1. Dimmed/blurred location background image (same treatment
   `LocationHubScreen` already applies today — reuse, don't reinvent).
2. The tile grid itself as an absolutely-positioned overlay: unrevealed
   floor/POI tiles as opaque fogged squares; revealed floor tiles as
   mostly-transparent HUD cells with a thin chrome-accent grid line; revealed
   POI tiles get a marker/glyph (and a subtle pulse when their interaction
   list has something newly available, mirroring the "urgent" treatment
   language already used for districts in `SAIGON_2226_OVERWORLD_SPEC.md`).
   Wall and void tiles draw nothing at all — only enterable tiles are ever
   rendered as a square.
3. A player marker at `playerPosition`.
4. Hub name/blurb panel (reuse existing `Panel` header treatment from
   today's screen).
5. Bottom interaction bar — list of `CyberButton`s (existing component,
   already used for this exact "pick an option" job elsewhere), one per
   `HubInteraction` on the current POI, locked ones rendered as disabled
   `Panel`s exactly like today's unavailable cards.
6. `Return to Map` action stays available at all times — not a walkable
   grid-exit tile, but (2026) not *only* `NavRail`'s small `onMap` icon
   either: `HubGridView`/`DistrictStreetView` also render their own inline
   "Return to Map" button in the header panel, since the icon alone wasn't
   discoverable as "the way out" of a walkable room. Both call the same
   handler as `NavRail`'s `onMap` — no separate exit logic, just a second,
   more visible entry point to it.

Accessibility (this repo's overworld spec already sets the bar — match it,
don't regress it):

- Grid must be keyboard-operable, not mouse/hover-only (WASD/arrows satisfy
  this directly for movement).
- The interaction bar itself is already keyboard-focusable buttons; no
  special handling needed there.
- Provide a text fallback: a small always-visible list of currently-known
  POIs in the hub (name + whether reachable/locked), for players who prefer
  not to navigate the grid at all — same rationale as the Overworld's
  "District Access" text fallback panel. Clicking an entry in the fallback
  list can just be equivalent to walking onto that POI (`moveTo` + reveal),
  not a shortcut that bypasses fog — so it stays consistent with "you have
  to have discovered it to fast-travel to it."

## Save/load implications

Extend the save blob (`src/engine/saveEngine.ts`):

```ts
export interface SerializedGameplayState {
  currentHubId: HubId | null
  playerPosition: GridPosition | null
  revealedTiles: Partial<Record<HubId, string[]>> // Set -> array for JSON
}
```

`SAVE_FORMAT_VERSION` bump required (same policy the Casefile Progression
Spec already established and the repo already followed for hub-state: no
migration path, old saves are treated as absent rather than partially
restored).

## File impact

Required:

- `src/content/locationHubs.ts` — `HubDefinition` becomes the discriminated
  union above; author `checkpoint`'s grid content.
- `src/engine/gridMovement.ts` (+ `.test.ts`) — pure step/collision function.
- `src/stores/gameplayStore.ts` (+ existing `.test.ts` extended) —
  `playerPosition`, `revealedTiles`, `moveTo`, `activePoiAt`.
- `src/components/screens/HubGridView.tsx` — new.
- `src/components/screens/HubCardListView.tsx` — extracted from today's
  `LocationHubScreen.tsx` body, unchanged in behavior.
- `src/components/screens/LocationHubScreen.tsx` — shrinks to a switch on
  `hub.layout`.
- `src/engine/saveEngine.ts` — `SerializedGameplayState`, bump
  `SAVE_FORMAT_VERSION`.
- `src/stores/saveStore.ts` — capture/hydrate the new gameplay sub-state.

## Recommended implementation phases

### Phase 1 — pilot on `checkpoint`

- Discriminated `HubDefinition`, `gridMovement.ts`, extended
  `gameplayStore`, `HubGridView.tsx`.
- Author Aveline Lab's grid: a small room (roughly 8×5) placing Mei Hong,
  the Responding Officer, the access scanner, and the sealed inner door as
  POIs, Sora Baek's not-yet-present state represented as an authored POI
  with an empty/locked interaction rather than omitted (so the room reads
  as "someone's supposed to be here" once that becomes true later).
- Note: the existing `checkpoint-scene` "Review the scene" card
  (`docs/LOCATION_HUB_ENCOUNTER_FLOW_SPEC.md`'s catch-all inspect action)
  stops making sense as its own POI once walking the room *is* reviewing the
  scene — fold its flavor into ambient tile descriptions or drop it; call
  this at implementation time.
- Save format bump, fallback list, Reduce Motion handling.

### Phase 2 — remaining hubs

- Convert `noodleStall` and `deltaSquat` to `layout: 'grid'` once they have
  real characters/actions worth placing spatially (today they're single
  flavor-only inspect actions — not yet worth a grid).

### Phase 3 — later refinement

- Vision radius tuning / line-of-sight through open doorways.
- Dynamic POI content driven by casefile flags (`CASEFILE_PROGRESSION_SPEC.md`
  already flags this as a later phase for evidence-gated availability, not
  specific to grids — applies the same way here).
- Movement/bump animation, footstep SFX.

## Open questions

*(Non-blocking — reasonable defaults are assumed above; flagging for
implementation-time judgment.)*

- Vision radius default (this spec assumes a "+" shape of 1 tile; may want
  hub-specific tuning via the optional `visionRadius` field).
- Whether NPCs should ever *not* be at a fixed authored tile (i.e., simulated
  wandering) — out of scope here, matches the existing "no in-play dynamism
  beyond authored availability flags" posture the Casefile spec also holds.
- Whether grid dimensions/authoring should eventually move to a visual tile
  editor rather than hand-written `layoutRows` strings, once more than one
  or two hubs use this.

## Recommendation

Implement Phase 1 against `checkpoint` only. It's the one hub with enough
authored content to prove the model (multi-interaction POIs, locked vs.
available presence, return-to-hub-after-scene) without blocking on new
narrative content. Once that's playable and feels right, converting
`noodleStall`/`deltaSquat` — or any new District 1/5/2 hub from
`CASE_1_LOCATION_MATRIX.md` — is just content authoring against an already-
proven system.
