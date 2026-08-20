# Saigon Protocol — Game Guide

*The practical reference for writing content and building UI in this game:
screen layout, visual style, the ink content-tagging vocabulary, and the
navigation/save/audio conventions a content author or UI contributor
actually needs open while working. Companion to `SAIGON_PROTOCOL_ARCHITECTURE.md`
(code/store structure — read that for *where* things live) and
`SEA_CYBERPUNK_GDD.md` (setting/lore — no mechanics or UI content here).*

*This doc consolidates what used to be eight separate specs
(`CONTENT_PIPELINE_SPEC`, `INK_CONTENT_TAGGING_SPEC`, `INTRO_SCENE_SPEC`,
`NAVIGATION_OVERWORLD_SPEC`, `SAVE_PERSISTENCE_SPEC`, `AUDIO_VOICEOVER_SPEC`,
`UI_VISUAL_STYLE_SPEC`, `SAIGON_PROTOCOL_UI_DESIGN`), each written before its
system was built. All eight systems described below are implemented; the
old files now just redirect here.*

---

## 1. Design principles

- **Text is the primary interface.** The right-hand dialogue panel is where
  the player spends most of their attention. Everything else supports it.
- **The stage sells the world.** The left/center visual area carries mood
  and character through illustration.
- **Nothing mechanical hides in prose.** Checks, Insight-gated options, and
  White/Red status are always visually marked, never buried in flavor text.
- **Readable first, stylish second.** Neon-noir styling never comes at the
  cost of text legibility.
- **Voice is a garnish, not a crutch.** Voiced lines enhance first
  impressions; the game plays perfectly with audio off.

## 2. Screens & overlays

| View | Type | Purpose |
|---|---|---|
| Title / Boot | Full screen | New game, Continue (enabled once any save exists), Settings |
| Character Creation | Full screen, 3 steps | Archetype select → free-point spend → name + confirm |
| **Dialogue / Scene** | Full screen | **The core loop** — narration, dialogue, choices, checks |
| Overworld | Full screen | Clickable Saigon district map with district-panel destination selection |
| Character (`character` overlay) | Overlay | Portrait, name, archetype + backstory, all seven Insights with pips/tagline/strength-weakness tag |
| Casefile (`casefile` overlay) | Overlay | Evidence/Items grid + Case Notes log |
| Settings (`settings` overlay) | Overlay | Audio, text speed, accessibility, save/load — also serves as the pause/system menu (there's no separate Pause screen) |
| Debug Console (`debug` overlay, dev-only) | Overlay | `import.meta.env.DEV`-gated corner button → Map Builder (grid/POI/door authoring, exports JSON) and Flags (`casefileStore` flag toggle for testing) |

Overlays render via `OverlayHost` on top of whatever full screen is
active; `uiStore.activeOverlay` drives which one shows.

### 2.1 Dialogue/Scene layout

75/25 split: left three-quarters is nav rail + character stage, right
quarter is the dialogue panel.

```
┌──┬────────────────────────────────────────────┬───────────────────────────┐
│CH│ ┌────────┐                                  │  DIALOGUE / NARRATION LOG │
│AR│ │ PLAYER │  DET. [NAME]                     │  (scrolls; newest at      │
├──┤ │ PORTRAIT│ ▓▓▓▓▓▓▓░░░  Vitality            │   bottom)                 │
│MA│ └────────┘ ▓▓▓▓▓░░░░░  Composure           │                           │
│P │                                             │  The rain hasn't stopped  │
├──┤              ┌─────────────────┐            │  in three days...        │
│CA│              │   NPC PORTRAIT  │            │                           │
│SE│              │  (center stage, │            │  ┌──┐ THE LEDGER          │
├──┤              │   speaking      │            │  │▓▓│ This one's stalling.│
│ME│              │   character)    │            │  └──┘ Ask about the money.│
│NU│              └─────────────────┘            │                           │
│  │                                             │  MEI HONG: "You're the    │
│  │                                             │  detective."              │
│  │                                             │  ─────────────────────    │
│  │                                             │  ▶ 1. "Just doing my job."│
│  │                                             │  ▶ 2. [THE MASK] Smile.   │
│  │                                             │  ▶ 3. [LEDGER ◆ RED] Push │
│  │                                             │       on the payment.     │
└──┴────────────────────────────────────────────┴───────────────────────────┘
```

- **Left-edge nav rail** — vertical icon rail (`NavRail`): CHAR / MAP / CASE
  / MENU, in that render order. MAP returns to the Overworld (or is a no-op
  exit for the intro/story-with-no-location case — same handler either way).
- **Top-left status block** — player portrait (`PortraitFrame`, falls back
  to initials on missing art), archetype name, two `PipTrack`s (Vitality,
  Composure) — discrete pips, not a smooth bar, so exact remaining points
  read at a glance. The changed pip(s) flash on damage/heal (`PipTrack`'s
  own one-shot animation, respecting Reduce Motion).
- **Center stage** — the currently-speaking NPC's portrait (tracks the most
  recent `speaker: npc:<id>` tag), or the location name label when nothing's
  speaking yet. An optional dimmed backdrop image (tracks the most recent
  `background:` tag) sits behind everything in this region.
- **Dialogue panel** (`Panel size="lg"`) — a scrolling transcript
  (`DialogueScreen`'s own local `log` state; `storyStore.currentLines` only
  ever holds "since the last choice," so the screen accumulates it) with a
  typewriter reveal (`settingsStore.textSpeed`/`instantText`), then a
  divider and the choice list once the current batch has finished revealing.

### 2.2 Character Creation

Three steps, orchestrated by `CharacterCreationScreen` over local step
state:
1. **`ChargenArchetypeStep`** — split view: the six archetypes as cards in
   one column, a flat portrait gallery (`content/portraits.ts`) in the
   other. Picking an archetype commits immediately to `insightStore`
   (baseline levels + archetype); picking a portrait commits independently
   (`selectPortrait`) and neither choice clears the other. "Continue" is
   disabled until both an archetype and a portrait are chosen.
2. **`ChargenFreePointsStep`** — spend the archetype's free-point pool
   (`spendFreePoint`/`refundFreePoint`); refunding can't drop a level below
   the archetype's own baseline for that Insight.
3. **`ChargenConfirmStep`** — name entry (`insightStore.setPlayerName`) +
   backstory summary; "Begin" is disabled until a name is entered. Confirm
   calls `storyStore.loadStory(introStoryJson, undefined, 'intro')` and
   `uiStore.goToGame()` — the player lands directly in the intro scene, not
   the Overworld.

## 3. Visual style system

### 3.1 Color roles

Two non-overlapping layers — **chrome** (UI frame, generic) never borrows a
**semantic** (meaning-bearing, content-driven) color and vice versa:

| Role | Token | Notes |
|---|---|---|
| Chrome — idle | `--color-chrome-primary` (cyan, `#00f2ff`) | Default borders/glow, button idle, nav rail idle |
| Chrome — hover/focus/active | `--color-chrome-secondary` (magenta, `#ff00ff`) | Consistent across buttons, checkboxes, sliders, choice-row hover |
| Vitality | `--color-vitality` (red) | Physical wellbeing track |
| Composure | `--color-composure` (cyan) | Psychological wellbeing track |
| White check | `--color-check-white` | Cool/neutral marker |
| Red check | `--color-check-red` | Alarm register, shares Vitality's register on purpose |
| Insight identity | Each Insight's own `color` in `content/insights.ts` | Used **only** for that Insight's interjection chip/tag — never repurposed as chrome |
| Background | `--color-bg` (`#050505`) | `color-scheme: dark` |

All tokens live in `src/index.css`'s `@theme` block (Tailwind 4 is
CSS-first — no `tailwind.config` file).

### 3.2 Typography

Self-hosted (`@fontsource/orbitron`, `@fontsource/rajdhani` — no Google
Fonts CDN dependency):
- **Orbitron** (700/900) — titles, speaker names, Insight names, HUD/button
  labels. Uppercase, letter-spaced.
- **Rajdhani** (500/600/700) — dialogue body, narration, choice text. No
  glitch treatment — this is the reading-heavy typeface.

### 3.3 Cut-corner panel chrome

One parameterized `clip-path` pattern at three scales (`--cut-sm`/`--cut-md`/
`--cut-lg` in `index.css`'s `:root`):

| Token | Size | Used for |
|---|---|---|
| `cut-sm` | ~10px | Pips, small tag/badge chips |
| `cut-md` | ~20–25px | Choice rows, nav-rail buttons, section panels |
| `cut-lg` | ~40px | Full modal panels (`Panel size="lg"`): dialogue panel, Settings, Casefile |

Standard chrome: 1px border in the panel's chrome color at ~30–40% opacity,
`rgba(5,5,5,0.75)`-ish background with backdrop-blur, matching outer+inset
glow.

### 3.4 Motion & accessibility

Rule of thumb: **no continuous/infinite glitch or flicker on anything read
for more than a second.** Allowed as looping: Title logo glitch, button
hover flicker (stops on mouse-out), pulsing "continue" glyph, pip-flash on
change (one-shot, ~300–600ms). Never continuous: dialogue text, choice
text, narration once it's no longer the newest entry.

**`settingsStore.reduceMotion`** is the explicit, overridable source of
truth — seeded from `prefers-reduced-motion` but changeable in Settings.
`App.tsx` mirrors it onto `document.documentElement.dataset.reduceMotion`,
and `index.css` has both a `:root[data-reduce-motion='true']` selector and
the raw `@media (prefers-reduced-motion: reduce)` fallback (for
before-mount / never-opened-Settings). `highContrast` and `largeText`
follow the same pattern — real wired effects, not decorative checkboxes.

## 4. Insight interjections & choice/check presentation

**Insight interjections** are passive log entries — distinct from
Insight-*gated choices*, which appear in the choice list instead:

```
┌──┐ THE GRAFT
│▓▓│ Their hand won't stop
└──┘ shaking. Withdrawal, or fear?
```

Rendered via `InsightChip` (name in the Insight's own color, one-shot
flicker on mount) + body text tinted the same color. Frequency and which
Insight speaks are entirely ink-content decisions — the UI just renders
whatever `speaker: insight:<id>` tags emit.

**Choice tags** communicate mechanical weight before commitment:

| Tag | Render |
|---|---|
| *(none)* | Plain choice, no marker |
| `insight: <id>` | Insight-gated — pill in that Insight's color |
| `check: white` | White check (retriable) — cyan-outline "◇" pill |
| `check: red` | Red check (one-shot) — filled alarm-red "◆ RED" pill |
| `locked: <reason>` | Visible, greyed out, disabled, reason text shown |

Precedence when a choice carries more than one: `locked` wins outright;
absent that, `check` beats a bare `insight` tag. See §5.2 for the ink-side
tag syntax.

**Check result presentation** — when a check resolves, the log shows the
roll transparently before continuing into the branch:

```
  ● CHECK — 2d6 [4][5] = 9  +2 Ledger  =  11   ▸ SUCCESS
```

(`CheckResultBlock`, reading the `CheckResult` captured via `storyStore
.lastCheckResult`.)

## 5. Writing ink content

### 5.1 File layout & compiling

Each Overworld location owns one `content/ink/<districtId>/<locationId>.ink`
file, grouped one level deep by district (`content/ink/district4/checkpoint.ink`,
etc.) so a district's content is visible at a glance. A location's own
INCLUDE-only per-character files live in a subfolder alongside it (e.g.
`content/ink/district4/aveline/`). The `intro` scene
(`content/ink/intro.ink`) is the one active story with no location or
district — it auto-plays right after Character Creation confirms, and stays
at the `content/ink/` root.

Compile every `.ink` file to its sibling `.json` with:

```
npm run compile:ink
```

This is a **manual step** — no build-time or pre-commit hook forces
recompilation. A stale `.json` after editing `.ink` is a real hazard;
always recompile before testing a content change in the browser.

**Adding a new location's content:**
1. Add the `LocationId` + `LocationDefinition` entry to `content/locations.ts`.
2. Write `content/ink/<districtId>/<id>.ink` under its district's folder
   (create the folder if this is that district's first location).
3. `npm run compile:ink`.
4. Add the compiled JSON to `src/content/locationStories.ts`'s
   `LOCATION_STORY_JSON` map.
5. (Optional) set `musicId`/`ambienceIds` on the location definition for a
   baseline mood, and `unlocksOnComplete` if finishing this scene should
   unlock another location.

### 5.2 Tag vocabulary

All tags are `# key: value` — single leading `#`, first `:` splits key from
value, both trimmed. **Unrecognized keys/values are ignored, never thrown
on** — a typo degrades to plain narration/plain choice, never crashes a
scene. Always write a tag on the *same source line* as the text it
describes (ink attaches `currentTags` to whatever line is currently being
built; a standalone tag-only line risks landing on the next paragraph).

**Line tags** (at most one `speaker`/`background`/`music` is meaningful per
line — last one wins if several appear; `ambience` is the exception, every
`ambience` tag on a line applies):

| Tag | Meaning | Render |
|---|---|---|
| *(absent)* | Narrator | Plain paragraph |
| `speaker: npc:<npcId>` | NPC line, `<npcId>` → `content/npcs.ts` | Name row; center-stage portrait swaps and holds until the next `npc:` tag |
| `speaker: insight:<insightId>` | Insight interjection, `<insightId>` → `content/insights.ts` | `InsightChip`-headed entry in that Insight's color |
| `background: <id>` | Scene backdrop, `<id>` → `content/backgrounds.ts`. Independent of `speaker`. | Dimmed full-bleed backdrop, holds until the next `background:` tag |
| `portrait: <variantId>` | Which of the on-stage NPC's `content/npcs.ts` `portraits` entries to show, e.g. `smiling`/`hurt`. Not validated against a shared id set — an id that isn't one of that NPC's keys falls back to their `neutral` entry. | Center-stage portrait swaps and holds until the next `portrait:` tag, or resets to `neutral` when a different NPC becomes the speaker |
| `music: <id>` | Scene music cue, `<id>` → `content/music.ts`. `'none'` explicitly silences music. | Crossfades, holds until the next `music:` tag |
| `ambience: +<id>` / `-<id>` / `clear` | Layered environmental sound, `<id>` → `content/ambience.ts` | Adds/removes/clears a looping layer, faded in/out |
| `voice: <id>` | Curated voiced line (intros/greetings only), `<id>` → `content/voiceClips.ts` | Plays once as the line appears; shows a replay glyph |

**Choice tags** — inkjs only populates `Choice.tags` from tags written
**inside** a choice's `[bracket-only text]`; a tag placed after the closing
bracket attaches to the *next line of output* instead. Always put tags
inside the brackets:

```ink
* [Push on the payment. # insight: ledger # check: red]
* [Ask about the drone. # insight: static]
* { graft < 4 } [Force the panel open. # insight: graft # locked: GRAFT 4 required]
```

### 5.3 Checks

A choice triggers a check by calling `roll_check(insight, targetNumber,
checkId, risk)` inline in the `.ink` source — **there is no separate
TS-side check registry.** Target number and White/Red risk are co-located
with the narrative beat that triggers them.

**`checkId` strings must be globally unique across all loaded content.**
`insightStore.consumedRedChecks` is one flat set shared by whatever story
is currently loaded, with no per-location namespace — prefix every
`checkId` with its scene/location (`"checkpoint-jump-queue"`), enforced by
convention, not by any runtime check. Two locations picking the same bare
id would silently cross-consume each other's Red check.

Declare only the ink `VAR`s and `EXTERNAL`s a scene actually uses — the
Insight sync silently skips undeclared variables, and a scene with no
checks/wellbeing calls (like `intro.ink`) needs zero `EXTERNAL`
declarations at all.

### 5.4 Archetype-gated content

`archetype` is synced into ink globals the same way Insight levels are
(`storyEngine.ts`'s `syncInsightVariables`) — declare `VAR archetype = ""` in
any scene that wants to read it, and gate lines/choices on it with the exact
same conditional pattern already used for Insight levels, just with a string
equality check instead of a numeric threshold:

```ink
VAR archetype = ""

{ archetype == "hustler":
    Flavor only a Hustler protagonist gets to read.
}
```

Valid values are the six `ArchetypeId`s from `content/archetypes.ts`
(`enforcer`, `companyMan`, `oldSaigon`, `wire`, `hustler`, `boringCop`).
Unlike Insight interjections, there's no visible tag/pill for this in the
UI (deliberate — see the running log) — an archetype-gated line or choice
just silently is or isn't there, the same way an Insight-gated *choice*
(not interjection) appears/disappears without an explicit `- else:` branch.
`workerCanteen.ink`'s Hustler-only beat on the counter's "two ways of being
Xóm Chàm" paragraph is the first real example.

### 5.5 Worked example (the intro scene's pattern)

`content/ink/intro.ink` is a good template for a no-stakes narrative scene:
a linear sequence of pacing choices (`* [Keep driving.]`), each stage
setting its own `background:` tag, with Insight interjections gated on
`{ insightVar >= 3 }` conditions using an explicit `- else:` branch so
every path emits exactly one line (never relies on inkjs's
empty-line-on-false behavior). It declares only the four `VAR`s it gates
on (`ledger`, `root`, `static`, `hustle`) and no `EXTERNAL`s, since it never
calls `roll_check` or a wellbeing function. Its first line tags `music:
introTheme` plus two `ambience: +` layers together; a later line drops one
layer and adds another on the same line (`ambience: -marketChatter` +
`ambience: +rain`), proving the "every ambience tag on a line applies"
semantics. Mei Hong's first line carries `voice: meiHongIntro` — the
textbook curated-greeting use case.

## 6. Navigation / Overworld / Location Hubs

### 6.1 Overworld & Districts

`content/locations.ts` defines the location list (`LocationId` union +
`Record<LocationId, LocationDefinition>` + `LOCATION_IDS` array — currently
`checkpoint` → `noodleStall` → `deltaSquat`, flavor-light placeholders, not
GDD-canonical). Each definition has a `districtId`, `name`, `blurb`,
`unlockedByDefault`, optional `unlocksOnComplete: LocationId[]`, and
optional baseline `musicId`/`ambienceIds`. `content/mapRegions.ts` defines
the Overworld's district geometry, labels, and blurbs separately from the
playable story destinations.

**Unlock flow:** `navigationStore.unlockLocation(id)` is idempotent and
callable from anywhere, but in practice the only caller is
`DialogueScreen.handleReturnToOverworld` — when a location's scene has
`ended === true` and the player exits, every id in that location's
`unlocksOnComplete` gets unlocked. There is no other unlock trigger in the
game today (no item/flag-based unlocks).

Choosing a destination from the Overworld — whether or not its district
has a walkable street map (§6.3) — always goes through the shared
`enterLocationHub(id)` helper (`components/screens/enterLocationHub.ts`):
`navigationStore.selectLocation(id)`, `gameplayStore.enterHub(id)`,
`audioStore.enterLocation(LOCATIONS[id])`, `saveStore.autosave()`. This
lands the player in that location's **Location Hub** (§6.2), not directly
in an ink scene — the story only loads once the player picks a specific
interaction from inside the hub.

`OverworldScreen` uses a temporary modern-day Saigon map image as the
interaction surface, with SVG district hotspots for Districts 1, 4, 5, and
2 plus a district-details panel and a text fallback list. The current map
art is a placeholder for a future 2226-specific illustration, but the
interaction model is intended to stay the same.

### 6.2 Location Hubs

Every location is a **Location Hub** (`LocationHubScreen`) before it's a
scene — a `content/locationHubs.ts` `HubDefinition` (keyed by `HubId =
LocationId`) describing who/what is there, rendered either as a walkable
tile grid or a clickable card list depending on its `layout`.

**Adding a `cardList` hub** (the default for a location without much
authored content yet):
1. Add a `HubDefinition` with `layout: 'cardList'` to `LOCATION_HUBS`.
2. List its `characters: HubCharacterPresence[]` (each an `npcId` + an
   `anchor` position + a `storyLocationId` to launch) and
   `actions: HubActionDefinition[]` (`type: 'talk' | 'inspect'`).
3. Set `available`/`lockedReason` per entry to control what's clickable yet.

**Adding a `grid` hub** (once a location has enough authored content to be
worth walking around in — currently only `checkpoint`):

The Debug Console's **Map Builder** tool (§2, dev-only) paints this
visually and exports ready-to-paste JSON — easier than hand-typing the
ASCII grid below for anything bigger than a quick edit.

1. Set `layout: 'grid'` and author `grid.layoutRows`: one string per row,
   `.` floor, `#` wall, `o` POI, `d` door, ` ` (space) void. Void tiles
   aren't part of the location at all — not walkable, never rendered, never
   fogged — which is how a hub's footprint can be a non-rectangular shape,
   like a ring around a blank core, instead of always a filled rectangle.
2. For every `o` in `layoutRows`, add a matching `HubPoi` to `grid.pois`
   with the same `position` — the marker and the POI entry must line up
   1:1. A `HubPoi.interactions` is a list, so one tile can hold more than
   one talk/inspect entry (e.g. an NPC who's also inspectable).
3. For every `d`, add a matching `HubDoor` to `grid.doors` (same 1:1
   `position` rule) — see "Locked doors" below.
4. Set `grid.entryTile` (where the player spawns from the Overworld/street)
   and, if the default "+"-shaped 1-tile vision radius isn't right for this
   room, `grid.visionRadius`.
5. Movement is WASD/arrow keys, one tile per press; walls block movement
   outright, and a locked door can be stepped onto but not walked past (see
   "Locked doors" below). Standing on a POI tile opens its interaction list
   in a bottom action bar. The AR-scan panel's blurb line describes
   whatever square the player is currently standing on — a POI's or door's
   own description/`lockedReason` if standing on one, else the hub's
   general `blurb` — rather than staying fixed on the hub-wide blurb.
   Fog-of-war is per-hub, per-save, and never re-fogs once revealed.

**Talk portraits:** every `talk` interaction in the bottom action bar gets a
large, frameless `PortraitFrame` (`size="lg"`, explicit `width`/`height`
preserving the art's native ~2:3 aspect instead of a square crop) floating
above its button — positioned as a sibling via `bottom-full` rather than
living inside the action-bar `Panel`, so the panel itself stays a thin strip
and the portrait can rise above (and visually over) the grid viewport.
`conversationStore.hasMet(npcId)` false shows a solid black silhouette (the
`character` icon, fixed black rather than accent-tinted) and hides the NPC's
name on the button itself (`…` in its place); true shows that NPC's
`portraits.neutral` (or the usual initials fallback if no art is authored
yet) and their real name. Dimmed the same way a locked interaction's button
already is when `available` is false — met-ness and availability are
independent axes. `inspect` interactions render bare, no portrait.

**Locked doors:** a `HubDoor` (`{ id, position, unlockFlag, label,
lockedReason }`) gates a `d` tile behind `casefileStore.hasFlag(unlockFlag)`
— but the door tile itself can always be walked onto and read up close;
it's only stepping *past* it into the gated area that stays blocked until
the flag is set (walking back out the way you came always works). A POI
glimpsed through a locked door via fog-of-war is listed in "Known Places"
but disabled, not clickable-through. Unlike a wall, a locked door still
gets revealed by fog-of-war (rendered with a red tint + tooltip) since it's
meant to be seen, not hidden. Ink can set a flag itself now via
`set_case_flag` (§9), but `checkpoint`'s Inner Containment Wing (behind
`checkpoint-inner-wing-unlocked`) — still the only door authored so far —
doesn't call it yet: its `lockedReason` ("enough leverage to force the
issue") describes a real Case 1 investigation-progress gate that hasn't
been designed, so the Debug Console's Flags tool remains the only way to
open it for now.

Whichever layout, launching an interaction (`talk`/`inspect`) is the same
`selectLocation` → `loadStory` → `enterLocation` (audio) → `autosave`
sequence, and finishing that scene returns to the hub by default, not the
Overworld. "Map" (`NavRail` or the hub's own inline button) is the only way
back out, popping one layer at a time — to a District Street if the hub was
entered from one, otherwise straight to the Overworld.

### 6.3 District Streets

For districts with enough real destinations to be worth it,
`content/districtStreets.ts`'s `DISTRICT_STREETS` (currently `district4`
and `district1`) adds one more walkable layer between the Overworld and a
Location Hub: the exact same tile vocabulary and grid mechanics as §6.2
(including `d`/`doors` locked doors), except a `DistrictStreetPoi` just
names a `locationId` instead of carrying an interaction list — walking onto
one calls `enterLocationHub()` and transitions straight into that
location's Hub. A `DistrictStreetPoi`
deliberately doesn't store its own `available` flag; it's always derived
live from `navigationStore.unlockedLocationIds` so the street map can never
drift out of sync with the Overworld's own unlock tracking. Districts
absent from `DISTRICT_STREETS` keep the plain "district panel + Enter
button per location" flow from §6.1 — that's the default until a district
earns a street map of its own, which is a content-only addition (author a
`DistrictStreetDefinition`), not an engine change.

## 7. Save/Persistence

**Slots:** one system-managed Autosave slot (overwritten on returning to
the Overworld and on selecting a location) plus player-named manual slots
(create-new or overwrite), managed from `SettingsOverlay`'s `Save_Data`
section. `TitleScreen`'s Continue is enabled once `saveStore.hasAnySave()`
and loads the most recent slot.

**What's captured:** Insight state (levels, wellbeing, archetype, name,
consumed Red checks), navigation state (unlocked/selected locations), and
— if a scene is active — the serialized ink state plus which compiled
story it belongs to (`activeStoryId`). An Overworld-only save has both ink
fields `null`.

**UX notes:**
- No confirmation dialog before Load overwrites current in-memory
  progress — the player driving Load already knows what they're doing.
- No migration across save-format versions — a version mismatch is just
  treated as "no save" and silently discarded, never partially restored.
- Restoring a save that was mid-scene collapses that scene's *last shown
  batch* into a single block (loses the per-line narrator/NPC/Insight
  breakdown for that one batch only) — a known, deliberate simplification
  of how ink serializes state. Everything else (Insight values, wellbeing,
  consumed Red checks, story position, all choices going forward) restores
  exactly.
- `settingsStore` (audio/accessibility prefs) is **not** part of a save —
  it's a persistent-preference tier, always session-only regardless of
  save/load.

## 8. Audio

Three ink line tags (`music`/`ambience`/`voice`, §5.2) plus a location's
static baseline mood (§6) drive everything except UI interaction sound,
which is wired directly at the component level (below). All audio is
**session-only** — nothing here is part of a `SaveBlob`.

### 8.1 Content modules & asset paths

| Module | Shape | Asset path |
|---|---|---|
| `content/music.ts` | `MusicId` incl. reserved `'none'` sentinel (no `src`) | `/audio/music/<id>.mp3` |
| `content/ambience.ts` | `AmbienceId`, looped | `/audio/ambience/<id>.mp3` |
| `content/voiceClips.ts` | `VoiceClipId`, one-shot | `/audio/voice/<id>.mp3` |
| `content/sfx.ts` | `SfxId` → `SfxCategory` → variant pool | `/audio/sfx/<category-folder>/ui-<category>-<n>.mp3` |

A missing/failed-to-load asset is always a silent no-op — never a crash,
never a console error surfaced to the player.

**Currently real:** `titleTheme`/`introTheme` music, `engineIdle`/`rain`/
`marketChatter` ambience, all five SFX category packs (44 files). **Still
placeholder:** `content/voiceClips.ts`'s `meiHongIntro` is the only asset
path still pointing at a file that doesn't exist — real ElevenLabs
generation is unstarted.

### 8.2 UI interaction SFX

Not ink-tag-driven — button hovers etc. aren't a story concern. `SfxId`
("what interaction fired") maps to a `SfxCategory` ("which pool serves
it"); several ids share a category and `audioStore.playSfx(id)` picks a
random variant each call (via `audioEngine.pickSfxSrc`) so the same
interaction doesn't replay identically every time. `SFX_ID_OVERRIDE` can
pin one id to one exact file (currently just `buttonClick` → a specific
confirm variant) — checked before the random pool.

Wired once at the shared UI-primitive level, not per call site:
`CyberButton` (hover/click), `NavRail`'s `RailButton` (same pair — the one
deliberate store-import exception in an otherwise presentational
component), `ChoiceRow` (select only), `NeonCheckbox` (on/off),
`NeonSlider` (tick per quantized change), `OverlayHost` (open/close on
`activeOverlay` transitions), `InsightChip`/`CheckResultBlock` (one-shot
mount-effect stings).

Folder naming under `public/audio/sfx/` is self-documenting — each
category folder spells out every `SfxId` drawing from it (e.g.
`confirm--button-click+choice-select+checkbox-on+check-success/`), so
swapping a sound pack means finding the folder that names the interaction
you want to change, no need to cross-reference `content/sfx.ts`.

### 8.3 Adding a new music/ambience/voice asset

1. Convert to mp3 if it isn't already (`npm run audio:convert`, needs
   ffmpeg on PATH — never commit `.wav` files).
2. Drop it under the right `public/audio/<kind>/` directory.
3. Add the id + `src` entry to the matching content module.
4. Tag it in `.ink` content (`music:`/`ambience:`/`voice:`) or as a
   location's baseline mood, then `npm run compile:ink`.

## 9. Casefile / Evidence

`content/casefile.ts` — `EVIDENCE: Record<EvidenceId, EvidenceDefinition>`
with a three-tier `EvidenceTier` (`flavor`/`clue`/`key`, mapped to a
color-tier system for at-a-glance importance) and `CASE_NOTES:
Record<CaseNoteId, CaseNoteDefinition>` — define the authored content.
Ownership/unlock state is tracked separately, in `stores/casefileStore.ts`
(`evidenceIds`/`noteIds`/`flags`, save-integrated — Architecture §13);
`CasefileOverlay` renders only what's owned, never the full list.

Both content records are still static, flavor-light placeholders — real
Case 1-canonical evidence/notes haven't been authored yet — but the
ink↔TS boundary can now grant them. Three EXTERNALs, bound in
`storyEngine.ts`'s `bindCasefileFunctions` the same way `bindCheckFunctions`
binds check calls: `gain_evidence(id)` and `unlock_note(id)`, each validated
against `content/casefile.ts`'s `EVIDENCE_IDS`/`CASE_NOTE_IDS` (an unknown
id throws, same as an unknown insight name in `roll_check`), and
`set_case_flag(flag)`, which takes any non-empty string — flags aren't a
closed content set, so there's nothing to validate against. Declare only
the ones a scene actually calls, same convention as check/wellbeing
EXTERNALs (§5.3). `checkpoint.ink` calls all three today (`gain_evidence`/
`unlock_note` on its Red-check success path); how much of Case Notes should
auto-populate from play vs. be hand-authored per scene is still an open
design question, not something this wiring answers. `flags` also gates
Location Hub locked doors (§6.2) — the Debug Console's Flags tool
(`casefileStore.setFlag`/`clearFlag`) remains available for testing, but
ink content can set them directly now too.

## 10. Relationship / Affinity

Every NPC has a hidden **affinity score**, `-10` (sworn rival) to `+10`
(love of your life), defaulting to `0` (stranger/neutral) —
`stores/relationshipStore.ts`, save-integrated (Architecture §14). It's
never shown anywhere in the UI; players only ever learn where they stand
through what an NPC says or does, or a Thought that names it (§4/§9-style
unlock), never a visible number.

Ink content nudges it with one `EXTERNAL`, declared and called the same
way as the wellbeing/casefile calls above:

```ink
~ adjust_affinity("lakshmiAvani", 1)
```

`npcId` is any `content/npcs.ts` `NpcId` string — an unknown one throws,
same as an unknown insight name in `roll_check`. To read the current score
back for a conditional, declare the NPC's synced global —
`affinity_<snake_case npc id>` (`lakshmiAvani` → `affinity_lakshmi_avani`,
`meiHong` → `affinity_mei_hong`) — and it stays live for the rest of the
session, same as `VAR ledger`/`VAR archetype`:

```ink
VAR affinity_lakshmi_avani = 0
{ affinity_lakshmi_avani >= 3:
    She actually smiles at you this time.
- else:
    Still a little guarded.
}
```

Declare only the ones a scene actually uses (§5.3's convention).

**Suggested tiers** for writing against — convention only, nothing in code
enforces these names:

| Range | Reading |
|---|---|
| -10 to -6 | sworn enemy, actively hostile |
| -5 to -2 | distrustful, cold |
| -1 to +1 | stranger / neutral (default) |
| +2 to +4 | warm, friendly |
| +5 to +7 | close, trusts you |
| +8 to +10 | deeply attached / love interest |

Keep nudges small so an arc reads as gradual rather than swingy: routine
curiosity/kindness ≈ **+1**, a genuinely vulnerable or caring choice ≈
**+2**, dismissiveness/coldness ≈ **-1**, a real betrayal-coded choice ≈
**-3 or more**, reserved for rare, clearly-telegraphed moments.

No ink content calls `adjust_affinity` yet — the Debug Console's
Relationship tool (`DebugRelationshipTool.tsx`) is the only way to move a
score today, for testing ahead of real content.
