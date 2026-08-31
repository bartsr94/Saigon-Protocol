# Saigon Protocol

A browser-based narrative RPG in the Disco Elysium / Celestial Return vein:
text-forward, choice- and dice-check-driven, with a seven-"Insight"
personality-lens system standing in for a traditional character sheet.
Client-side only, no backend — built with React, TypeScript, Vite,
Zustand, Tailwind, and inkjs for branching narrative.

## Docs

- `docs/SAIGON_PROTOCOL_ARCHITECTURE.md` — as-built technical reference
  (store/engine structure, the ink↔TS boundary).
- `docs/GAME_GUIDE.md` — practical reference for writing content and UI
  (screen layout, visual style, ink tag vocabulary, save/audio conventions,
  and the current background-art workflow).
- `docs/SEA_CYBERPUNK_GDD.md` — setting, lore, and narrative-design premise.

## Runtime Entry

- `index.html` loads `src/main.tsx`
- `src/main.tsx` mounts `src/App.tsx`
- `App.tsx` routes between title, character creation, overworld, dialogue, and overlays

## Key Directories

- `src/components/screens/` — top-level screens and overlays
- `src/stores/` — Zustand state for UI, story, navigation, saves, settings, audio, and insights
- `src/content/` — static game content registries
- `content/ink/` — authored Ink stories plus compiled `.json`
- `public/` — browser-served assets
- `scripts/compile-ink.mjs` — compiles every `content/ink/*.ink` to sibling `.json`

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — type-check and build production bundle
- `npm run test` — run Vitest suite
- `npm run lint` — run Oxlint
- `npm run compile:ink` — compile Ink sources to JSON
- `npm run audio:convert` — convert `.wav` assets to `.mp3` with `ffmpeg`

## Background Art

Scene backdrops and the title key art live under `public/backgrounds/` and
are referenced from `src/content/backgrounds.ts`. The current house-style
generation and refine workflow is documented in `docs/GAME_GUIDE.md` so new
art passes stay visually consistent with the shipped Aveline exterior,
Aveline interior/lounge/hallway set, Cholon street, and title screen
backgrounds.
