# Live Map Editor Spec

*Working implementation spec for extending the dev-only in-game text editor (`src/components/debug/EditableText.tsx`, `vite-plugins/debugTextEditPlugin.ts`) to structural map editing. Production-planning document, not final canon.*

## Goal

While actually standing in a Location Hub or District Street screen (`HubGridView.tsx` / `DistrictStreetView.tsx`), let a dev add/remove/repaint tiles and edit POI/door content for **that** hub/street, and have Save write the result straight back to `src/content/locationHubs.ts` / `src/content/districtStreets.ts` — the same "live, writes to disk, dev-only" model the text editor already established, extended from single-field edits to whole-record edits.

**Explicitly out of scope:** creating brand-new locations (new `LocationId`/`HubId`/`DistrictId`, new `.ink` files, new NPCs). Editing only ever targets a record `id` that already exists in the target file. New-location creation stays a separate, agent-driven task — the interdependent string-literal ID unions across `locations.ts`/`locationHubs.ts`/`districtStreets.ts`/`locationStories.ts` make partial automated writes there much riskier than editing an existing, already-consistent record.

## Relationship to other docs / existing code

- **Direct precedent:** the text editor pass just shipped (`vite-plugins/debugTextEditPlugin.ts`, `src/stores/debugTextEditStore.ts`, `src/components/debug/EditableText.tsx`) — same dev-only (`apply: 'serve'`), same "refuse rather than guess" failure mode, same allow-listed target files.
- **Reused wholesale:** `src/components/screens/MapBuilderTool.tsx` already has all the grid-painting and POI/door/interaction editing UI this needs — today it only produces a copy/paste JSON export. This spec extracts that UI into a shared, reusable piece rather than rebuilding it.
- **Architecture §7** (Location Hub Layer / District Street Layer) — this spec doesn't change either layer's runtime shape, only how their static content gets authored.

## Design

### 1. Extract `MapBuilderTool`'s editor into a reusable panel

`MapBuilderTool.tsx`'s state (grid, pois, doors, entryTile, brush, etc.) and handlers (paint/add/remove/update) get pulled into a new `MapEditorPanel.tsx` component, parameterized by:
- `initialState` (grid/pois/doors/entryTile/etc.) — defaults to blank for today's tool, or seeded from a real record for the live editor.
- `onSave(record)` — today's `MapBuilderTool` passes a copy-to-clipboard handler (unchanged behavior); the live editor passes a POST-to-disk handler.

`MapBuilderTool.tsx` becomes a thin wrapper: blank initial state + copy/paste `onSave`, preserving its exact current behavior. No regression to the existing DebugOverlay tool.

### 2. Seed from an existing hub/street

New helpers (`hubToBuilderState()`, `streetToBuilderState()`) reverse `MapBuilderTool`'s existing `buildExport()` mapping:
- `layoutRows` chars → `TileKind[][]`, with `'o'`/`'d'` cells resolved back to an underlying `'floor'` tile (POIs/doors always sit on floor, per the existing char-derivation logic in `buildExport()`).
- `pois[]` / `doors[]` copied through with their real ids intact (not regenerated) — only tiles added during the session get fresh `poi-N`/`door-N`-style ids, same as `MapBuilderTool` does today for brand-new entries.
- `entryTile`, `visionRadius`, `backgroundId`, `name`, `blurb`, `id` copied through directly.

### 3. Live entry point

A dev-only "Edit Map" button in `HubGridView`'s and `DistrictStreetView`'s AR-scan panel (next to "Return to Map"), visible only from the outer grid view — **not** reachable from inside an active POI interaction/`DialogueScreen`, to avoid editing state mid-scene. Clicking it opens `MapEditorPanel` in a full-panel overlay (same sizing precedent as `DebugOverlay`), seeded from the current hub/street.

### 4. Save mechanism — whole-record replace

Single-field replace (the text editor's approach) doesn't work here — a map edit can touch many fields plus array shape (added/removed POIs). Save instead does a **whole-record replace**, which needs two new pieces:

**`vite-plugins/mapRecordSerializer.ts`** (new, pure, unit-tested — the highest-risk/most novel part of this feature, so it gets built and tested in isolation before any wiring):
- `serialize(value): string` — turns a plain JS object/array/string/number/boolean into a TS object-literal string matching this codebase's conventions: unquoted identifier keys, single-quoted strings (reusing the text plugin's apostrophe-swap sanitizer), `undefined` optional fields omitted rather than emitted as `null`, stable indentation.
- `replaceRecordById(source, id, newRecordText): string` — finds `` `${id}: {` `` (or throws if not found, or found more than once) at the top level of the source text, brace-counts forward to the matching `}`, and returns the source with that span replaced. Refuses (throws a descriptive error) on any ambiguity — same fail-closed philosophy as the text plugin's occurrence check.

**`vite-plugins/debugMapEditPlugin.ts`** (new, dev-only middleware, `apply: 'serve'`): `POST /__debug/save-map-record` with `{ file: 'locationHubs' | 'districtStreets', id: string, record: object }`. Validates `file` against a 2-entry allow-list (deliberately excludes `locations.ts` — that file isn't map-shaped), validates `id` already exists in that file, calls the serializer, writes the file, returns ok or a clear rejection reason.

### 5. Accepted risk

Unlike the text editor's single-line matches, a malformed whole-record write is a bigger blast radius if the serializer or brace-matcher has a bug. Mitigations kept deliberately lightweight rather than over-built:
- The serializer ships with its own unit tests (round-trip a real hub/street record and diff).
- The endpoint refuses ambiguous/missing ids rather than guessing.
- No synchronous `tsc` validation on save (too slow for a save-click) — same safety net as hand-editing the file today: Vite's dev overlay surfaces a broken file immediately on next reload, and git is the undo button.

## File impact summary

- `vite-plugins/mapRecordSerializer.ts` (new) + `mapRecordSerializer.test.ts` (new)
- `vite-plugins/debugMapEditPlugin.ts` (new)
- `vite.config.ts` — register the new plugin
- `src/components/screens/MapEditorPanel.tsx` (new) — extracted editor UI/state, parameterized
- `src/components/screens/MapBuilderTool.tsx` — shrinks to a thin blank-seed wrapper around `MapEditorPanel`
- `src/components/screens/mapEditorSeed.ts` (new) — `hubToBuilderState()` / `streetToBuilderState()`
- `src/components/screens/HubGridView.tsx` — "Edit Map" button + overlay wiring
- `src/components/screens/DistrictStreetView.tsx` — same

No changes to `locations.ts`'s schema, `LocationId`/`HubId`/`DistrictId` unions, or any `.ink` content.

## Recommended sequencing

1. Build `mapRecordSerializer.ts` with unit tests (round-trip an existing hub and an existing street record) — de-risk the novel part first, independent of any UI.
2. Build `debugMapEditPlugin.ts` around it, register in `vite.config.ts`.
3. Extract `MapEditorPanel.tsx` out of `MapBuilderTool.tsx` with zero behavior change; manually re-verify the existing copy/paste flow still works identically.
4. Add `mapEditorSeed.ts`'s reverse-mapping helpers.
5. Wire the "Edit Map" button + seeded overlay into `HubGridView.tsx` and `DistrictStreetView.tsx`.
6. Verification gate (`npm run lint`, `npx tsc -b`, `npm test`) plus a live smoke test: edit an existing hub's grid against the running dev server, confirm the file changes correctly and the hub still loads and plays.

## Open questions

- Should Save write immediately on click (matching the text editor's instant feel), or require an explicit confirm step given the larger blast radius of a structural rewrite versus a one-line string swap?
- If a door gets deleted in the editor, its `unlockFlag` reference may go stale elsewhere (casefile flags, other content) — is that the editor's problem to check for, or the same "you could already do this by hand-editing the file" bar the text editor uses?
- Is the AR-scan-panel-only entry point (blocked once you're inside a POI interaction) the right boundary, or should editing also be reachable from inside a POI's interaction list to reposition just that one POI without leaving it?
