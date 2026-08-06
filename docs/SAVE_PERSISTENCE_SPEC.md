# Save/Persistence Layer — Spec

*Settled design, written before implementation. Companion to
`SAIGON_PROTOCOL_ARCHITECTURE.md` §2/§3/§5, which name this system but don't
detail it.*

---

## Problem

Architecture §5 lists the Save/Persistence Layer as one of six core systems —
it "serializes Insight state, ink story state, character-creation choices,
and global/world flags into browser storage." Nothing implements this yet:
Title's Continue button is hard-disabled ("No save data yet"), the Pause/
System Menu was never built as its own screen (UI_DESIGN §2.7 notes the nav
rail's Menu button opens Settings directly "since there's no save/load to
host yet"), and `settingsStore` is explicitly session-only pending this
layer.

## Scope

**In scope:**
- A `saveStore` that can write/read/delete save slots against
  `localStorage`, and a pure `engine/saveEngine.ts` module for the save-blob
  shape and (de)serialization helpers — mirroring the `storyEngine.ts` /
  `storyStore.ts` pure/impure split.
- **Multiple named manual slots** (player-chosen name, create new or
  overwrite an existing one) **plus one system-managed Autosave slot**.
- **Autosave at two checkpoints**: returning to the Overworld, and selecting
  a location. Not on every choice — mid-scene progress between checkpoints
  relies on a manual save if the player wants it, which is exactly what
  named slots are for.
- Wiring: Title screen's Continue (enabled once any save exists, loads the
  most recently written slot) and a new Save/Load section in
  `SettingsOverlay`, per UI_DESIGN §6.6 which already scopes "save/load
  slots" to the System/Settings overlay rather than a separate Pause menu.
- `insightStore`/`navigationStore` gain a `hydrate()` action each;
  `storyStore.loadStory()` gains an optional saved-state parameter.

**Out of scope** (deferred):
- Real per-location `.ink` content (§6, still open) — save/load keeps using
  the same placeholder `content/ink/demo.json` every location already loads,
  the same throwaway fixture the Navigation and Story Engine tasks used.
- Persisting `settingsStore` (audio/accessibility prefs). It's a natural
  companion — session-only pending "this layer" per its own header comment —
  but it's a different concern (always-on preferences vs. a game-run
  snapshot) and doesn't block anything else in this pass. Follow-up, not
  bundled here.
- Save migration across format versions. `SAVE_FORMAT_VERSION` exists so a
  future shape change *can* detect old saves, but a mismatched version is
  just treated as absent (see Design) — no migration code yet, since there's
  only ever been one shape.
- A confirmation dialog before Load overwrites current in-memory progress.
  The player driving Load already knows what they're doing; add a confirm
  step later if it proves to be a footgun in practice.

## Design

### `src/engine/saveEngine.ts`

Pure types + helpers, no `localStorage` access (that's `saveStore`'s job):

```ts
export const SAVE_FORMAT_VERSION = 1
export const AUTOSAVE_SLOT_ID = 'autosave'
export const SAVE_KEY_PREFIX = 'saigon-protocol:save:'

export type SaveSlotKind = 'autosave' | 'manual'

export interface SerializedInsightState {
  archetype: ArchetypeId | null
  playerName: string
  levels: Record<InsightId, number>
  freePointsRemaining: number
  vitality: { current: number; max: number }
  composure: { current: number; max: number }
  consumedRedChecks: string[]        // Set -> array to survive JSON
  failState: 'vitality' | 'composure' | null
}

export interface SerializedNavigationState {
  unlockedLocationIds: LocationId[]  // Set -> array to survive JSON
  selectedLocationId: LocationId | null
}

export interface SaveBlob {
  version: number
  savedAt: number                    // Date.now(), also the slot's display timestamp
  name: string                       // 'Autosave' or the player-given name
  kind: SaveSlotKind
  insight: SerializedInsightState
  navigation: SerializedNavigationState
  /** null when saved with no active scene (e.g. standing on the Overworld). */
  inkStateJson: string | null
}

export interface SaveSlotMeta {
  id: string
  kind: SaveSlotKind
  name: string
  savedAt: number
  playerName: string
  archetypeName: string
  locationName: string | null
}

export function storageKey(slotId: string): string
export function parseSaveBlob(raw: string | null): SaveBlob | null   // corrupt/wrong-version -> null, never throws
export function summarizeSlot(id: string, blob: SaveBlob): SaveSlotMeta // looks up ARCHETYPES/LOCATIONS for display
```

`navigation.selectedLocationId` and `inkStateJson` are always captured and
restored together — either both set (mid-scene) or both `null`/`null`
(Overworld, no active scene). Nothing else produces a save blob, so this
pairing is an invariant, not something callers need to check.

### `src/stores/saveStore.ts`

Zustand store owning `localStorage` I/O. No index file — `refreshSlots()`
scans `localStorage` for `SAVE_KEY_PREFIX`-prefixed keys and parses each
blob directly; save-count stays small enough that this is simpler than
keeping a separate index in sync. Guards every `localStorage` access behind
`typeof localStorage === 'undefined'` (mirrors `settingsStore`'s
`prefersReducedMotion` window guard) so it degrades to a no-op rather than
throwing outside a browser (tests included, unless a slot is stubbed in).

State: `slots: SaveSlotMeta[]` (sorted newest-first), refreshed after every
mutating call.

Actions:
- `autosave()` — no-ops if `insightStore.archetype` is `null` (nothing to
  save yet, e.g. mid-chargen). Otherwise captures current
  insight/navigation/story state and writes it to the fixed
  `AUTOSAVE_SLOT_ID`, always overwriting.
- `saveToSlot(name, slotId?)` — same capture, writes to `slotId` if given
  (overwrite), otherwise a freshly generated id (new manual slot). Same
  archetype guard as `autosave()`.
- `loadSlot(id): boolean` — reads and `parseSaveBlob`s the slot; on success,
  calls `insightStore.hydrate()`, `navigationStore.hydrate()`, and either
  `storyStore.loadStory(demoStoryJson, inkStateJson)` (mid-scene) or
  `storyStore.reset()` (Overworld save). Returns `false` (no mutation) if
  the slot is missing or fails to parse — caller decides what to do (v1
  callers just no-op UI-side; see Out of scope).
- `loadMostRecent(): boolean` — `loadSlot(slots[0].id)` if any exist.
- `deleteSlot(id)`.
- `hasAnySave(): boolean` — for Title's Continue enablement; cheap
  existence check, doesn't require `slots` to be freshly refreshed.

Deliberately has **no knowledge of `uiStore`** — it doesn't call
`goToGame()`/`closeOverlay()` itself. Callers (`TitleScreen`,
`SettingsOverlay`) do that after a successful load, the same way
`navigationStore` stays ignorant of `storyStore` and lets the component
layer own the handoff.

### `insightStore.ts` / `navigationStore.ts`: `hydrate()`

Each store gains one action that bulk-restores its own state from the
matching `Serialized*State` shape (rebuilding `Set`s from the serialized
arrays). Plain `set()` calls, same shape as every other action in these
stores — no new pattern.

### `storyStore.ts`: `loadStory` gains an optional saved-state param

```ts
loadStory: (inkJson: string | Record<string, unknown>, savedStateJson?: string) => void
```

When `savedStateJson` is passed, after constructing the `Story` and binding
the usual `EXTERNAL`s/Insight sync, calls `story.state.LoadJson(savedStateJson)`
instead of running `advance()`. A new `hydrateFromRestoredState()` helper
then populates `currentLines`/`currentChoices`/`canContinue`/`ended` from
the restored `story.currentText`/`currentChoices`/`canContinue` directly,
without calling `Continue()` again (that would advance past the restored
point).

**Known simplification, worth stating plainly:** ink's `state.ToJson()`
collapses the whole "output since the last choice" into one flat
`currentText`/`currentTags` pair — the per-line speaker breakdown that
`advance()` builds live (Architecture §3's content-tagging convention,
`currentLines: { text, speaker }[]`) isn't itself part of ink's serialized
state. So a restored batch renders as a **single block**, tagged from
whatever `currentTags` happens to hold after reload, rather than its
original per-line narrator/NPC/Insight breakdown. This only affects the
cosmetic replay of the most recent turn on load — Insight values, wellbeing,
consumed Red checks, unlocked locations, and the actual `Story` position
(and therefore every choice going forward) are all restored exactly.

### UI wiring

**`TitleScreen.tsx`** — Continue is enabled iff `saveStore.hasAnySave()`;
`onClick` calls `loadMostRecent()`, then (on success) `closeOverlay()` +
`goToGame()`.

**`SettingsOverlay.tsx`** — new `Save_Data` section (matches the existing
`Audio_Matrix` / `Visual_&_Accessibility` naming), full-width below the
existing two-column grid:
- **Save Game** row — name input + "Save New" button, calling
  `saveToSlot(name)`. Only rendered when `uiStore.screen === 'game'`
  (nothing sensible to save from Title/chargen).
- **Slot list** — Autosave first (if present: name, relative timestamp,
  archetype/location summary, Load + Delete), then manual slots newest-first
  (same fields, plus an "Overwrite" button that calls
  `saveToSlot(existingName, existingId)`). Empty state: "No saves yet."
- Load buttons call `loadSlot(id)`, then on success `closeOverlay()` +
  `goToGame()` — same pattern as Title's Continue.

**`OverworldScreen.tsx`** — `handleSelect` calls `saveStore.getState().autosave()`
right after `loadStory()`, capturing the fresh scene's opening state.

**`DialogueScreen.tsx`** — `handleReturnToOverworld` calls
`saveStore.getState().autosave()` right after `returnToOverworld()` +
`resetStory()`, capturing the "on the Overworld, nothing active" checkpoint.

## Verification

- `saveEngine.test.ts`: `parseSaveBlob` round-trips a valid blob and returns
  `null` for malformed JSON and for a version mismatch.
- `saveStore.test.ts` (with a stubbed in-memory `localStorage`, since the
  Vitest environment is `node`, not `jsdom`): `autosave`/`saveToSlot` no-op
  without an archetype; `saveToSlot` creates a new slot vs. overwrites when
  given an existing id; `loadSlot` rehydrates insight/navigation state and
  returns `false` for a missing id; `hasAnySave`/`loadMostRecent` reflect
  what's actually in storage; `deleteSlot` removes it from subsequent
  listings.
- `insightStore.test.ts` / `navigationStore.test.ts`: `hydrate()` restores
  exactly the given shape, including rebuilding `Set`s correctly.
- `storyStore.test.ts`: loading a story, saving `story.state.ToJson()`,
  resetting, then calling `loadStory(json, savedStateJson)` reproduces the
  same `currentChoices`/`canContinue`/Insight-relevant state as before the
  reset (not necessarily the same `currentLines` breakdown, per the known
  simplification above).
- Manual browser pass: start a run, let both autosave checkpoints fire,
  reload the page, confirm Continue restores it; create two named manual
  saves, overwrite one, delete the other, confirm the list reflects it;
  load an Overworld-taken save and confirm it lands on the Overworld, not a
  blank Dialogue screen.
- `npm run lint`, `tsc -b`, and `npm test` clean.
