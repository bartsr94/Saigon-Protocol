# Saigon Protocol — Architecture Document

*Companion to SEA_CYBERPUNK_GDD.md. Covers technical structure only — no lore here.*

---

## 1. Tech Stack & Project Setup

| Layer | Choice | Rationale |
|---|---|---|
| Language | TypeScript (strict mode) | Non-negotiable given the project's existing conventions; catches state-shape mistakes early in a data-heavy game. |
| UI Framework | React 18 | Matches the stack already proven out on Children of the Ashmark — same component/hook patterns apply directly. |
| Build tool | Vite | Fast iteration, standard pairing with React + TS. |
| State management | Zustand | Same reasoning as above — familiar, minimal-boilerplate, plays well with the simulation/UI split described below. |
| Styling | Tailwind CSS | Consistency with existing stack. |
| Narrative authoring | **inkjs** | Handles branching dialogue/prose with conditionals and variables far better than hand-rolled TS would; compiled `.ink` files ship as JSON and run via the inkjs runtime in-browser. |
| Deployment target | Static site, client-side only | Pure browser game, no backend required for v1. Saves live in browser storage (see §5, to be detailed in a later pass). |
| Package management | npm | Consistency with existing projects. |

**Stack confirmed** after the design pivot toward a Celestial Return / Disco Elysium–style narrative RPG. The pivot actually *strengthens* the fit: dropping the Cepheus character sheet and the combat system removes the two heaviest unbuilt subsystems, while inkjs's native support for conditional/variable-gated choices maps cleanly onto Insight-gated dialogue options. No stack changes were needed.

---

## 2. High-Level System Overview

Six systems, each with a single clear responsibility. (Note the reduced scope versus the pre-pivot design: the Cepheus character sheet and the combat system are both gone. Combat/tactical exploration is a **distant future** consideration — Underrail: Expedition–style — explicitly out of scope for v1 and not designed for here.)

- **Overworld/Navigation Layer** — presents the set of available locations and tracks which are unlocked, handing off to the Story Engine when one is selected. Rendered as a Celestial Return–style illustrated **diorama with clickable hotspots** rather than a literal traversable map; underlying state is still just a set of unlocked location IDs plus per-location metadata, so the model is presentation-agnostic (could fall back to a card list). No positional/pathfinding state.
- **Story Engine** — wraps the inkjs runtime. Each location owns one or more compiled `.ink` files representing its available scenes/events. Drives the text and choices the player sees and holds all *narrative* branching and flags. Insight-gated choices are expressed as ink conditionals reading Insight values exposed to the ink runtime.
- **Insight System** — the seven Insights (The Ledger, The Graft, Muscle Memory, Root, Static, The Hustle, The Mask). Single source of truth for check modifiers, and the source of the personified "voice" interjections. Replaces the old character sheet entirely. Holds current level per Insight plus any temporary modifiers.
- **Check Resolution Engine** — the mechanical core: `2d6 + Insight modifier vs. target number`. Handles the doubles rule (natural 12 always succeeds, natural 2 always fails) and the White-check (retriable) vs. Red-check (one-shot) distinction. Pure, deterministic-given-its-inputs functions — the single place any dice math lives.
- **Save/Persistence Layer** — serializes Insight state, ink story state (inkjs exports/restores story state as JSON natively), character-creation choices, and global/world flags into browser storage.
- **Voiceover/Audio Layer** — plays pre-generated **ElevenLabs** voice clips for a *curated subset* of lines (character intros and greetings in v1, not full dialogue). Clips are generated ahead of time as static audio assets, not synthesized live in-browser — see §7 for the pipeline and rationale. This layer maps a line ID to an audio file, handles playback/interrupt, and respects a global voice toggle. It is a consumer of the Story Engine (it reacts to which line is being shown), never a driver of narrative state.

Rendering is deliberately not listed as a "system" in its own right — React components are consumers of the above, not owners of any logic.

Character creation is a **flow, not a runtime system** — a one-time sequence (archetype pick → free-point spend → backstory blurb) that writes starting values into the Insight System and sets some initial narrative flags. It doesn't need its own persistent store beyond recording the chosen archetype for later recognition-tag checks.

---

## 3. State Management & the Core Architectural Rule

**Simulation logic stays separate from UI rendering — no exceptions.** This is the same rule that governs Children of the Ashmark, Red Horizon, and World Orogen, and it applies just as strictly here: dice math, character stat calculations, and ink story state never live inside a React component or JSX. Components read from stores and dispatch actions; they never compute a roll or mutate a stat directly.

**Proposed Zustand store split:**

- `insightStore` — the seven Insights: current level each, plus any active temporary modifiers, plus the chosen archetype (for recognition-tag lookups). Also holds the **wellbeing tracks** (Composure, Vitality) — current and max values — since max pools may derive from Insight levels (GDD §3), keeping the derivation in one place. Replaces the old `characterStore`. Single source of truth for anything a check or damage event reads. *(If wellbeing logic grows, it can split into its own `wellbeingStore` later — but the Insight coupling argues for keeping them together initially.)*
- `storyStore` — wraps the active inkjs `Story` instance; exposes current text, current choices, and relevant ink variables to the UI as read-only derived state.
- `navigationStore` — unlocked locations, currently selected location, overworld-level flags.
- A `saveStore` / persistence utility that orchestrates serializing the above into one save blob (full design deferred to §5).

(No `combatStore` — combat is out of v1 scope.)

**Voiceover** doesn't need a full store — a lightweight `audioStore` (or a small hook) tracks the global voice toggle and the currently-playing clip so it can be interrupted when the player advances. The line-ID → audio-file lookup is a static manifest loaded at boot, not persistent state.

**The ink ↔ TypeScript boundary:** ink handles prose and narrative branching only. Anything requiring dice or Insight lookups happens in TypeScript, called *from* ink via `EXTERNAL` function declarations — e.g., an ink choice triggers a check by calling a TS function that reads `insightStore`, rolls `2d6 + modifier` against the target number, applies the doubles rule, records the attempt (so a Red check can't be retried), and returns a pass/fail result ink branches on. Insight *values* are also pushed into ink variables so that choices can be gated/shown conditionally (`{ledger >= 3: ...}`) without a function call. This keeps all dice math in one testable place instead of duplicated inside ink's variable system, and gives the Check Resolution Engine exactly one implementation.

**White vs. Red check bookkeeping** lives on the TS side, not in ink: the resolution engine (or a thin wrapper store) tracks which Red checks have been consumed and which White checks are currently retriable given world state. Ink just asks "can I pass this check?" and renders the result.

**Wellbeing damage/healing** also crosses the boundary via `EXTERNAL` functions: ink content signals damage or healing (e.g. `~ damage_composure(2)`), which calls a TS handler that mutates the wellbeing tracks in `insightStore`, checks for a zero/fail-state, and — if a track hits zero — signals the game-over/break flow. Ink never owns the death check; it only declares the damage. This keeps the fail-state logic in one authoritative place and lets the UI animate the change (per UI doc §3).

---

## 4. Insight System

The seven Insights (`src/content/insights.ts`) are the only character stat: no
separate attributes, skills, or equipment sheet. Each has an id, display name,
tagline (its narrative "voice"), a placeholder identity color, and a
**domain** — `physical` (Graft, Muscle Memory) or `mental` (the other five) —
which drives the wellbeing derivation below. `insightStore.levels` holds the
current level per Insight; that level *is* the check modifier, unmediated —
see §3's ink↔TS boundary and `checkResolution.ts`'s `resolveCheck(modifier,
targetNumber)`.

**Range**: `INSIGHT_MIN = 1`, `INSIGHT_MAX = 6` (`content/insights.ts`).
Levels are clamped to this range everywhere they change.

**Starting values are set once, at Character Creation, and don't change for
the rest of the run:**

- Each of the six archetypes (`content/archetypes.ts`) names a `strength` and
  `weakness` Insight (or neither, for Boring Cop) and gets a baseline spread
  from `baselineFor()`: every Insight starts at a default of 2, except the
  named strength (4) and weakness (1).
- The player then spends a **free-point pool** — 3 points for the five
  story archetypes, 6 for Boring Cop (a flat, no-strength/weakness build
  meant to be fully custom) — one point per `spendFreePoint(id)` call, raised
  on any Insight up to `INSIGHT_MAX`. `refundFreePoint(id)` reverses a spend
  but refuses to drop a level back below that archetype's own baseline for
  that Insight — points can only be reallocated *above* what the archetype
  already grants, never taken out of its defining strength/weakness.
- Confirming Character Creation locks these in; `insightStore` has no
  in-play mechanism to earn or spend further points. Leveling up mid-run
  (XP, investigation rewards, etc.) does not exist in v1 — the Insight
  sheet a player finishes chargen with is the one they play the whole run
  with, aside from wellbeing tracks moving via damage/healing.

**Temporary modifiers do not exist.** Earlier design language in §2/§3
("plus any active temporary modifiers") described headroom for future
narrative effects — injury, exhaustion, drugs — stacking a bonus/penalty on
top of a level. No such mechanism was built for v1: `insightStore.levels` is
the single number `resolveCheck` reads for a given Insight, full stop. If
temporary modifiers are ever added, they'd need their own field distinct
from `levels` so a save/restore doesn't have to guess which part of a
level was "real."

**Wellbeing pools derive from Insight levels** (`content/wellbeing.ts`),
recomputed on every level change so current values clamp down if a max
shrinks (`clampToNewMax` in `insightStore.ts`):
- Vitality max = `BASE_VITALITY (4)` + sum of the two physical Insights
  (Graft + Muscle Memory).
- Composure max = `BASE_COMPOSURE (4)` + (sum of the five mental Insights,
  divided by 3 and rounded up) — the division keeps Composure from dwarfing
  Vitality's range given it draws from five Insights against Vitality's two.

All of the numbers above (`BASELINE_DEFAULT/HIGH/LOW`, free-point pool
sizes, `BASE_VITALITY`/`BASE_COMPOSURE`, the ÷3 divisor) are flagged
`PLACEHOLDER` at their source as GDD §3 tuning-pass items — the *mechanism*
is settled and wired end-to-end, but the specific values are expected to
move during balance passes, not a decision this section is locking in.

---

## 6. Content Pipeline

Settled design in `docs/CONTENT_PIPELINE_SPEC.md`. Each Overworld location
(`content/locations.ts`) owns exactly one `.ink` file at
`content/ink/<locationId>.ink`, compiled to a sibling `<locationId>.json` —
the actual runtime asset `storyStore.loadStory()` consumes.
`src/content/locationStories.ts` maps `LocationId` to its compiled JSON, and
`OverworldScreen.handleSelect` loads from that map instead of every location
sharing the `demo.ink` fixture, as it did before this section existed.

**Compiling**: `npm run compile:ink` runs `scripts/compile-ink.mjs`, which
walks every `content/ink/*.ink` and writes its sibling `.json` via
`inkjs/full`'s `Compiler` — a real, committed tool replacing the previous
one-off-script folklore. It's a manual step, not a build-time or pre-commit
hook: a stale `.json` after an `.ink` edit is a real hazard a content author
has to remember, same as before this pipeline existed, just now with a
reliable command instead of an ad hoc script.

**Check definitions (target number, White/Red risk) live inline in the
`.ink` source**, via each choice's own `roll_check(insight, targetNumber,
checkId, risk)` call — not a separate TS-side registry. This was the open
half of the original "Next up" bullet; it's resolved by codifying the
convention `demo.ink`/`checkpoint.ink` already use rather than inventing
something new. The one rule this imposes on content authors: `checkId`
strings are read against a single flat `insightStore.consumedRedChecks` set
shared by whatever story is currently loaded, with no per-location
namespacing in code, so a `checkId` must be unique across *all* content, not
just within its own file — enforced by convention (prefixing with the
scene/location name, e.g. `"checkpoint-jump-queue"`), not by any runtime
check.

A location's `.ink` file is presently singular — "one or more compiled `.ink`
files" per §2 (multiple scenes/events, revisit variations, branching by
world state) is intentionally not built yet; nothing has needed it before a
real content pass does.

---

### Key Architectural Decisions (running log)

- **inkjs owns narrative branching; TypeScript owns all mechanical resolution.** Ink never rolls its own dice — it calls out via `EXTERNAL` functions, and reads Insight values via pushed ink variables for choice-gating.
- **Insight system replaces the character sheet.** Seven personified Insights serve as both check modifiers and narrative voices. No attributes/skills/equipment sheet.
- **Resolution is Disco Elysium–style, not Celestial Return–style.** `2d6 + Insight vs. TN`, doubles decisive, no consumable dice currency. White checks retriable, Red checks one-shot.
- **Combat and tactical exploration are out of v1 scope** — a distant, Underrail: Expedition–style future consideration, deliberately not designed for now. This is the single biggest scope reduction from the pre-pivot design.
- **Overworld is a diorama-with-hotspots presentation over a flat unlocked-location model** — presentation-agnostic, so it can degrade to a card list if needed.
- **Character creation is a flow, not a runtime system** — writes starting Insight values, records archetype, sets initial flags.
- **React + Zustand + Tailwind + Vite + inkjs**, unchanged through the pivot.
- **Voiceover via pre-generated ElevenLabs clips, curated not comprehensive.** Intros/greetings voiced in v1 to establish character; most lines stay text-only. Clips are baked to static assets at build/author time — no live API calls from the shipped game (avoids per-play cost, latency, key exposure, and network dependence). See §7.
- **Wellbeing is a Disco-style two-track fail-state system** (Composure/Vitality), driven by narrative damage through the ink↔TS boundary. Zero in either track ends the run. Max pools may derive from Insights, so the tracks live in `insightStore` for now. Death-check logic is TS-authoritative; ink only declares damage.
- **Strict simulation/UI separation**, consistent with every other project in the portfolio.
- **Story Engine implemented**: `storyEngine.ts` (pure, store-agnostic ink↔TS binding, mirrors `checkResolution.ts`'s testable style) + `storyStore.ts` (Zustand, owns the active `Story` instance). Concrete `EXTERNAL` contract: `is_red_check_consumed(checkId)` lets ink gate whether a Red-check choice is even offered; `roll_check(insight, targetNumber, checkId, risk)` resolves it and returns pass/fail to ink, while the full `CheckResult` (dice, doubles tier) is captured TS-side via a callback for UI use — ink itself only ever needs the boolean. `damage_vitality`/`heal_vitality`/`damage_composure`/`heal_composure` are the wellbeing `EXTERNAL`s. Insight levels + archetype are pushed into ink globals (explicit snake_case map, e.g. `muscleMemory` → `muscle_memory`) and kept live-synced via a store subscription for the run; the sync skips any variable a given story didn't declare, so minimal/test stories don't need to declare the full set. Production code only ever imports the lean `Story` runtime from `inkjs` — `Compiler` (from `inkjs/full`) is a content-authoring-time tool only (used via a one-off scratch script whenever `demo.ink` changes, to produce `content/ink/demo.json`), never shipped. `content/ink/demo.ink` is a throwaway wiring fixture, not real narrative content, and doesn't constitute the real §6 content pipeline.
- **Navigation/Overworld Layer implemented**: `navigationStore.ts` (Zustand) tracks `unlockedLocationIds`/`selectedLocationId` against a static `locations.ts` content module (placeholder location list — flavor-light dev fixtures, not real GDD locations, same status as `demo.ink`). Deliberately has no knowledge of `storyStore`/inkjs, keeping it single-responsibility; the Story Engine handoff ("selecting a location loads its story") happens at the component layer in the new `NavigationHarness` dev component, which renders locations as a card list — the presentation-agnostic fallback the architecture doc calls for, not the eventual illustrated-diorama treatment. Every location currently hands off to the same placeholder `content/ink/demo.json` used by the Story Engine task, since real per-location content loading is §6 (still open). `App.tsx` swaps between `NavigationHarness` and `StoryHarness` based on `selectedLocationId`; `StoryHarness` gained a "Return to Overworld" exit (`navigationStore.returnToOverworld()` + `storyStore.reset()`) and dropped its own self-load button now that Navigation drives loading. Full settled design captured in `docs/NAVIGATION_OVERWORLD_SPEC.md`.
- **Visual style system implemented** per `docs/UI_VISUAL_STYLE_SPEC.md`: Tailwind `@theme` tokens (chrome/semantic colors, cut-corner sizes) in `index.css`, self-hosted Orbitron/Rajdhani, and a `src/components/ui/` primitive set (`Panel`, `CyberButton`, `PipTrack`, `InsightChip`, `ChoiceRow`, `CheckResultBlock`, `GlitchText`, `NeonSlider`, `NeonCheckbox`) — pure/presentational, no store imports.
- **Real screens built on top of those primitives**, replacing the dev harnesses in `App.tsx`'s render tree (the harness files themselves stay in `src/components/dev/` as standalone manual-testing scaffolding — the check-tester UI in particular has no equivalent in real UI): `TitleScreen`, `ArchetypePicker` (archetype-select only — Character Creation's free-point-spend/backstory steps and the separate Character/Insights overlay are still unbuilt, out of scope for this pass), `OverworldScreen`, `DialogueScreen`, `SettingsOverlay`, `CasefileOverlay`, all under `src/components/screens/`. Two new stores route between them: `uiStore.ts` (`screen: 'title' | 'chargen' | 'game'` + `activeOverlay`, single-responsibility the same way `navigationStore` is) and `settingsStore.ts` (audio levels, voice toggle, text speed, Reduce Motion/High Contrast/Large Text — session-only, since Save/Persistence (§5) doesn't exist yet). Reduce Motion/High Contrast/Large Text are real, wired effects (motion gated via props into `GlitchText`/`PipTrack`, high contrast via a `filter` on the app root, large text via scaling `<html>`'s root font-size so every rem-based Tailwind size follows) — not decorative checkboxes. The Pause/System Menu screen (§2.7) wasn't built separately; the nav rail's Menu button opens Settings directly, since there's no save/load to host yet.
- **DialogueScreen's scrollback log is screen-local state, not storyStore state**: `storyStore.currentLines` only ever holds "the lines since the last choice" (Architecture §3's `advance()`), so `DialogueScreen` accumulates each new batch into a local transcript itself, keyed off the `Story` instance identity to reset per-scene. If another screen ever needs the same transcript, promoting this into `storyStore` is the right move — it wasn't done now to avoid changing tested store shape for a single caller. Fixed alongside this: `storyStore.lastCheckResult` used to persist across turns that rolled no check, so a check result could appear to belong to unrelated later text; `advance()` now clears it at the start of each pass.
- **Ink content-tagging convention implemented** (UI_DESIGN §4/§5, resolves the other half of the §6 open item): settled design in `docs/INK_CONTENT_TAGGING_SPEC.md`. `src/engine/contentTags.ts` — pure, store-agnostic, mirrors `checkResolution.ts`'s style — parses raw ink tag strings (`# key: value`) into `LineSpeaker` (`narrator` / `npc:<npcId>` / `insight:<insightId>`) and `ChoiceTagInfo` (`insight`, `check: white|red`, `locked: <reason>`), falling back gracefully on unrecognized ids instead of throwing. `storyStore`'s `currentText`/`currentTags` (one flat pair per `Continue()` batch) became `currentLines: { text, speaker }[]` — tags are read right after each line's own `Continue()` call, since a batch can mix narrator/NPC/Insight lines that each need their own speaker. `DialogueScreen` renders each line per its speaker (plain paragraph / NPC name row / `InsightChip` header) and follows the center-stage portrait to the most recent NPC speaker tag; each `ChoiceRow` gets its tag props from `parseChoiceTags(choice.tags)`. One inkjs subtlety the spec calls out: `Choice.tags` only populates from tags written **inside** the choice's `[brackets]` — a tag placed after the closing bracket attaches to the next line of output instead, not to the choice.
- **`StoryHarness` dev component removed**: it was already orphaned (superseded by the real `DialogueScreen`, not referenced from `App.tsx`) and its `story.currentText` usage no longer compiles against the `currentLines` shape above. `NavigationHarness`/`InsightHarness` are untouched.
- **Character Creation is now the full three-step wizard** (UI_DESIGN §6.2 / GDD §4): `CharacterCreationScreen` orchestrates local step state over `ChargenArchetypeStep` → `ChargenFreePointsStep` → `ChargenConfirmStep`, superseding the archetype-select-only `ArchetypePicker` (removed). Archetype select still commits immediately to `insightStore` as before; free-point spend and refund wire directly to the store's existing `spendFreePoint`/`refundFreePoint` (no new store logic needed — the "expensive to undo below baseline" rule was already enforced there). Confirm adds a name field, backed by a new `insightStore.playerName`/`setPlayerName` (character identity, same tier as `archetype`) — "Begin" is disabled until a name is entered.
- **Character/Insights overlay implemented** (UI_DESIGN §6.4): `CharacterOverlay` — portrait, name, archetype + backstory, then all seven Insights with color, current-level pips, tagline, and a Strength/Weakness tag where the active archetype names one. `uiStore.OverlayId` gained `'character'`; `NavRail` gained a `CHAR` button, now rendered first to match the reference screenshot's Char/Case/Map/Menu order (previously omitted as a dead button since nothing existed to open).
- **Portrait art convention established**: `PortraitFrame` (new `src/components/ui/` primitive) renders the angular corner-cut avatar chrome UI_VISUAL_STYLE_SPEC §5.1 calls for, and falls back to initials on a missing/failed image rather than a broken-image icon — art can land incrementally. Player archetype portraits are `ArchetypeDefinition.portraitSrc` → `public/portraits/archetypes/<archetypeId>.png`; used by `ChargenArchetypeStep`, `ChargenConfirmStep`, `CharacterOverlay`, and `DialogueScreen`'s HUD chip (replacing its old hand-rolled initials box). A new minimal `content/npcs.ts` (mirrors the `archetypes.ts` shape) holds NPC identity + `public/portraits/npcs/<npcId>.png`; `DialogueScreen`'s center stage now swaps to its one entry, Mei Hong, driven by the real `# speaker: npc:meiHong` line tag in `demo.ink` (see the content-tagging convention bullet below) rather than a hardcoded test render.
- **§4 Insight System detail drafted**, documenting the already-implemented mechanism rather than changing it: starting values are archetype baseline (default 2, strength 4, weakness 1) plus a chargen-only free-point pool (3, or 6 for Boring Cop), locked in at Character Creation confirm with no in-play leveling. Wellbeing max pools derive from Insight levels per `content/wellbeing.ts`. Resolved the open "temporary-modifier model" question: no such mechanism exists — `insightStore.levels` is the sole check modifier `resolveCheck` reads; the earlier "active temporary modifiers" language in §2/§3 was headroom for a future feature (injury/exhaustion/drug effects), never built for v1.
- **Save/Persistence Layer implemented**: settled design in `docs/SAVE_PERSISTENCE_SPEC.md`. A pure `engine/saveEngine.ts` (save-blob shape, `parseSaveBlob`, `summarizeSlot`, mirroring `storyEngine.ts`'s pure/impure split) plus a `saveStore.ts` Zustand layer that owns all `localStorage` I/O. One system-managed Autosave slot (overwritten at two checkpoints: returning to the Overworld, and selecting a location) plus player-named manual slots (create-new or overwrite), scanned directly from `localStorage` keys rather than kept in a separate index. `insightStore`/`navigationStore` each gained a `hydrate()` bulk-restore action; `storyStore.loadStory()` gained an optional saved-ink-state param that calls `story.state.LoadJson()` instead of `advance()` — restoring mechanical state (choices, Insight values, wellbeing, consumed Red checks, story position) exactly, though the last shown batch collapses to a single block on restore rather than its original per-line speaker breakdown, since ink's serialized state doesn't preserve that per-`Continue()` breakdown (a documented, deliberate simplification, not a bug). `TitleScreen`'s Continue and a new `Save_Data` section in `SettingsOverlay` (per UI_DESIGN §6.6, which already scoped save/load slots to the System/Settings overlay) are the only UI surfaces — `saveStore` itself has no knowledge of `uiStore`, same seam `navigationStore`/`storyStore` already use. `settingsStore` (audio/accessibility prefs) stays session-only, a deliberately separate follow-up.
- **Intro scene implemented** — the game's first real narrative content, not a throwaway fixture: settled design in `docs/INTRO_SCENE_SPEC.md`. `content/ink/intro.ink` (+ compiled `intro.json`) is the Case #1 cold-open (squad-car drive from Cholon into District 4, arrival at a small Aveline Biogenetics lab, first meeting with Mei Hong), using the content-tagging convention's Insight interjections (`ledger`/`root`/`static`, gated the same way `demo.ink`'s `muscle_memory >= 3` already is) and declaring no `EXTERNAL`s at all, since this scene deliberately has no checks or wellbeing calls. Confirming Character Creation now calls `storyStore.loadStory(introStoryJson)` alongside the existing `goToGame()` — no new `uiStore` screen value needed, because `App.tsx`'s render discriminator changed from `navigationStore.selectedLocationId` to `storyStore.story`'s presence: `selectedLocationId` was only ever a proxy for "is a story active" because every prior active story came from selecting a location, and the intro breaks that coincidence (an active story with no location). Leaving the intro reuses `DialogueScreen`'s existing nav-rail "return to Overworld" exit unchanged, which also means the Save/Persistence Layer's first autosave checkpoint now naturally fires the moment the intro ends — no special-casing needed anywhere in either system.
- **Content-tagging convention gained a `background` line tag** (`docs/INK_CONTENT_TAGGING_SPEC.md`'s Line tags table), independent of `speaker` — a line can set the center-stage backdrop with or without also tagging a speaker. New `content/backgrounds.ts` (same shape as `content/npcs.ts`: `BackgroundId` union + `_IDS` array + `imageSrc` pointing at `public/backgrounds/<file>.png`); `contentTags.ts` gained `parseLineBackground` (same graceful-fallback-to-null behavior as an unrecognized `npcId`); `StoryLine` gained a `background: BackgroundId | null` field alongside `speaker`. `DialogueScreen` tracks `activeBackgroundId` the same way it already tracks `activeNpcId` (most recent tag seen, persists across batches until changed or the scene resets) and renders it as a dimmed full-bleed image behind the HUD/portrait layer in the center stage — the "location establishing art" slot UI_DESIGN §3 already called for. First real use: `intro.ink`'s lab-exterior line tags `# background: avelineLabExterior`, art file `public/backgrounds/aveline-lab-exterior.png` (not yet committed — a `.gitkeep` holds the directory; the backdrop simply doesn't render until that file lands, same missing-art tolerance `PortraitFrame` already has).
- **§6 Content pipeline drafted and implemented**: settled design in `docs/CONTENT_PIPELINE_SPEC.md`. `checkpoint`/`noodleStall`/`deltaSquat` each gained their own `content/ink/<locationId>.ink`, compiled to a sibling `.json` via a new committed `scripts/compile-ink.mjs` (`npm run compile:ink`), replacing the informal one-off-script compile step and the "every location shares `demo.ink`" placeholder wiring. `src/content/locationStories.ts` maps `LocationId` to its compiled JSON; `OverworldScreen.handleSelect` reads from it instead of a hardcoded `demoStoryJson` import. Resolved the open "where check definitions live" question: inline in each `.ink` file's own `roll_check(...)` call, no separate registry — codifying the convention `demo.ink` already used, plus the `checkId`-must-be-globally-unique naming rule that follows from `insightStore.consumedRedChecks` being one flat set with no per-location namespace.

### Superseded (kept for history)

- ~~Full Cepheus character sheet + dice-resolved combat as core v1 systems.~~ Replaced by the Insight/check design above after the pivot to a Celestial Return / Disco Elysium–style narrative RPG. The combat-UI open question (full-screen vs. inline) is moot for now, since there is no v1 combat.

---

*Next up (open, not yet drafted):*
- *§7 Voiceover pipeline — line-ID naming convention, which lines get voiced, ElevenLabs generation workflow, audio-asset manifest format, playback/interrupt behavior.*
- *Later, out of current scope: exploration/combat layer if and when the project grows toward the Underrail: Expedition reference.*
