# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Saigon Protocol is a browser-based narrative RPG (Celestial Return / Disco
Elysium–style), client-side only, no backend. Three docs, three jobs, no
overlap:

- `docs/SAIGON_PROTOCOL_ARCHITECTURE.md` — **as-built** technical reference:
  code/store/engine structure, the ink↔TS boundary, how the six core
  systems are actually wired. Read it before touching core systems.
- `docs/GAME_GUIDE.md` — the practical reference for writing content and
  building UI: screen layout, visual style tokens, the ink content-tagging
  vocabulary, navigation/save/audio conventions. Read it before authoring
  `.ink` content or touching a screen/overlay.
- `docs/SEA_CYBERPUNK_GDD.md` — lore, setting, and narrative-design premise.
  No technical content.

All three describe settled/built state, not aspirational ideas. A working
spec for a system (`docs/*_SPEC.md`) gets folded into the appropriate
as-built doc above and deleted once that system is actually built — don't
expect to find old spec files in `docs/` for anything already described
above, and don't add new content to a doc name that doesn't exist; check
git history for the original design rationale if you need it. Specs for
content that hasn't shipped yet (e.g. `docs/CASE_1_*.md`) are the
exception — those stay until the content they describe is real.

Stack: React 19 + TypeScript (strict) + Vite + Zustand + Tailwind 4 +
**inkjs** for branching narrative. Tested with Vitest, linted with Oxlint.

## Commands

```
npm run dev        # start Vite dev server
npm run build       # tsc -b && vite build
npm run lint         # oxlint
npm test              # vitest run (single run, CI-style)
npm run test:watch     # vitest watch mode
npm run audio:convert   # batch-convert .wav -> .mp3 (scripts/wav-to-mp3.mjs, needs ffmpeg on PATH)
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
- **Save/Persistence Layer** (`engine/saveEngine.ts` + `stores/saveStore.ts`)
  — one Autosave slot plus player-named manual slots in `localStorage`.
  Serializes Insight/navigation state and, when a scene is active, the ink
  story state alongside which compiled story it belongs to.
- **Voiceover/Audio Layer** (`engine/audioEngine.ts` + `stores/audioStore.ts`)
  — plain `HTMLAudioElement`-based music/ambience/voice, driven by ink line
  tags (`music`/`ambience`/`voice`) plus a UI-interaction SFX layer wired at
  the component level. Voice clips are pre-generated (ElevenLabs), never
  synthesized live.

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

Audio assets (`public/audio/{music,ambience,voice}/*.mp3`, referenced from
`src/content/music.ts` / `ambience.ts` / `voiceClips.ts`) are served as mp3
only. Source sound effects/music are often sourced as `.wav` — if any land in
the repo, convert them with `npm run audio:convert` (`scripts/wav-to-mp3.mjs`,
requires ffmpeg on PATH) rather than committing `.wav` files or shipping them
directly. See `docs/GAME_GUIDE.md` §8 for the audio layer's conventions.

### Documentation workflow

When a system's design or implementation changes, reflect it in
`docs/SAIGON_PROTOCOL_ARCHITECTURE.md` — update the relevant numbered section
and append to its "Key Architectural Decisions (running log)" (append-only in
spirit; don't rewrite past entries). See `.claude/commands/docs.md` for the
full routing rules of which doc to update for which kind of change.
