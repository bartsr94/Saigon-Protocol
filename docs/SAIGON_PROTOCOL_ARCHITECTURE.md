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
in `OverworldScreen.handleSelect`, not inside either store.

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
