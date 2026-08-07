# Voiceover/Audio Layer — Spec

*Settled design, written before implementation. Companion to
`SAIGON_PROTOCOL_ARCHITECTURE.md` §2/§7 (names this system, leaves it
explicitly open — "next up, not yet drafted") and
`SAIGON_PROTOCOL_UI_DESIGN.md` §7 (the voiced-line UI affordances this
implements) and §6.6 (the volume sliders this finally drives).*

---

## Problem

`settingsStore.ts` already has real, wired master/sfx/music/voice sliders
and a voice toggle — its own header comment admits "no audio engine to
drive yet." Nothing plays a sound anywhere in the game. The ask has three
parts: curated voiced lines (UI_DESIGN §7), background music that changes with the
scene, and layerable ambience (rain, market noise, engine idle) so a scene
can be as moody as its content wants — all driven from the same ink
content-tagging convention `speaker`/`background` already use
(`docs/INK_CONTENT_TAGGING_SPEC.md`), plus a static per-location baseline
for the Overworld hub, which isn't ink content at all.

## Scope

**In scope:**
- Three new ink line tags — `music`, `ambience`, `voice` — parsed by
  `contentTags.ts` the same way `speaker`/`background` already are.
- Three new content modules (`music.ts`, `ambience.ts`, `voiceClips.ts`)
  mirroring the `npcs.ts`/`backgrounds.ts` shape.
- A pure `engine/audioEngine.ts` (decision logic: what should be playing
  given the current state and a new cue) and an impure `stores/audioStore.ts`
  (owns real `HTMLAudioElement`s, channel volume math, crossfade) — same
  pure/impure split as `storyEngine.ts`/`storyStore.ts` and
  `saveEngine.ts`/`saveStore.ts`.
- Per-location baseline mood (`LocationDefinition.musicId`/`ambienceIds`),
  applied on entering a location and on returning to the Overworld.
- The voiced-line UI affordances UI_DESIGN §7 already specifies: an audio
  glyph on a voiced line, interrupt-on-advance, a replay control, respecting
  the global voice toggle.
- Proving all three tags against real compiled ink in `intro.ink`, not just
  unit tests — same verification bar the content-tagging convention set.
- A one-shot `content/sfx.ts` + `audioStore.playSfx(id)` layer for UI
  interaction sounds (button hover/click, choice select, checkbox/slider,
  overlay open/close, Insight interjection and check-result stings) —
  added in a later pass, wired at the shared UI-primitive level rather than
  per call site. See "UI Interaction SFX" below.

**Out of scope** (deferred):
- Voiced-line assets. Real tracks/clips/SFX landed incrementally after the
  initial pass: `titleTheme`/`introTheme` music, `engineIdle`/`rain`/
  `marketChatter` ambience, and all five UI SFX packs (see the running log)
  — only `content/voiceClips.ts`'s single `meiHongIntro` id still points at
  a file that doesn't exist yet, same position `backgrounds.ts` was in
  before its art landed. The engine treats a missing/failed-to-load file
  as a silent no-op, never a crash.
- A dedicated ambience volume slider. Ambience mixes into the existing
  `sfx` channel; nothing in the ask requires a fifth slider, and one can be
  added later without changing the tag vocabulary or store shape.
- Persisting audio state to a save slot. `audioStore`'s "what's currently
  playing" is derived, transient state — same precedent `settingsStore`
  already set for audio/accessibility prefs (session-only, explicitly
  called out as deliberate in the Save/Persistence spec).
- Per-card hover/preview audio on the Overworld screen. It's a static card
  grid with no per-card "focused" concept today; a location's mood applies
  once, on selection, not while browsing.
- Web Audio API / a third-party audio library. Plain `HTMLAudioElement`s
  with a timer-driven volume tween cover crossfade and independent
  per-layer ambience volume without a new dependency.

## Tag vocabulary (extends `docs/INK_CONTENT_TAGGING_SPEC.md`)

Three new **line tags**, same `# key: value` mechanism as `speaker`/
`background`, attached to the same source line as the text they describe.

| Tag | Meaning | Persistence |
|---|---|---|
| `# music: <musicId>` | Scene music cue. `<musicId>` keys into `content/music.ts`. | Last-wins, persists like `background` until the next `music` tag on a later line. `'none'` is a reserved id in `music.ts` (no `src`) rather than a special-cased type — it silences music through the same lookup path as any real track. |
| `# ambience: +<id>` / `# ambience: -<id>` / `# ambience: clear` | Adds one ambience layer, removes one, or clears all active layers. `<id>` keys into `content/ambience.ts`. | Additive/diff, not replace. Multiple `ambience` tags may appear on one line (e.g. `+rain` and `-marketChatter` together) and all apply, in the order written. |
| `# voice: <clipId>` | A curated voiced line (UI_DESIGN §7 — intros/greetings, not full dialogue). `<clipId>` keys into `content/voiceClips.ts`. | One-shot. Plays when the line's batch is shown; no persistence — absent on the next line simply means no new clip fires. |

Unrecognized ids fall back the same way `background`/`speaker` already do:
the tag is ignored, never thrown on.

## Design

### `src/content/music.ts` / `ambience.ts` / `voiceClips.ts`

Each follows the exact shape `npcs.ts`/`backgrounds.ts` already establish:

```ts
export type MusicId = 'none' | 'titleTheme' | 'introTheme'
export const MUSIC_IDS: MusicId[] = ['none', 'titleTheme', 'introTheme']
export interface MusicDefinition {
  id: MusicId
  /** `/audio/music/<id>.mp3` — served from public/. `null` for the `'none'` sentinel. */
  src: string | null
}
export const MUSIC: Record<MusicId, MusicDefinition>
```

`ambience.ts`/`voiceClips.ts` are the same four-part shape (`<Thing>Id`
union, `<Thing>Definition { id, src }`, `Record`, derived `_IDS` array) with
no `'none'` sentinel needed — `clear` is an operation on the tag/engine
side, not a content id. Assets live under `public/audio/music/`,
`public/audio/ambience/`, `public/audio/voice/` (new dirs, `.gitkeep`'d,
same missing-art tolerance `public/backgrounds/` had before its first PNG
landed). `titleTheme`/`introTheme` are real tracks (`title-theme.mp3`/
`intro-theme.mp3`) as of the first asset delivery; every ambience/voice id
still points at a file that doesn't exist yet.

### `src/engine/contentTags.ts` (edit)

```ts
export function parseLineMusic(tags: string[]): MusicId | null

export interface AmbienceCue {
  add: AmbienceId[]
  remove: AmbienceId[]
  clear: boolean
}
export function parseLineAmbience(tags: string[]): AmbienceCue // always returns an object; empty/false when the line carries no ambience tag

export function parseLineVoice(tags: string[]): VoiceClipId | null
```

`parseLineMusic`/`parseLineVoice` mirror `parseLineBackground` exactly
(last-recognized-tag wins, unrecognized falls back to `null`).
`parseLineAmbience` differs: it walks *every* `ambience` tag on the line
(not just the first match) since `+rain` and `-marketChatter` are both
meaningful together, splitting each value's leading `+`/`-` sigil or
matching the literal `clear`.

### `src/stores/storyStore.ts` (edit)

`StoryLine` gains three fields, parsed in the same place `speaker`/
`background` already are — right after each line's own `Continue()`, in
**both** `advance()` and `hydrateFromRestoredState()` (ink's restore path
collapses a batch to one flat `currentTags` the same documented way it
already does for `background`, so the restore path needs the identical
three parse calls, not just `advance()`):

```ts
export interface StoryLine {
  text: string
  speaker: LineSpeaker
  background: BackgroundId | null
  music: MusicId | null
  ambienceOps: AmbienceCue
  voice: VoiceClipId | null
}
```

### `src/engine/audioEngine.ts` (new — pure)

Decision logic only, no browser APIs — this is what's unit-testable given
the Vitest environment is `node` (confirmed via `vite.config.ts`), which
has no `HTMLMediaElement`:

```ts
export function nextMusicId(current: MusicId | null, cue: MusicId | null): MusicId | null // cue ?? current

export function applyAmbienceCue(current: ReadonlySet<AmbienceId>, cue: AmbienceCue): Set<AmbienceId>
// clear=true starts from empty; then remove, then add — a layer named in
// both `add` and `remove` on the same cue ends up added (add applied last).

export function computeChannelVolume(masterPct: number, channelPct: number, muted?: boolean): number
// (masterPct/100) * (channelPct/100), clamped to [0, 1]; 0 if muted.

export function pickSfxSrc(override: string | undefined, categoryVariants: string[], random?: RandomSource): string
// override wins outright; otherwise a random pick from categoryVariants.
// Same injectable-RandomSource style as checkResolution.ts's resolveCheck
// (re-exported from there, not redefined here) — lets a test fix random()
// and assert exactly which variant index gets picked.
```

### `src/stores/audioStore.ts` (new — impure, owns all browser audio I/O)

Mirrors `saveStore.ts` owning all `localStorage` I/O: one Zustand store that
owns real `HTMLAudioElement`s as module-scoped instances (not stored in
Zustand state itself — not serializable/reactive-friendly), and exposes
only the minimal state a component actually reads:

```ts
interface AudioState {
  activeMusicId: MusicId | null
  activeAmbienceIds: AmbienceId[]      // sorted, for stable rendering if ever surfaced
  currentVoiceClipId: VoiceClipId | null
  isVoicePlaying: boolean

  applyStoryLines: (lines: StoryLine[]) => void
  enterLocation: (def: LocationDefinition) => void
  enterOverworld: () => void
  playTitleMusic: () => void
  replayVoice: () => void
}
```

- **Music**: two pooled `Audio` elements (A/B), looped. Changing tracks
  starts the new element at volume 0, ramps it up while ramping the old one
  to 0 over ~1.5s, then pauses/discards the old one. `'none'` (or no active
  track) just fades the current one to silence. The ramp is a `setInterval`
  (50ms steps), not `requestAnimationFrame` — confirmed in manual testing
  that rAF can be suspended indefinitely in a backgrounded/unfocused tab
  (a bare rAF loop simply never fired), which would strand a fade at its
  starting volume with no error. A plain timer keeps firing regardless of
  tab visibility (browsers throttle it in the background, they don't stop
  it), so a fade always eventually completes.
- **Ambience**: one looping `Audio` element per active layer, keyed by
  `AmbienceId`, independently faded in/out the same way on add/remove.
  Mixes into the `sfx` channel.
- **Voice**: single `Audio` element, not looped. `applyStoryLines` stops
  whatever's currently playing before starting a new clip (UI_DESIGN §7:
  "interrupt on advance — reading pace always wins"), and skips playback
  entirely when `useSettingsStore.getState().voiceEnabled` is `false`.
  `replayVoice()` re-plays `currentVoiceClipId` from the start.
- **Volume**: subscribes to `useSettingsStore` at module init (same
  live-resync pattern `storyStore.loadStory` already uses for
  `insightStore`) and re-applies `computeChannelVolume` to every active
  element whenever master/channel volume or the voice toggle changes —
  takes effect immediately, mid-playback.
- **Missing assets**: every element gets an `error` listener that no-ops
  (matches `PortraitFrame`/`DialogueScreen`'s background `onError`
  tolerance) — nothing plays, nothing throws, no asset exists yet anyway.
- **Autoplay policy**: browsers block unmuted `play()` before the page has
  any user interaction — the title theme starts on load with no prior
  click, so its first `play()` call is expected to reject the same way a
  missing asset does. A one-time `pointerdown`/`keydown` listener on
  `document` retries whatever's still paused the moment the player first
  interacts with the page at all, so the title theme doesn't just silently
  never start.
- **No React player component needed.** Zustand stores are module
  singletons outside the render tree; `audioStore`'s `Audio` elements
  survive every screen swap in `App.tsx` (title→chargen→game,
  overworld↔dialogue) without needing an always-mounted component the way
  `OverlayHost` is.

### Title/Boot and Character Creation

`App.tsx` gains one small `useEffect` on `uiStore.screen`: whenever it's
`'title'` or `'chargen'`, it calls `useAudioStore.getState().playTitleMusic()`
(idempotent — a no-op once `titleTheme` is already the active track, so
navigating Title↔Character Creation doesn't restart it). Deliberately no
matching "leave" branch for every other screen value — the entry points a
real scene already has (the intro's own first-line `music` tag,
`OverworldScreen.handleSelect`'s `enterLocation`, `DialogueScreen`'s
`enterOverworld`) already override `titleTheme` themselves, and reacting to
*every* non-title/chargen screen here too would race those calls within the
same render pass (chargen's confirm handler calls `loadStory()` then
`goToGame()` synchronously in one handler — `DialogueScreen`'s own mount
effect already re-cues music before this component-level effect would ever
get a chance to stomp on it).

One gap that isn't covered by a "real scene" entry point: Title's Continue
and `SettingsOverlay`'s Load can land directly on the Overworld with no
active story (an Overworld-only save). Both call
`useAudioStore.getState().enterOverworld()` right after a successful load
when `useStoryStore.getState().story` is still `null`, so `titleTheme`
doesn't keep playing over the Overworld. A mid-scene save doesn't need this
— its restored line's own tags (if any) already flow through
`DialogueScreen`'s existing `applyStoryLines` call.

### Location/Overworld integration

`content/locations.ts`: `LocationDefinition` gains optional `musicId?:
MusicId` and `ambienceIds?: AmbienceId[]` — the location's baseline mood,
independent of whatever its `.ink` content tags afterward.

`OverworldScreen.tsx`: `handleSelect` calls
`useAudioStore.getState().enterLocation(LOCATIONS[id])` alongside the
existing `selectLocation`/`loadStory`/`autosave()` calls — same imperative,
no-`useEffect` style already there. Gives the transition into a scene
instant mood before the ink's own first-line tags (if any) take over.

`DialogueScreen.tsx`:
- The existing `currentLines` effect (already tracking
  `activeNpcId`/`activeBackgroundId`) additionally calls
  `useAudioStore.getState().applyStoryLines(currentLines)`.
- `handleReturnToOverworld` calls `useAudioStore.getState().enterOverworld()`
  alongside its existing `returnToOverworld()`/`resetStory()`/`autosave()`
  sequence.
- A small voice glyph renders next to the latest entry's tagged line when
  `line.voice` is set (UI_DESIGN §7: "audio glyph near the speaker's
  portrait/name"), with a replay button wired to
  `useAudioStore.getState().replayVoice()`. Read reactively off
  `useAudioStore` (`isVoicePlaying`, `currentVoiceClipId`).

### UI Interaction SFX (`content/sfx.ts` + component wiring)

Purely UI feedback, not simulation state — this doesn't go through the ink
content-tagging convention at all (nothing about a button hover is a story
concern), so it's wired directly from component event handlers instead:

```ts
export type SfxId =
  | 'buttonHover' | 'buttonClick' | 'choiceSelect'
  | 'checkboxOn' | 'checkboxOff' | 'sliderTick'
  | 'overlayOpen' | 'overlayClose'
  | 'insightInterject' | 'checkSuccess' | 'checkFailure'
```

`content/sfx.ts` has one more level than the other content modules: the
first real delivery came as five labeled packs of 8–9 variants each (Hover/
Confirm/Close/Open/Scan), not one file per `SfxId`. Rather than force a
1:1 id→file mapping, `content/sfx.ts` splits `SfxId` ("what interaction
fired") from a smaller `SfxCategory` ("which pool serves it") — several ids
share a category, and `audioStore.playSfx(id)` picks a random variant from
that category's pool each call, so the same interaction doesn't play the
identical clip every time:

```ts
export type SfxCategory = 'hover' | 'confirm' | 'close' | 'open' | 'scan'

export const SFX_ID_TO_CATEGORY: Record<SfxId, SfxCategory> = {
  buttonHover: 'hover', sliderTick: 'hover',
  buttonClick: 'confirm', choiceSelect: 'confirm', checkboxOn: 'confirm', checkSuccess: 'confirm',
  checkboxOff: 'close', checkFailure: 'close', overlayClose: 'close',
  overlayOpen: 'open',
  insightInterject: 'scan',
}
```

`confirm`/`close` double as a loose positive/negative valence pair —
`checkboxOn` and a successful check both read as "confirm," `checkboxOff`
and a failed check both read as "close" — rather than every id needing its
own dedicated recording. `scan` (an Insight "reading" a scene) went to
`insightInterject` as the strongest thematic fit among the five delivered
categories.

Assets are `/audio/sfx/<category-folder>/ui-<category>-<n>.mp3`, renamed
from the delivered `Category/UI_Category_N.mp3` (which also had two
inconsistent-casing filenames — harmless on this Windows dev machine, a
latent bug on any case-sensitive production host). The folder name is
deliberately more than the bare category — it spells out every `SfxId`
drawing from that pool, e.g. `confirm--button-click+choice-select+checkbox-on+check-success/`
— so `public/audio/sfx/` is self-documenting when browsing it directly:
swapping a pack means finding the folder that names the interaction you
want to change. `content/sfx.ts`'s `SFX_CATEGORY_FOLDER` is the one place
that maps a `SfxCategory` to its actual folder; keep it (and the folder
name itself) in sync with `SFX_ID_TO_CATEGORY` by convention if that
mapping ever changes — it's not enforced by any type.

`audioStore` gains `playSfx(id: SfxId)` — unlike music/ambience/voice, this
creates a fresh, un-pooled `Audio` element per call rather than reusing one,
so rapid overlapping triggers (hovering several buttons quickly) don't cut
each other off the way voice's one-at-a-time interrupt semantics do. Mixes
into the `sfx` channel, same as ambience. Which file to play is resolved by
`audioEngine.ts`'s `pickSfxSrc` (override-or-random), not decided inline —
`playSfx` itself is just "resolve a src, make an element, play it."

`content/sfx.ts` also has `SFX_ID_OVERRIDE: Partial<Record<SfxId, string>>`
— pins a specific id to one exact file instead of a random pick from its
category, checked first by `pickSfxSrc`. Not a pool-size constraint (the
confirm pool still has all 9 variants); it's a preference: `buttonClick` is
pinned to `ui-confirm-6.mp3` by request, so every button click in the app
plays that one clip rather than a random confirm variant, while
`choiceSelect`/`checkboxOn`/`checkSuccess` — the confirm pool's other three
ids — keep picking randomly.

Wired at the primitive level wherever possible, so every call site gets it
for free instead of repeating the wiring:
- **`CyberButton`**: hover and click, skipped when `disabled`.
- **`NavRail`'s `RailButton`**: same hover/click pair. `NavRail`'s own header
  comment documents itself as store-free/presentational; this is the one
  deliberate exception, called out there rather than silently violated —
  UI feedback isn't the kind of game-state coupling that convention exists
  to prevent.
- **`ChoiceRow`**: `choiceSelect` on pick. Locked choices are native
  `disabled` buttons, which don't fire click events at all — there's no
  "denied" sound wired for attempting a locked choice, since doing that
  cleanly would mean restructuring the disabled/focus semantics for a
  cosmetic addition; left out of this pass.
- **`NeonCheckbox`**: `checkboxOn`/`checkboxOff` depending on the new value.
- **`NeonSlider`**: `sliderTick`, only when the (already-quantized) value
  actually changes — native range inputs only fire `onChange` on a real
  value move, so this is already "per notch," not per pixel of drag.
- **`OverlayHost`**: `overlayOpen`/`overlayClose` on `activeOverlay`
  transitions. `OverlayHost` itself never unmounts (`App.tsx` renders it
  unconditionally), so this is a `useEffect` keyed on `activeOverlay`
  becoming/leaving truthy, not a mount/unmount boundary.
- **`InsightChip`** (`glitchOnMount`) and **`CheckResultBlock`**: one-shot
  mount-effect stings (`insightInterject`, `checkSuccess`/`checkFailure`).
  Both components genuinely mount fresh per appearance in the dialogue log
  (a new interjection or check result each time), so `useEffect(..., [])`
  is the right one-shot trigger — deliberately not tied to `GlitchText`'s
  own repeating `loop` variant (used elsewhere, e.g. the title screen),
  which would spam a sound every animation cycle forever.

All five categories (44 files total) landed and are wired; confirmed
manually that hover/click/toggle/drag/overlay-close across the
Title→Settings flow all resolve their real files (200s) and produce zero
console errors.

### `content/ink/intro.ink` (edit)

Proves all three tags against real compiled ink:
- Opening beat (Cholon pull-out): `# music: introTheme`,
  `# ambience: +engineIdle` and `# ambience: +marketChatter` together —
  the exact "rain + market chatter" kind of layering the ask called for,
  just with engine noise standing in for the market's own beat.
- District 4 flood-wall beat (after `[Keep driving.]`): `# ambience: -marketChatter`
  and `# ambience: +rain` on the same line — one line, two ops, proving the
  "all tags on this line apply" semantics.
- Lab arrival: `# ambience: -engineIdle` (the text already says "your engine
  cuts out" right after), no new music tag — `introTheme` carries through
  the drive and the arrival as one continuous track (per the real asset
  delivered for it), rather than a separate cue per beat.
- Mei Hong's first line ("You're the detective."): `# voice: meiHongIntro` —
  the textbook curated-greeting use case UI_DESIGN §7 describes.

Recompiled via `npm run compile:ink`.

### `SettingsOverlay.tsx`

No new UI — the four sliders and voice toggle already exist and start
actually doing something once `audioStore` subscribes to `settingsStore`.
Drop the now-stale "no audio engine to drive yet" header comment.

## Verification

- `contentTags.test.ts`: every tag/value combo for `music`/`ambience`/
  `voice`, unrecognized-id fallback, and multi-tag-per-line ambience
  behavior.
- `storyStore.test.ts`: `advance()` and the restore path both populate the
  three new `StoryLine` fields correctly from a fixture story's tags.
- `audioEngine.test.ts`: `nextMusicId`, `applyAmbienceCue` (add/remove/clear
  combinations, including a layer named in both `add` and `remove` on one
  cue), `computeChannelVolume` (clamping, muted), and `pickSfxSrc` (override
  short-circuits random entirely; a fixed `RandomSource` picks the first/
  middle/last variant deterministically, same injectable-random style
  `resolveCheck`'s tests already use).
- `content/sfx.test.ts`: structural integrity over the generated data
  itself, not just the selection logic — every `SfxId` resolves to a
  category, each category has the delivered variant count (9/9/9/9/8), every
  variant path is well-formed and inside its own category's folder, no
  duplicate paths anywhere, and `SFX_ID_OVERRIDE.buttonClick` is verified to
  actually be a member of the confirm pool (catches a typo'd override
  pointing at a nonexistent or wrong-category file).
- Deliberately not covered by an automated test: the impure playback side of
  `audioStore.ts` itself (creating `HTMLAudioElement`s, crossfade timers,
  actual `.play()` calls) and all the UI-primitive SFX wiring (`CyberButton`,
  `ChoiceRow`, etc.). Neither is testable without introducing a DOM
  environment (jsdom) and a component-testing library — this repo's Vitest
  config is `environment: 'node'` and there are zero `.test.tsx` files
  anywhere in it today, only store/engine/content logic. Extracting the
  actual decision logic into pure, tested functions (`nextMusicId`,
  `applyAmbienceCue`, `computeChannelVolume`, `pickSfxSrc`) is what keeps
  this gap small rather than leaving the whole audio pipeline unverified;
  the remaining browser-only behavior (real playback, actual click wiring)
  is confirmed by manual browser passes instead, per the entries below.
- Manual browser pass: confirm no console errors on scene load/transition
  despite missing audio assets; confirm the voice glyph/replay control
  renders on Mei Hong's tagged intro line; confirm moving the master/music/
  sfx/voice sliders and the voice toggle in Settings doesn't throw; confirm
  hover/click/checkbox/slider/overlay-open-close interactions across the
  Title→Settings flow produce zero console errors despite no SFX assets
  existing yet.
- Manual browser pass, once real assets landed: confirmed via a temporary
  debug hook (added, verified, removed — not committed) that `titleTheme`/
  `introTheme` and the `engineIdle`/`marketChatter`/`rain` ambience layers
  create real `Audio` elements with the correct `src`, unpaused, with
  volume ramping toward the expected computed target. Caught and fixed a
  real bug this way: the original `requestAnimationFrame`-based fade could
  get permanently stuck at its starting volume in a backgrounded/unfocused
  tab (confirmed independently: a bare rAF loop never fired at all in that
  state) — switched to a `setInterval`-driven ramp, which keeps firing
  regardless of tab visibility.
- `npm run lint`, `tsc -b`, and `npm test` clean.
