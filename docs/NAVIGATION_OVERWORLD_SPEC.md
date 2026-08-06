# Navigation/Overworld Layer — Spec

*Settled design, written before implementation. Companion to `SAIGON_PROTOCOL_ARCHITECTURE.md` §2/§3, which name this system but don't detail it.*

---

## Problem

Architecture §2 lists the Overworld/Navigation Layer as one of six core systems — it "presents the set of available locations and tracks which are unlocked, handing off to the Story Engine when one is selected." Nothing implements this yet. `StoryHarness` currently self-loads a single hardcoded demo story via its own button, with no concept of multiple locations or an unlock state.

## Scope

**In scope:**
- A `navigationStore` tracking which locations exist, which are unlocked, and which is currently selected.
- A small `locations` content module (placeholder location list — the GDD doesn't name real locations yet).
- A `NavigationHarness` dev component presenting locations as a card list and handing off to the Story Engine on selection.
- Wiring `StoryHarness` and `App.tsx` so the harness swaps between "picking a location" and "in a scene," with a way back.

**Out of scope** (deferred, per architecture doc's "Next up" list):
- Real per-location `.ink` content authoring/loading (§6, the content pipeline). Every location hands off to the existing placeholder `content/ink/demo.json` — the same throwaway fixture the Story Engine task used, not new content.
- Persisting unlocked-location state (§5, Save/Persistence Layer).
- Diorama/hotspot visual presentation (Architecture §2 explicitly calls this "presentation-agnostic" — the model must support falling back to a card list, which is exactly what the dev harness renders; the illustrated-diorama pass is separate future UI work per the UI design doc).

## Design

### `src/content/locations.ts`

Static content module, same convention as `insights.ts`/`archetypes.ts`:

```ts
export type LocationId = 'checkpoint' | 'noodleStall' | 'deltaSquat'
export const LOCATION_IDS: LocationId[] = [...]

export interface LocationDefinition {
  id: LocationId
  name: string
  blurb: string
  unlockedByDefault: boolean
}

export const LOCATIONS: Record<LocationId, LocationDefinition> = { ... }
```

Location IDs/names are flavor-light placeholders (checkpoint, noodle stall, Delta squat) — dev fixtures standing in for real GDD locations, not final content, mirroring how `demo.ink` stood in for real narrative content. One location is `unlockedByDefault: true` (the entry point); the rest start locked to exercise the unlock path.

### `src/stores/navigationStore.ts`

Zustand store, same shape convention as `insightStore.ts`. Deliberately has **no knowledge of `storyStore` or inkjs** — it only owns location existence/unlock/selection state, keeping this system's responsibility singular per Architecture §2. The Story Engine handoff happens at the component layer (`NavigationHarness`), the same seam `StoryHarness` already uses to glue `storyStore` to `insightStore`-derived UI.

State:
- `unlockedLocationIds: Set<LocationId>` — seeded from `LOCATIONS`' `unlockedByDefault` flags.
- `selectedLocationId: LocationId | null`.

Actions:
- `unlockLocation(id)` — adds to the unlocked set (idempotent).
- `selectLocation(id)` — no-ops if `id` isn't unlocked; otherwise sets `selectedLocationId`.
- `returnToOverworld()` — clears `selectedLocationId`.

### `src/components/dev/NavigationHarness.tsx`

Mirrors `InsightHarness`/`StoryHarness`'s Tailwind dark-theme conventions. Renders `LOCATION_IDS` as cards: unlocked locations are clickable buttons, locked ones render dimmed/disabled with a lock indicator. Clicking an unlocked card calls both `navigationStore.selectLocation(id)` and `storyStore.loadStory(demoStoryJson)` — this is the concrete "hand off to the Story Engine" moment from Architecture §2.

### `src/components/dev/StoryHarness.tsx` (edit)

Drops its own "Load demo story" button — loading is now Navigation's responsibility. Adds a "Return to Overworld" button calling `navigationStore.returnToOverworld()` + `storyStore.reset()`. Keeps "Restart" (reloads the same story) as a standalone affordance.

### `src/App.tsx` (edit)

Renders `NavigationHarness` when `navigationStore.selectedLocationId` is `null`, otherwise `StoryHarness` — alongside `InsightHarness` (chargen), unchanged.

## Verification

- `navigationStore.test.ts`: default-unlocked set matches `unlockedByDefault` flags; selecting a locked location is a no-op; unlocking then selecting succeeds; `returnToOverworld` clears selection.
- Existing `storyStore`/`storyEngine` suites stay green — `loadStory`'s signature is unchanged, only its caller moves.
- Manual browser pass: default location is clickable, locked ones are visibly disabled, selecting loads the demo scene, "Return to Overworld" goes back to the card list, "Restart" still works.
- `npm run lint` and `tsc -b` clean.
