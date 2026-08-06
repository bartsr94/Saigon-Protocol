# Content Pipeline — Spec

*Settled design, written before implementation. Companion to
`SAIGON_PROTOCOL_ARCHITECTURE.md` §2/§6 (Story Engine, "Next up: §6 Content
pipeline") and `NAVIGATION_OVERWORLD_SPEC.md`, which explicitly deferred this
work ("Real per-location `.ink` content authoring/loading (§6, the content
pipeline). Every location hands off to the existing placeholder
`content/ink/demo.json`").*

---

## Problem

`OverworldScreen.handleSelect` currently loads the same `content/ink/demo.json`
for every location, regardless of which one was clicked — there's no wiring
from a `LocationId` to its own content. Compiling `.ink` source to the `.json`
the runtime actually loads is also undocumented folklore: `demo.ink`/`intro.ink`
were each compiled by hand with a throwaway Node script, never committed, so
there's no reproducible way to recompile after an edit.

## Scope

**In scope:**
- A real, committed compile script (`scripts/compile-ink.mjs` + `npm run
  compile:ink`) that turns every `content/ink/*.ink` into its sibling
  `.json`, replacing the informal one-off-script workflow.
- One `.ink` file per existing placeholder location (`checkpoint`,
  `noodleStall`, `deltaSquat`), each compiled to its own `.json` and wired so
  selecting that location loads *its* content, not a shared fixture.
- A small `src/content/locationStories.ts` module mapping `LocationId` to its
  compiled story JSON, and `OverworldScreen.tsx` reading from it.
- Settling where White/Red check definitions (target number, risk) live:
  confirms the existing convention — inline in the `.ink` source via
  `roll_check(insight, targetNumber, checkId, risk)` — rather than inventing
  a separate TS-side registry, plus the naming convention that keeps
  `checkId` strings globally unique (see Design).

**Out of scope** (deferred):
- Real GDD-canonical narrative content for these three locations. They stay
  flavor-light placeholders — same status `locations.ts` already documents
  for itself, just no longer all pointing at one shared fixture.
- "A location owns one or more compiled `.ink` files" (Architecture §2's
  wording allows multiple scenes/events per location — branching by world
  state, revisit variations). v1 wiring is one `.ink` per location; a
  multi-scene location is future work once there's a reason to need one.
- A content-authoring watch mode / hot-reload for `.ink` changes. The compile
  script is a manual, explicit step (`npm run compile:ink`), matching how
  Vite itself is a manual `npm run dev` — no filesystem watcher is added.
- `content/ink/demo.ink`/`demo.json` and `content/ink/intro.ink`/`intro.json`
  are untouched. `demo.ink` stays the Story Engine's throwaway wiring
  fixture (`storyStore.test.ts`/`storyEngine.test.ts` depend on its exact
  content); `intro.ink` is separate, actively-developed narrative content
  (`docs/INTRO_SCENE_SPEC.md`) outside this spec's location-table concern —
  neither is renamed, moved, or reworked here.

## Design

### `scripts/compile-ink.mjs`

A dev-time-only Node script (never imported by shipped code — same rule
CLAUDE.md already states for `inkjs/full`'s `Compiler`). Walks
`content/ink/*.ink`, compiles each with `Compiler` from `inkjs/full`, and
writes the sibling `<name>.json` next to it:

```js
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Compiler } from 'inkjs/full'

const inkDir = join(dirname(fileURLToPath(import.meta.url)), '../content/ink')

for (const file of readdirSync(inkDir)) {
  if (!file.endsWith('.ink')) continue
  const source = readFileSync(join(inkDir, file), 'utf-8')
  const json = new Compiler(source).Compile().ToJson()
  writeFileSync(join(inkDir, file.replace(/\.ink$/, '.json')), json)
  console.log(`compiled ${file} -> ${file.replace(/\.ink$/, '.json')}`)
}
```

Wired as `"compile:ink": "node scripts/compile-ink.mjs"` in `package.json`.
Run manually whenever any `.ink` file changes — same manual-step precedent as
`npm run dev`/`npm run build`; there is no build-time or pre-commit hook
forcing recompilation, so a stale `.json` is a real (if easy-to-check) hazard
a content author needs to remember, same as it already was before this spec.

### `content/ink/checkpoint.ink`, `noodleStall.ink`, `deltaSquat.ink`

One flat `.ink` file per location, filename matching its `LocationId`,
compiling to the sibling `.json` of the same name. Each is a short,
self-contained scene consistent with its `locations.ts` blurb, using the
content-tagging convention for any Insight interjections
(`docs/INK_CONTENT_TAGGING_SPEC.md`) — narrator-only content plus optional
Insight lines, no NPC tags (the only defined NPC, Mei Hong, belongs to the
intro scene). `checkpoint.ink` also exercises a White/Red check via
`roll_check`, to prove the mechanism still works end-to-end per-location, not
just in the `demo.ink` fixture; `noodleStall.ink`/`deltaSquat.ink` don't —
a check is optional per scene, not mandatory boilerplate.

**Check definitions live inline in the `.ink` source, not a separate
registry.** A choice's `roll_check(insight, targetNumber, checkId, risk)`
call is the single source of truth for that check's target number and
White/Red risk — co-located with the narrative beat that triggers it, the
same way `demo.ink` and `intro.ink`'s (would-be) checks already work. This
was an open question in the original "Next up" bullet; this spec resolves it
by codifying the existing, already-proven convention rather than building a
new one.

**`checkId` strings must be globally unique across all loaded content.**
`insightStore.consumedRedChecks` is a single flat `Set<string>` shared by
whichever story is currently loaded — it has no per-story or per-location
namespace. The existing convention (`demo.ink`'s `"checkpoint-stare-down"`)
already prefixes each `checkId` with the scene/location it belongs to; this
spec makes that explicit as the rule going forward, e.g.
`"checkpoint-jump-queue"` for a check inside `checkpoint.ink`. Two locations
independently picking the same bare `checkId` (e.g. both using `"talk"`)
would silently cross-consume each other's Red check — the prefix convention
is what prevents that, not any code-level enforcement.

### `src/content/locationStories.ts` (new)

Pure content module, mirrors the `Record<Id, X>` shape convention
(`insights.ts`, `archetypes.ts`):

```ts
import checkpointJson from '../../content/ink/checkpoint.json'
import noodleStallJson from '../../content/ink/noodleStall.json'
import deltaSquatJson from '../../content/ink/deltaSquat.json'
import type { LocationId } from './locations'

export const LOCATION_STORY_JSON: Record<LocationId, Record<string, unknown>> = {
  checkpoint: checkpointJson,
  noodleStall: noodleStallJson,
  deltaSquat: deltaSquatJson,
}
```

Kept separate from `content/locations.ts` rather than adding a field there —
`locations.ts` is pure flavor metadata (name/blurb/unlock flag) with no
existing import-side-effects; folding compiled JSON blobs into it would mix
concerns for no benefit, since `OverworldScreen` is presently the only
consumer of either.

### `src/components/screens/OverworldScreen.tsx` (edit)

`handleSelect` looks up `LOCATION_STORY_JSON[id]` instead of importing and
always loading the shared `demoStoryJson`. No other behavior changes — the
autosave-on-select checkpoint (`docs/SAVE_PERSISTENCE_SPEC.md`) still fires
exactly where it already does.

## Verification

- `src/content/locationStories.test.ts`: every `LocationId` has an entry in
  `LOCATION_STORY_JSON`, and the three entries are not reference-equal to
  each other (a cheap regression guard against silently falling back to one
  shared blob again, which is exactly the bug this spec fixes).
- Existing `storyStore`/`storyEngine`/`navigationStore` suites stay green —
  `loadStory`'s signature and `demo.ink`/`intro.ink` are untouched.
- Manual browser pass: select each of the three Overworld locations in turn
  and confirm each shows its own distinct opening text, not the same drone/
  checkpoint scene three times.
- `npm run lint`, `npx tsc -b`, and `npm test` clean.
