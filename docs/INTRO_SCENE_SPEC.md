# Intro Scene — Spec

*Settled design, written before implementation. Companion to
`SAIGON_PROTOCOL_ARCHITECTURE.md` §2/§3 and `SEA_CYBERPUNK_GDD.md` §2
(Player Premise & Story Hook), which establish the detective framing but no
concrete opening content.*

---

## Problem

`SEA_CYBERPUNK_GDD.md` §2 establishes the premise — a detective assigned a
case that looks routine and unravels — but nothing concrete exists yet.
Right now, confirming Character Creation drops the player straight onto the
Overworld's placeholder location cards (`checkpoint`/`noodleStall`/
`deltaSquat`, all flavor-light dev fixtures per `NAVIGATION_OVERWORLD_SPEC.md`)
with no scripted opening and no real narrative content beyond the throwaway
`demo.ink` wiring fixture.

## Scope

**In scope:**
- A single scripted cold-open scene (`content/ink/intro.ink`) — the
  player's actual Case #1 opening, told as a three-beat squad-car montage:
  Cholon departure, the crossing into District 4, and arrival at a small
  Aveline Biogenetics lab tucked against the district's flood wall, ending
  with the first meeting with Mei Hong, who frames it as a break-in and
  stonewalls on specifics. Two new backdrop-only beats (`cholonMarket`,
  `district4FloodWall` in `content/backgrounds.ts`, alongside the existing
  `avelineLabExterior`) and a narrator-voice beat with the two uniforms
  posted outside the lab (pointing the detective to Mei Hong, no new NPC
  entry) fill out the montage.
- Wiring so this scene auto-plays exactly once, immediately after Character
  Creation confirms — before the player ever sees the Overworld.
- A handful of Insight interjections during the drive/arrival (`root`,
  `static`, `ledger`, and a new `hustle` beat reacting to how thin the
  dispatch briefing is), using the existing line-tagging convention
  (`docs/INK_CONTENT_TAGGING_SPEC.md`), reactive to Insight level the same
  way `demo.ink`'s `muscle_memory >= 3` check already is.
- Reusing the existing `meiHong` NPC entry (`src/content/npcs.ts`) — this is
  her first real appearance; the header comment there is stale (predates the
  tagging convention landing, see Design) and gets corrected alongside this.

**Out of scope** (deferred, explicitly not built here):
- Any investigation content beyond this one scene — what the player actually
  does once the intro ends and the Overworld opens up (new locations,
  evidence, follow-up dialogue with Mei Hong) is a separate future task.
  The existing placeholder Overworld cards are untouched.
- Checks or wellbeing damage in this scene. Per the Saigon Constabulary lore
  note ("the opening case should read and play as ordinary Constabulary
  work... nothing that signals the player is being watched"), this is
  deliberately a no-stakes-yet scene — no White/Red check fires, no
  `damage_vitality`/`damage_composure` calls. `intro.ink` declares no
  `EXTERNAL`s at all as a result (see Design).
- Persisting "has the player seen the intro" across saves, or gating whether
  Continue/a loaded save re-plays it. The Save/Persistence Layer's autosave
  checkpoints (`docs/SAVE_PERSISTENCE_SPEC.md`) already fire correctly the
  first time the player reaches the Overworld (see Design) — a returning
  player's save always resumes past the intro, never re-triggers it. No new
  persistence work needed.
- A scene-title / location-name display for the intro. `DialogueScreen`
  currently derives the label under the center stage from
  `navigationStore.selectedLocationId`, which is legitimately `null` here
  (this isn't a location) — it falls back to the generic "Scene" label
  during the drive, before Mei Hong's NPC tag takes over. A future
  `# location: <label>` line-tag convention could address this; not worth
  inventing for one scene.
- New `docs/lore/` content (e.g. a District 4 write-up). The lore vault
  (`docs/lore/`) is the player-authored canonical worldbuilding source per
  its own `Factions.md`; this spec places District 4 consistently with what
  the vault already establishes (edge of the defended core, adjacent to the
  District 2/7/9 sacrifice line, flood-wall infrastructure per
  `Climate — Saigon SEZ.md` / `Saigon SEZ — City Geography.md`) but doesn't
  add a new lore document. Worth a short stub later; a call for whoever owns
  the vault, not bundled into this content pass.

## Design

### Narrative beats (`content/ink/intro.ink`)

Linear scene, broken into three pacing choices (non-mechanical — no
`insight`/`check`/`locked` tags, just "continue"):

1. **Leaving Cholon** (`# background: cholonMarket`). Squad car pulls out of
   Cholon's density (Population & Demographics' texture notes: layered
   languages, market density) toward District 4. `root >= 3` — homesickness/
   cultural-memory beat. A second beat has the detective register how thin
   the dispatch slip is (a name and an address, nothing else); `hustle >= 3`
   sharpens this into an explicit "they want me walking in blind" read —
   low-Hustle players still get the plainer "thin briefing" version, per GDD
   §4's "weakness opens a different branch, never a missing one." Ends on
   `* [Keep driving.]`.
2. **Crossing into District 4** (`# background: district4FloodWall`) — lower,
   water-stained, the flood wall looming (City Geography's
   verticality/class framing; Climate's flood-wall infrastructure).
   `static >= 3` — climate-dread beat over the flood wall. Then the baseline
   narrator observation every player gets: Aveline runs its own security
   like every other SEZAC name, so a Constabulary detective actually
   showing up is itself strange (Saigon Constabulary lore: "Compact
   interference arrives later, not immediately" — this should read as an
   ordinary-but-odd case, not a signal of danger). `ledger >= 3` sharpens
   this into an explicit corporate-leverage read rather than replacing it.
3. **Arrival** (`# background: avelineLabExterior`) — the small,
   unglamorous prefab lab bolted to the inside of the flood wall, now with
   two SEZAC cruisers instead of one. Two uniforms posted outside greet the
   detective and point them at the door ("She's inside...") —
   narrator-voice, no `speaker` tag, since two background cops don't
   warrant a `content/npcs.ts` entry/portrait of their own. Ends the second
   pacing choice (`* [Head in.]`).
4. **Mei Hong.** `# speaker: npc:meiHong` lines: she frames it as a
   break-in, refuses to specify what was taken beyond "proprietary tech,
   dangerous in the wrong hands." A second `ledger >= 3` interjection reads
   her stonewalling as a deliberate, real-time decision about how much
   truth to spend, not boilerplate.
5. **Close** — one final line, one closing choice (`* [Get to work.]`) ->
   `END`. No mechanical hook is needed beyond the stonewall itself; the
   case is now open.

Every conditional uses an explicit `- else:` branch (matching `demo.ink`'s
established pattern) rather than a bare conditional with no else, so every
path always emits exactly one line — avoids relying on inkjs's
empty-line-on-false behavior, which `DialogueScreen`'s `StoryLineEntry`
tolerates (`text.length === 0` guard) but is unnecessary to lean on here.

`intro.ink` declares `VAR ledger = 0`, `VAR root = 0`, `VAR static = 0`,
`VAR hustle = 0` — only the four Insights it actually gates on, following `storyStore.test.ts`'s
`TWO_TURN_INK` fixture's precedent of declaring a subset, not `demo.ink`'s
full seven-plus-`EXTERNAL`s set. No `EXTERNAL` declarations at all: this
scene never calls `roll_check`/`is_red_check_consumed`/any wellbeing
function, and `bindCheckFunctions`/`bindWellbeingFunctions` binding a name
the ink source never declares is already proven harmless (that's exactly
what `TWO_TURN_INK` does for three of the six).

### Wiring: auto-play right after Character Creation

The load-bearing realization here is that `storyStore.story`'s presence,
not `navigationStore.selectedLocationId`, is the real signal for "should the
player see `DialogueScreen`." `selectedLocationId` is metadata *about* the
active story (which location it belongs to, if any) — it was only ever
being used as a proxy for "is a story active" because until now every
active story came from selecting a location. The intro breaks that
coincidence: it's an active story with no location.

- **`src/App.tsx`** — swap the render discriminator from
  `navigationStore.selectedLocationId` to `storyStore.story`:
  `{screen === 'game' && (activeStory ? <DialogueScreen /> : <OverworldScreen />)}`.
  This is a pure generalization, not a behavior change for the existing
  paths: a location-selected story still has `story !== null`, an
  Overworld-taken save still resets `story` to `null` alongside
  `selectedLocationId`, and a mid-scene-taken save still restores both
  together (the Save/Persistence Layer's own invariant — see
  `SAVE_PERSISTENCE_SPEC.md`'s "always captured/restored together" note —
  is preserved; this change doesn't touch it).
- **`ChargenConfirmStep`'s "Begin"** (wired via `CharacterCreationScreen`) —
  its confirm handler now calls `storyStore.loadStory(introStoryJson)` in
  addition to the existing `goToGame()`. No new `uiStore` screen value is
  needed: `screen` goes straight to `'game'`, same as today, and
  `App.tsx`'s new discriminator shows `DialogueScreen` because a story is
  loaded — exactly the same mechanism a location hand-off already uses.
- **Leaving the intro** — reuses `DialogueScreen`'s existing
  `handleReturnToOverworld` (the nav rail's map icon) completely unchanged.
  `navigationStore.returnToOverworld()` is a no-op (`selectedLocationId` was
  already `null`), `storyStore.reset()` clears `story` so `App.tsx` swaps to
  `OverworldScreen`, and `saveStore.autosave()` fires — this *is* the "back
  on the Overworld" checkpoint the Save/Persistence Layer already defines,
  now naturally also serving as the game's very first autosave. No new exit
  affordance, no special-casing for "was this the intro."

### `src/content/npcs.ts` (edit)

The header comment is corrected: it currently claims no content-tagging
convention exists yet and that Mei Hong's render is hardcoded — both are
stale (the tagging convention shipped, and this scene is her first *real*
tagged appearance, not a test render). No shape/data changes.

## Verification

- New cases in `storyStore.test.ts` (same file the `demo.json` end-to-end
  cases already live in), loading the real compiled `intro.json`:
  - Opening batch (before any choice) contains the Cholon-departure/
    dispatch-slip text only; a `root >= 3` archetype surfaces the Root
    interjection, a `hustle >= 3` archetype surfaces the Hustle one, neither
    appears otherwise.
  - After `[Keep driving.]`, the batch contains the flood-wall/arrival text;
    the Ledger interjection appears/doesn't per `ledger >= 3`, the Static
    one per `static >= 3`; the arrival line carries
    `background: 'avelineLabExterior'`.
  - After `[Head in.]`, Mei Hong's lines carry `{ type: 'npc', npcId: 'meiHong' }`,
    and none of that batch's lines carry a `background`.
  - After `[Get to work.]`, `ended` is `true` with no further choices.
- Manual browser pass (done this session): confirmed Character Creation
  lands directly in the intro (not the Overworld); the three-beat montage
  paces correctly through `[Keep driving.]` / `[Head in.]` / `[Get to
  work.]`; a Hustler archetype surfaces the new Hustle interjection; the
  `avelineLabExterior` art renders at arrival (the two new backgrounds have
  no art yet and correctly render nothing, per `DialogueScreen`'s
  missing-art fallback); the Overworld only becomes visible after
  `[Get to work.]`.
- `npm run lint`, `npx tsc -b`, and `npm test` clean.
