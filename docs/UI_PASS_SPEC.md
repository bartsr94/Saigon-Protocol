# UI Pass — Spec

*Pre-implementation spec (CLAUDE.md's `docs/*_SPEC.md` convention) for a
four-part UI pass: adopt more of `UI inspo/`'s design language, enforce a
no-scroll layout law, enforce a no-button-overlap law, and add a dedicated
Conversation View for repeat NPC talk. Nothing here is built yet. Once
implemented, fold the relevant pieces into `GAME_GUIDE.md` (screens/visual
system) and `SAIGON_PROTOCOL_ARCHITECTURE.md` (any new store/engine surface)
and delete this file, per CLAUDE.md's doc-lifecycle rule.*

---

## 1. Visual design language — adopting more of `UI inspo/`

The five mockups in `UI inspo/` already share our exact token set — same
hex colors (`#00f2ff`/`#ff00ff`/`#050505`), same fonts (Orbitron/Rajdhani),
same cut-corner `clip-path` idiom at multiple scales, same backdrop-blur +
inset/outer glow chrome. That part of "the design language" is already
built. What's actually missing, checked mockup-by-mockup against what we
ship:

| Treatment | Where in `UI inspo/` | Current state | Verdict |
|---|---|---|---|
| Background grid + full-screen scanline overlay | Every mockup (`.cyber-grid`/`background-image` grid, `.global-scanlines`) | Absent from `index.css`/`App.tsx` entirely | **Adopt.** Cheap, consistent atmosphere; appears in 100% of the reference set, so it reads as core to the language, not a one-off. |
| Button hover "pop" (`scale(1.05) translateX(10px)` + `flicker` animation) | `Neon Game Menu.html`, `Neon Settings Menu.html` | `CyberButton` only changes color/glow on hover (`src/components/ui/CyberButton.tsx:31`), no motion | **Adopt**, gated by `reduceMotion` the same way every other looping/flicker effect already is (`GAME_GUIDE.md` §3.4). |
| HUD corner-bracket frame accents (`.hud-corner`) | `Neon Game Menu.html` | Not present anywhere | **Adopt as a Title/full-screen-frame accent** — decorative, low-risk, matches the "military sci-fi" register the rest of the chrome already commits to. |
| Rarity/tier color-coded grid slots | `Neon Inventory Grid.html` | **Already built** — `CasefileOverlay.tsx`'s `TIER_COLOR` map (`flavor`/`clue`/`key` → white/cyan/gold, with glow-on-select) is functionally the same pattern | **No action.** Flagging so we don't duplicate work — this one's already in the design language. |
| Animated diagonal-striped bar fill (HP/MP/SP) | `Neon HUD Overlay.html` | `PipTrack` uses discrete pips on purpose ("exact remaining points read at a glance," `GAME_GUIDE.md` §2.1) | **Do not adopt.** This is a deliberate, documented departure from the mockup, not a gap — leave `PipTrack` alone. |
| Bottom-center dialogue box with inline portrait | `Neon Dialogue System.html` | We use a 75/25 side-panel split instead | **Do not adopt** — confirmed with the user; the dialogue log stays on the right. This mockup's *layout* isn't the target, its chrome/typography already is. |

Net effect: two small global CSS additions (grid + scanlines) and one
`CyberButton` motion tweak, plus a Title-screen-only decorative accent. No
component gets rebuilt.

---

## 2. Layout law — no scrolling except the dialogue log

**Rule:** every screen/overlay must fit the viewport it's given. The one
exception is `DialogueScreen`'s transcript log (`logRef`, right-hand panel)
— a growing conversation history is expected to scroll.

### 2.1 Audit findings, most to least urgent

| # | Screen | Problem today | Fix direction |
|---|---|---|---|
| 1 | `HubCardListView.tsx:36,106` | **Worse than scrolling** — the outer wrapper is `overflow-hidden` with *no* scroll container on the talk/inspect card grid at all. More than ~4-6 entries in one hub are silently clipped and unreachable, not scrolled-to. | Cap visible entries with a "+N more" affordance, or move to a denser multi-column grid that can hold more before it ever needs a cap. This is also the hub that Conversation View's topic bar will eventually make less relevant for talk-heavy hubs (see §4) — worth fixing the general case regardless, since `inspect` actions and non-topic NPCs still route through it. |
| 2 | `ChargenArchetypeStep.tsx` | Full-height archetype cards stacked vertically, zero scroll container, on a `min-h-svh` (not `h-svh`) page — likely already overflows on common laptop resolutions today. | Reduce card density (smaller portrait/backstory truncation) or switch to a grid instead of one full-width card per row. |
| 3 | `CasefileOverlay.tsx:57,100` | Evidence grid and Case Notes log both `overflow-y-auto` inside a `max-h-[85vh]` panel — already scrolls with today's near-empty placeholder content, guaranteed to be a real problem once Case 1 content lands. | Evidence: the 4-column grid already has density headroom — extend it, add filter/search once the list is large. Case Notes: needs a denser row treatment or its own filter, separate from Evidence's scroll region. |
| 4 | `OverworldScreen.tsx:58,223-248` | Per-district location list `overflow-y-auto`s already — District 4 alone has ~7 locations. | Multi-column card grid instead of single-column list, or cap to N visible + "show more." |
| 5 | `SettingsOverlay.tsx:96-124,137` | The whole two-column content grid shares one `overflow-y-auto`, but only the Save_Data manual-slots list is actually unbounded — Audio/Visual sections are fixed-size and shouldn't be dragged into the same scroll region. | Give Save_Data its own scroll/cap region, separate from Audio/Visual. Consider capping manual saves (delete-oldest or pagination) so the list itself stays bounded. |
| 6 | `App.tsx:85-138` dev corner buttons | Dev-only, but a live instance of the button-overlap rule too (see §3) — independent `right` offsets with no width reservation. | Covered in §3's fix list. |
| 7 | `HubGridView.tsx` "Known Places" list, `CharacterOverlay.tsx` Insights list, `CharacterCreationScreen.tsx` page-level | Lower urgency — structurally bounded today (fixed 7-Insight list, hub POI count is small) but not scroll-proofed against Large Text or longer authored copy. | `max-height` + graceful truncation as a robustness pass, not urgent. |
| — | `DistrictStreetView.tsx`, `TitleScreen.tsx`, `FailStateOverlay.tsx`, `OverlayHost.tsx` | Fine as-is. | No action. |
| — | `DebugOverlay.tsx` / `MapEditorPanel.tsx` (dev-only) | Already built as a scrolling tool panel; never ships. | Out of scope — dev tooling is exempt from this rule. |

### 2.2 A shared enforcement point

`OverlayHost.tsx` hosts every overlay (`Casefile`/`Settings`/`Character`),
and all three independently reproduce the same `max-h-[85vh]` + inner
`overflow-y-auto` pattern. Worth standardizing there — e.g. `OverlayHost`
itself enforces the max-height contract and each overlay only owns which
*inner* region (if any) is allowed to scroll, rather than every overlay
re-deriving the outer cap.

---

## 3. Layout law — buttons/panels never overlap

**Rule:** interactive elements must never visually collide. Findings below,
ranked by how real/urgent they are today (not just structural risk).

| # | Where | Risk | Status | Fix direction |
|---|---|---|---|
| 1 | `HubGridView.tsx:281` / `DistrictStreetView.tsx:268` local `editingMap` modal vs. `OverlayHost.tsx:27`'s `uiStore.activeOverlay` modal | Both are independent `fixed inset-0 z-50` mechanisms with no mutual exclusion — opening Settings/Character/Casefile while the Map Editor modal is already open stacks two full-screen backdrops, and a click meant to close one can fire the other's backdrop-close handler underneath, silently discarding unsaved Map Editor state. | **Real, current bug** (dev-only — Map Editor is gated behind `import.meta.env.DEV && mapEditEnabled`). | Unify into one modal mechanism, or at minimum make them mutually exclusive (disable NavRail-triggered overlays while `editingMap` is true). |
| 2 | `HubCardListView.tsx:62-103` | NPC-talk buttons are placed by raw `presence.anchor.x/y` percentages with no validation of spacing from each other or from the header/card-grid panels. Currently dead code — every `cardList` hub in `content/locationHubs.ts` has `characters: []` — so nothing overlaps *yet*. | **Latent structural risk**, will bite the first time someone authors anchored NPCs. | Replace free-form percentage placement with a layout that structurally can't overlap (flex/grid-based anchoring), or add an authoring-time validation that rejects anchors placed too close together. Also only renders `xl:` and up — below that it already falls back safely to a stacked `CyberButton` list, which is the right instinct to generalize. |
| 3 | `App.tsx:85-138` dev corner buttons | Three siblings (`Debug`/`Edit Text`/`Edit Map`) each independently `fixed`-positioned by hand-picked `right` offsets, each width content-driven by a label that toggles length ("On"/"Off"). Gaps hold today but this is exactly the anti-pattern the rule should forbid. | Dev-only, zero player-facing impact. | Collapse into one flex row so spacing is automatic instead of magic-number offsets. |
| — | `HubGridView.tsx`/`DistrictStreetView.tsx` bottom interaction bar (`min-h-[6rem]`, unbounded `flex-wrap`) | Growth here squeezes the tile-grid area above it rather than overlapping another button — this is a §2 scroll/fit issue, not an overlap one. | Redirected to §2. | — |
| — | `ChoiceRow`, `CyberButton`, `NavRail` primitives | No absolute/fixed positioning, no hardcoded sizing — no inherent overlap risk. Any overlap traces back to a caller (i.e. #2 above), not the primitives. | No action. | — |

---

## 4. Conversation View

### 4.1 The problem

Today, every "Talk" interaction (`HubGridView`'s bottom action bar,
`HubCardListView`'s Talk cards) calls
`LocationHubScreen.enterStory(id: LocationId)`, which does
`loadStory(LOCATION_STORY_JSON[id], undefined, id)` — **no saved state, every
time.** Clicking Talk always restarts that location's entire `.ink` file
from the top, regardless of how many times you've already spoken to that
NPC. There's also no per-NPC content unit today — a hub POI's `talk`
interaction points at the whole location's one scene
(`storyLocationId`), so e.g. `checkpoint`'s Mei Hong, Responding Officer,
and Sora Baek POIs all currently point at the same placeholder guard-queue
scene.

### 4.2 Decided shape

- **First meeting** stays exactly what it is today: the location's existing
  authored scene, played via `DialogueScreen`, ending normally.
- **Every visit after that** routes to a new **Conversation View** —
  full-screen takeover, sibling of `DialogueScreen` — showing a topic bar
  instead of replaying the scene.
- **Topics are ink content**, not new TS data: gated `* { condition } [...]`
  choices inside a knot, same mechanism every other ink choice already uses.
- **One `.ink` file per location stays the convention** — an NPC's topics
  are knots inside their location's existing file, not a new per-NPC file.

### 4.3 Mechanism

**"Met" and "has a topic conversation to resume" collapse into one signal:**
whether we have saved ink state for that NPC. No separate boolean to keep in
sync with anything.

1. **New store** (not bolted onto `casefileStore` or `storyStore` — this is
   its own slice of simulation state, per CLAUDE.md's "simulation never
   lives in a component" rule and the six-systems pattern):
   `conversationStore` — `metNpcIds: Set<NpcId>`,
   `stateByNpc: Partial<Record<NpcId, string>>` (serialized ink state,
   `story.state.toJson()`), with `markMet(npcId)`, `saveConversationState
   (npcId, json)`, `getConversationState(npcId)` — all idempotent/pure
   reducers, same shape as `casefileStore`'s existing grant methods.

2. **Content authoring:** a topic-capable NPC's `HubInteraction` (currently
   `type: 'talk'`, already carries `npcId`) gains an optional
   `topicsKnot?: string` — the ink path to that NPC's topic-loop knot (e.g.
   `'mei_hong_topics'`). Absent `topicsKnot`, Talk behaves exactly as today
   for that NPC — no topic mode, always replays the scene. This makes the
   feature opt-in per NPC, so minor/background NPCs (Responding Officer,
   Sora Baek) aren't forced into authoring topics before they're ready.

   In `.ink`:
   ```ink
   === mei_hong_topics ===
   { some_flag: * [Ask about the checkpoint. # insight: ledger]
       ... topic content, can include roll_check() same as any choice ...
       -> mei_hong_topics
   }
   * [Ask about the lab. # check: white]
       ...
       -> mei_hong_topics
   ```
   Topics loop back into their own knot after playing out — the ink Story
   is always left "parked" showing the topic menu whenever Conversation
   View is on screen. `-> END` stays available for a writer who deliberately
   wants a topic to close off further conversation (e.g. an NPC who
   storms off) — that's an authorial choice, not something the engine
   needs to special-case.

3. **Engine change (small, scoped):** `storyStore.loadStory` gains an
   optional `entryKnot` param. When no saved state is supplied and
   `entryKnot` is given, call `story.ChoosePathString(entryKnot)` before the
   first `advance()`. This is what lets a *fresh* per-NPC Story jump straight
   into `mei_hong_topics` instead of the file's default start (which isn't
   any particular NPC's content, since the file is shared). Every other
   `loadStory` call site is unaffected (param omitted).

4. **"Leave Conversation" is TS-only, not an ink choice.** It calls
   `conversationStore.saveConversationState(npcId, story.state.toJson())`
   and returns to the hub — it never advances the ink story. This is what
   keeps the Story permanently resumable at its topic menu rather than
   accidentally terminating it.

5. **Routing:** `LocationHubScreen`'s `enterStory` needs to become
   NPC-aware. When a clicked `talk` interaction has an `npcId` +
   `topicsKnot` **and** `conversationStore.metNpcIds.has(npcId)`, route to
   Conversation View instead of `DialogueScreen`:
   - Fresh: `loadStory(LOCATION_STORY_JSON[locationId], undefined, storyId,
     topicsKnot)`
   - Resumed: `loadStory(LOCATION_STORY_JSON[locationId],
     conversationStore.getConversationState(npcId), storyId, topicsKnot)`
     (`entryKnot` is a no-op once `savedStateJson` is supplied, since the
     restored pointer already knows where it is)

6. **Marking met:** when a `talk` scene (the *first-encounter* path, not a
   conversation) ends, we need to know which `npcId` was being talked to, to
   call `conversationStore.markMet(npcId)`. `enterStory`/`loadStory` don't
   currently thread an `npcId` through at all — this needs new, explicit
   plumbing (e.g. `loadStory` accepts an optional `{ npcId, topicsKnot }`
   context that `DialogueScreen`'s `finalizeEndedScene` reads back when
   `ended` becomes true) rather than being inferred from ink's own
   `speaker:` tags, which track *who's currently talking on screen*, not
   *which interaction the player clicked* — different, already-existing
   mechanism (`activeNpcId` in `DialogueScreen.tsx:191`), don't conflate the
   two.

7. **App.tsx routing:** the `'game'` screen switch (`App.tsx:63-72`)
   currently shows `DialogueScreen` whenever `storyStore.story` is truthy.
   Conversation View's Story is *also* a truthy `story`, so we need a
   discriminator. Recommend an explicit `storyMode: 'scene' | 'conversation'`
   field on `storyStore` (set by whichever `loadStory` call site is doing
   the loading) rather than sniffing `activeStoryId`'s string shape —
   keeps this codebase's existing preference for typed state over
   string-parsing. `App.tsx` then picks `ConversationScreen` vs
   `DialogueScreen` off that field.

8. **Save format:** add `conversation: SerializedConversationState`
   (`{ metNpcIds: NpcId[]; stateByNpc: Partial<Record<NpcId, string>> }`) to
   `SaveBlob`, mirroring the existing `casefile: SerializedCasefileState`
   top-level slice — bump `SAVE_FORMAT_VERSION` (currently 7 → 8). Separately,
   a save taken *while actively inside* Conversation View should keep
   working through the *existing* single `inkStateJson`/`activeStoryId`
   fields (same as any mid-scene save today) — `activeConversationNpcId`
   (new, parallel to `activeStoryId`) tells restore-on-load which screen to
   route back into.

### 4.4 Screen design

New `ConversationScreen.tsx`, structurally a sibling of `DialogueScreen.tsx`
— reuses its layout, not the `Neon Dialogue System.html` mockup's
bottom-center composition (confirmed: dialogue stays on the right, §1).

- **Left:** `NavRail`, same as every other in-game screen. MAP returns to
  the hub (same as `HubGridView`'s "Return to Map"), not the Overworld.
- **Center stage:** the NPC's portrait, persistent for the whole
  conversation (only one NPC ever speaks in a given Conversation View
  instance) — this is a good moment to promote `DialogueScreen`'s
  currently-bespoke center-stage portrait block (`DialogueScreen.tsx:361-383`,
  a hand-rolled `clipPath`/border/glow div, *not* using the `PortraitFrame`
  primitive) into something both screens share, rather than writing a
  second bespoke block for Conversation View. Worth doing regardless of
  Conversation View — it's an existing small inconsistency.
- **Right:** the same `Panel size="lg"` dialogue-log treatment
  `DialogueScreen` already uses, showing the current topic's ink text as it
  plays out (topics can contain their own nested choices/checks before
  looping back to the topic menu — `CheckResultBlock` etc. all apply
  unchanged).
- **Bottom:** a topic bar — reuses `HubGridView`'s bottom-action-bar visual
  pattern (`Panel` + wrapped `CyberButton`s, `HubGridView.tsx:261-277`) —
  one button per ink choice from `currentChoices` (i.e. the available
  topics, already gated by whatever conditions the author wrote), tagged
  `"Topic"`, plus one more always-present button — **"Leave Conversation"**
  — visually distinguished (secondary/magenta accent) from topic buttons
  since it's the one action that isn't an ink choice at all.

### 4.5 Scope note

This only wires up NPCs that get an authored `topicsKnot` — starting with
Mei Hong. Everyone else keeps today's behavior (Talk always replays the
scene) until/unless they're authored into topic mode too. No existing
content needs to change to ship this.

---

## 5. Open questions to resolve during implementation

- `HubCardListView`'s anchor-overlap fix (§3 #2) and its scroll/clipping fix
  (§2 #1) touch the same component — worth doing in one pass rather than two.
- Whether Conversation View should also be reachable from `cardList`-layout
  hubs (today only `checkpoint`, a `grid` hub, has real NPC POIs) once a
  `cardList` hub gets `characters` populated — the mechanism as specced is
  layout-agnostic (keys off `HubInteraction.npcId`/`topicsKnot`, not the
  hub's `layout`), so this should fall out for free, but worth confirming
  once a second hub actually authors topics.
- `OverlayHost`'s shared max-height enforcement (§2.2) is a refactor of
  existing working code — sequence it independently from the two audits'
  per-screen content fixes so it doesn't block them.
