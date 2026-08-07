# Location Hub / Encounter Flow Spec

*Working spec for introducing an intermediate playable state between the Overworld map and a live dialogue scene.*

## Goal

Expand the game flow so a player can **be in a place** without automatically being inside one continuous Ink scene.

This solves the current structural gap where:

- the player clicks a location from the Overworld
- immediately enters a story scene
- and, when the scene ends, gets dumped back to the Overworld

For Case 1 and the broader open-world investigation structure, we need a middle layer:

- choose a district / location
- enter that location as a spatial-social hub
- decide who to talk to or what to inspect
- launch a specific encounter or scene
- return to the location hub when that encounter ends

## Why this is needed

The current structure is too coarse for detective fiction.

A real investigation needs:

- repeated visits to the same place
- changed conversations after new discoveries
- multiple people present in one location
- optional interactions that are not all full story scenes
- scenes that end back in the room rather than ejecting the player to the city map

Without this layer, every location becomes a one-shot cutscene node, which works for demos but not for the kind of open-world noir case we are building.

## Desired game flow

### Current flow

- Overworld
- Dialogue Scene
- Overworld

### Target flow

- Overworld
- Location Hub
- Dialogue Scene / Encounter
- Location Hub
- Overworld

The crucial change is that **scene end returns to the current location hub by default**, not the Overworld.

## Conceptual model

We should separate three concepts that are currently collapsed:

### 1. District / Overworld destination

Example:

- District 4
- District 1
- District 5 / Cholon
- District 2

This is travel/navigation space.

### 2. Location Hub

Example:

- Aveline District 4 Laboratory
- CID Office
- Cholon Clinic
- Former Employee Safe Flat
- Drowned Tower Approach

This is the player's current place in the city.

### 3. Encounter / Scene

Example:

- Talk to Mei Hong
- Inspect intake records
- Question responding officer
- Confront Tomas Varga
- Lucid conversation with HN-12

This is a specific interaction, often powered by Ink.

## Runtime state recommendation

Inside `screen === 'game'`, the app needs to distinguish:

- **Overworld**
- **Location Hub**
- **Dialogue Scene**

### Preferred routing rule

Use a dedicated gameplay-mode source of truth rather than inferring everything from `storyStore.story`.

Possible shapes:

1. Extend `navigationStore`
2. Add a dedicated `gameplayStore`
3. Expand `uiStore`

Recommendation:

Add a dedicated **`gameplayStore`** or extend `navigationStore` carefully, rather than bloating `uiStore`.

Reason:

- `uiStore` is currently intentionally minimal
- this new state is gameplay/navigation state, not just “what overlay is open”
- we want to preserve the clean separation already present in the repo

### Example state shape

```ts
type GameMode = 'overworld' | 'locationHub'

interface GameplayState {
  mode: GameMode
  currentHubId: HubId | null

  enterHub: (hubId: HubId) => void
  returnToOverworld: () => void
}
```

Then `App.tsx` routing becomes:

- if `storyStore.story` exists -> `DialogueScreen`
- else if `gameplayStore.currentHubId` exists -> `LocationHubScreen`
- else -> `OverworldScreen`

This preserves `storyStore.story` as the signal for active dialogue while allowing “no active story, but still in a place.”

## Scene end behavior

### New default

When a scene ends:

- if it was launched from a hub, return to that hub
- do not automatically jump to the Overworld

### Explicit exit action

Returning to the Overworld should become an intentional player action from the hub, not the default result of scene completion.

### Exceptions

Some scenes may explicitly eject the player:

- forced relocation
- arrest / collapse / story break
- transition to another hub

But those should be authored exceptions, not the baseline behavior.

## Content model recommendation

We need authored hub content separate from raw story locations.

### New concept: Hub definition

Suggested module:

- `src/content/locationHubs.ts`

Example shape:

```ts
type HubId = 'avelineLab' | 'cidOffice' | 'cholonClinic' | ...

interface HubCharacterPresence {
  npcId: NpcId
  interactionId: string
  label: string
  available: boolean
  lockedReason?: string
}

interface HubAction {
  id: string
  type: 'talk' | 'inspect' | 'travel'
  label: string
  interactionId?: string
  available: boolean
  lockedReason?: string
}

interface HubDefinition {
  id: HubId
  districtId: DistrictId
  name: string
  blurb: string
  backgroundId?: BackgroundId
  ambienceIds?: AmbienceId[]
  characters: HubCharacterPresence[]
  actions: HubAction[]
}
```

Important:

These definitions should be **data**, not live state. Availability should eventually be derived from store flags / investigation progress.

## Interaction model

The hub should support at least three interaction types:

### 1. Talk

Click a visible character to launch a conversation scene.

Examples:

- Talk to Mei Hong
- Talk to desk sergeant
- Talk to informant

### 2. Inspect

Examine a space or object to launch a shorter scene or direct evidence grant.

Examples:

- Inspect intake counter
- Review security glass
- Search flooded service route

### 3. Travel / Exit

Move to:

- another hub in the same district
- the Overworld map
- a forced scene

## Character presentation in the hub

The user specifically wants the scene or location view to let them click a character who is there. That is a strong direction.

### Recommended first version

Do **not** try to build full freeform spatial walking.

Instead:

- show the location background
- place 1–3 character hotspot cards or silhouette anchors in the scene
- clicking a character opens or directly launches their interaction
- also provide a text list fallback below / beside the scene

This gives us the feeling of “who is in the room” without building an adventure-game movement system.

### Why this is enough

- readable
- scalable
- mobile-friendly
- works with existing portrait + background conventions
- supports optional encounters cleanly

## Example: Aveline Lab Hub

### Hub view

- background: front lab / waiting area
- visible characters:
  - Mei Hong
  - responding officer
  - Sora Baek, once introduced
- inspectables:
  - intake counter
  - access scanner
  - sealed inner-lab door

### Scene flow

- click Mei Hong -> launch `talk_mei_hong_intro`
- scene ends -> return to Aveline Lab Hub
- new interaction unlocks:
  - inspect access scanner
  - question responding officer

Later:

- after enough evidence, sealed inner-lab door becomes available
- click it -> launch containment wing scene

This is exactly the kind of layered investigative flow the current system cannot express.

## Dialogue / scene launch model

Encounters should be launchable by identifier, not by hardcoded UI branching.

### Recommended concept

We need a content map from interaction/encounter IDs to Ink story entries or story assets.

Possible approaches:

1. One Ink file per encounter
2. One Ink file per hub with knot/stitch entry points
3. One Ink file per district with encounter entry knots

Recommendation:

For now, prefer **one Ink file per district or hub with multiple entry points**, not one file per tiny conversation.

Reason:

- fewer files
- easier shared state
- easier to manage repeated visits inside one place

This implies the story-launch layer may eventually need to support:

- `storyId`
- `entryKnot` or similar authored entry target

That is likely a future story-system enhancement.

## Save/load implications

Location hub state must be saveable.

At minimum, save data must know:

- whether the player is on the Overworld or in a hub when no story is active
- which hub is current

Potential additional persistence:

- which hub interactions are exhausted or changed
- which characters are currently present

Recommendation:

Store only the **current hub / mode** directly.
Derive the rest from investigation flags and story/casefile state where possible.

## UI requirements

### New screen

Add a dedicated screen component:

- `src/components/screens/LocationHubScreen.tsx`

Responsibilities:

- render location background
- render present-character interaction anchors
- render inspect/travel options
- surface current location name and summary
- provide return-to-map action

### Existing screens affected

- `App.tsx`: route Overworld / Hub / Dialogue cleanly
- `OverworldScreen.tsx`: select hub destination, not necessarily direct story
- `DialogueScreen.tsx`: on end, return to hub by default

## Minimal first implementation

We do not need the full final system immediately.

### Phase 1

- support one hub
- support one or two clickable character anchors
- support one inspect action
- scene end returns to hub
- text fallback list always visible

### Phase 2

- multiple hubs
- unlockable interactions
- district-internal travel
- richer presence changes

### Phase 3

- dynamic character presence by time/state
- broader side-story use
- more spatially expressive hub art

## Recommended file additions

- `src/content/locationHubs.ts`
- `src/components/screens/LocationHubScreen.tsx`
- likely `src/stores/gameplayStore.ts` or similar
- tests for the new store

Possible later:

- content mapping from `interactionId` to story launch target
- helper engine for hub availability derivation

## Open questions

- Should `currentHubId` live in a new store or inside `navigationStore`?
- Do we need district-level hubs and sub-hubs, or just hubs?
- What is the cleanest authored representation for launching a specific encounter in Ink?
- Should some inspect actions grant evidence directly without entering full dialogue mode?

## Recommendation

Implement this system before writing large amounts of district dialogue content.

The current Overworld → Scene → Overworld loop is too rigid for the investigation design we have approved. A Location Hub layer is the right general-purpose abstraction for:

- talking to present characters
- revisiting places
- unlocking deeper access
- letting scenes end back in the room rather than back on the city map
