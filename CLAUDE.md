# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Saigon Protocol is a browser-based narrative RPG (Celestial Return / Disco
Elysium–style), client-side only, no backend. Full technical design lives in
`docs/SAIGON_PROTOCOL_ARCHITECTURE.md` (source of truth — read it before
touching core systems) and lore/setting in `docs/SEA_CYBERPUNK_GDD.md`. UI
conventions are in `docs/SAIGON_PROTOCOL_UI_DESIGN.md`. Feature specs for
individual systems (e.g. `docs/NAVIGATION_OVERWORLD_SPEC.md`) are written
*before* implementation and describe settled design, not aspirational ideas.

Stack: React 19 + TypeScript (strict) + Vite + Zustand + Tailwind 4 +
**inkjs** for branching narrative. Tested with Vitest, linted with Oxlint.

## Commands

```
npm run dev        # start Vite dev server
npm run build       # tsc -b && vite build
npm run lint         # oxlint
npm test              # vitest run (single run, CI-style)
npm run test:watch     # vitest watch mode
```

Single test file: `npx vitest run src/stores/navigationStore.test.ts`
Single test name: `npx vitest run -t "returnToOverworld clears the selection"`

No CI config exists yet — `npm run lint`, `tsc -b`, and `npm test` are the
manual gate before considering work done.

## Architecture

**The one rule that matters most: simulation logic never lives in a React
component.** Dice math, stat calculations, and ink story state are computed
in stores/engine modules; components only read store state and dispatch
actions. This is enforced by convention, not tooling — hold the line when
reviewing or writing code here.

### The six systems (Architecture doc §2)

- **Insight System** (`stores/insightStore.ts`) — the seven Insights (Ledger,
  Graft, Muscle Memory, Root, Static, Hustle, Mask) replace a traditional
  character sheet. Single source of truth for check modifiers, wellbeing
  tracks (Vitality/Composure), archetype, and White/Red check bookkeeping.
- **Check Resolution Engine** (`engine/checkResolution.ts`) — pure function:
  `2d6 + Insight modifier vs target number`. Natural 12 always succeeds,
  natural 2 always fails (doubles are decisive), regardless of modifier/TN.
  This is the *only* place dice math lives — don't duplicate it elsewhere.
- **Story Engine** (`engine/storyEngine.ts` + `stores/storyStore.ts`) — wraps
  an inkjs `Story` instance. `storyEngine.ts` is pure and store-agnostic (it
  takes a `Story` plus injected handlers, same testable style as
  `checkResolution.ts`); `storyStore.ts` is the Zustand layer that supplies
  those handlers from `insightStore`.
- **Overworld/Navigation Layer** (`stores/navigationStore.ts`) — tracks
  unlocked/selected locations against a static `content/locations.ts` module.
  Deliberately has no knowledge of `storyStore`/inkjs; the handoff to the
  Story Engine happens at the component layer, not inside either store.
- **Save/Persistence Layer** — not yet built (Architecture doc §5, open).
- **Voiceover/Audio Layer** — not yet built (pre-generated ElevenLabs clips,
  Architecture doc §7, open).

Combat and tactical exploration are explicitly **out of scope for v1** — a
distant, Underrail: Expedition–style future consideration. Don't design or
build toward it unless asked.

### The ink ↔ TypeScript boundary

ink owns narrative branching and prose only; it never rolls its own dice or
mutates wellbeing directly. It calls out via `EXTERNAL` function declarations,
bound in `storyEngine.ts`:

- `is_red_check_consumed(checkId)` / `roll_check(insight, targetNumber, checkId, risk)`
  — gates and resolves checks. Ink only ever gets a pass/fail boolean; the
  full `CheckResult` (dice, doubles tier) is captured TS-side via an
  `onCheckResult` callback for the UI.
- `damage_vitality` / `heal_vitality` / `damage_composure` / `heal_composure`
  — ink declares damage/healing, TS owns the actual mutation and any
  fail-state (zero-track) check. Ink never owns the death check.

Insight levels + archetype are pushed into ink globals via an explicit
snake_case name map (`INSIGHT_ID_TO_INK_VAR` in `storyEngine.ts`) and kept
live-synced through a store subscription for the run. The sync silently
skips any variable a given story didn't declare with `VAR` — writing an
undeclared ink global throws, so minimal/test stories don't need to declare
the full set.

**Only import the lean `Story` runtime from `inkjs` in shipped code.**
`Compiler` (from `inkjs/full`) is an authoring-time-only tool for producing
`.json` from `.ink` source — never import it outside of one-off scripts.

### Content conventions

Static game data lives in `src/content/*.ts` (`insights.ts`, `archetypes.ts`,
`wellbeing.ts`, `locations.ts`) as plain exported objects/records keyed by a
string-literal ID type, with a companion `_IDS` array for iteration — follow
this shape for new content modules rather than inventing a new pattern.

`content/ink/demo.ink` / `demo.json` and the current `locations.ts` entries
are explicitly throwaway/placeholder fixtures (flagged as such in their own
comments and in the architecture doc), not real GDD content — don't treat
their contents as canonical when building real features.

### Dev harnesses

`src/components/dev/*Harness.tsx` (`InsightHarness`, `StoryHarness`,
`NavigationHarness`) are throwaway scaffolding used to exercise a store/engine
end-to-end before real UI exists for it — not production screens. `App.tsx`
wires them together (e.g. swapping `NavigationHarness`/`StoryHarness` based on
`navigationStore`'s `selectedLocationId`) as a temporary stand-in for real
screen composition.

### Documentation workflow

When a system's design or implementation changes, reflect it in
`docs/SAIGON_PROTOCOL_ARCHITECTURE.md` — update the relevant numbered section
and append to its "Key Architectural Decisions (running log)" (append-only in
spirit; don't rewrite past entries). See `.claude/commands/docs.md` for the
full routing rules of which doc to update for which kind of change.
