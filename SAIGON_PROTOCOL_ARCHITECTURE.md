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

### Superseded (kept for history)

- ~~Full Cepheus character sheet + dice-resolved combat as core v1 systems.~~ Replaced by the Insight/check design above after the pivot to a Celestial Return / Disco Elysium–style narrative RPG. The combat-UI open question (full-screen vs. inline) is moot for now, since there is no v1 combat.

---

*Next up (open, not yet drafted):*
- *§4 Insight System detail — starting ranges, level cap, how leveling is earned, temporary-modifier model.*
- *§5 Save/Persistence Layer detail — save-blob shape, ink state serialization, browser-storage mechanics.*
- *§6 Content pipeline — how `.ink` source is organized per location, compiled, and loaded; where check definitions (TN, White/Red) live.*
- *§7 Voiceover pipeline — line-ID naming convention, which lines get voiced, ElevenLabs generation workflow, audio-asset manifest format, playback/interrupt behavior.*
- *Later, out of current scope: exploration/combat layer if and when the project grows toward the Underrail: Expedition reference.*
