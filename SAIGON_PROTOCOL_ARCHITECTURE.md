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

**Flagging one assumption:** I defaulted to React for the UI layer rather than something lighter, purely on the strength of your existing familiarity and reusable patterns from Children of the Ashmark. If you'd rather go leaner for a text-and-cards-heavy interface, that's an easy pivot — just say so before we build on top of it.

---

## 2. High-Level System Overview

Six systems, each with a single clear responsibility:

- **Overworld/Navigation Layer** — renders the location-card menu, tracks which locations are unlocked, and hands off to the Event/Story Engine when a location is selected. No positional/map state — just a set of unlocked location IDs plus whatever per-location metadata (name, blurb, thumbnail) drives the card display.
- **Event/Story Engine** — wraps the inkjs runtime. Each location owns one or more compiled `.ink` files representing its available events. Drives the text/choices the player sees and holds all *narrative* branching and flags.
- **Character System** — the Cepheus-derived character sheet: attributes, skills, career/lifepath history, equipment. Single source of truth for anything a check or combat round needs to read.
- **Resolution Engine** — the mechanical core: 2d6 + skill + attribute vs. target number for skill checks, shared by both narrative checks and combat rounds.
- **Combat System** — turn-based, dice-resolved encounters. Triggered from within an ink event (see the ink↔TS boundary below), runs its own loop, then returns a result to the story engine.
- **Save/Persistence Layer** — serializes character state, ink story state (inkjs supports exporting/restoring story state as JSON natively), and global flags into browser storage.

Rendering is deliberately not listed as a "system" in its own right — React components are consumers of the above, not owners of any logic.

---

## 3. State Management & the Core Architectural Rule

**Simulation logic stays separate from UI rendering — no exceptions.** This is the same rule that governs Children of the Ashmark, Red Horizon, and World Orogen, and it applies just as strictly here: dice math, character stat calculations, and ink story state never live inside a React component or JSX. Components read from stores and dispatch actions; they never compute a roll or mutate a stat directly.

**Proposed Zustand store split:**

- `characterStore` — the Cepheus sheet: attributes, skills, career history, equipment, condition/health.
- `storyStore` — wraps the active inkjs `Story` instance; exposes current text, current choices, and relevant ink variables to the UI as read-only derived state.
- `combatStore` — active encounter state (combatants, initiative, round number) — populated only while combat is in progress, otherwise empty.
- `navigationStore` — unlocked locations, currently selected location, overworld-level flags.
- A `saveStore` / persistence utility that orchestrates serializing the above into one save blob (full design deferred to §5).

**The ink ↔ TypeScript boundary:** ink handles prose and narrative branching only. Anything requiring dice or character-state lookups happens in TypeScript, called *from* ink via `EXTERNAL` function declarations — e.g., an ink line resolves a skill check by calling out to a TS function that reads `characterStore`, rolls the dice, and returns a result ink can branch on. This keeps all Cepheus math in one testable place instead of duplicated inside ink's own variable system, and it means the Resolution Engine has exactly one implementation whether it's called from a narrative check or a combat round.

---

### Key Architectural Decisions (running log)

- **inkjs owns narrative branching; TypeScript owns all mechanical resolution.** Ink never rolls its own dice — it calls out via `EXTERNAL` functions.
- **Locations are a flat, unlocked/locked card set, not a positional map.** Simplifies navigation state considerably compared to a literal overworld.
- **Full character sheet + dice-resolved combat are core v1 systems**, not deferred features — the Resolution Engine and Combat System get designed up front, not bolted on later.
- **React + Zustand + Tailwind + Vite**, matching the Children of the Ashmark stack, for tooling familiarity and pattern reuse.
- **Strict simulation/UI separation**, consistent with every other project in the portfolio.

### Open question to resolve before detailing Combat

Should combat run in a **dedicated full-screen view** the game transitions to (cleaner separation, more room for a proper combat UI), or **resolve inline within the dialogue view** (less jarring, keeps the VN feel intact, but more cramped for turn-by-turn detail)? This affects both the UI architecture and how much state needs to hand off between `storyStore` and `combatStore`, so I'd like to settle it before designing the Combat System in the next pass.

---

*Next up: Character System (the full Cepheus data model — attributes, skills, career/lifepath chargen) and Combat System in detail.*
