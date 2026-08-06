# Saigon Protocol — UI Design Document

*Companion to SEA_CYBERPUNK_GDD.md and SAIGON_PROTOCOL_ARCHITECTURE.md. Covers screen layout, view inventory, and interface behavior. References the mechanics defined in the GDD (Insights, White/Red checks) and the systems defined in the architecture doc.*

**Visual reference points:** Disco Elysium and Celestial Return — text-forward, illustrated, moody neo-noir. Dialogue lives in a panel on the **right**; the **left and center** are a visual stage showing the player's status and the character currently being spoken to.

---

## 1. Design Principles

- **Text is the primary interface.** The right-hand dialogue panel is where the player spends most of their attention. Everything else supports it.
- **The stage sells the world.** The left/center visual area carries mood and character through illustration, since there's little moment-to-moment "gameplay" animation to do that job.
- **Nothing mechanical hides in prose.** Checks, Insight-gated options, and White/Red status are always visually marked, never buried in flavor text (this is a known Celestial Return weak point we're deliberately avoiding).
- **Readable first, stylish second.** Neon-noir styling never comes at the cost of text legibility — this is a reading-heavy game.
- **Voice is a garnish, not a crutch.** Voiced lines (intros/greetings) enhance first impressions; the game must play perfectly with audio off.

---

## 2. Screen / View Inventory

The game is a small set of full-screen views plus a few overlays. Overlays pause the view beneath rather than replacing it.

| # | View | Type | Purpose |
|---|---|---|---|
| 2.1 | Title / Boot | Full screen | Entry point: new game, continue, settings |
| 2.2 | Character Creation | Full screen (multi-step) | Archetype pick → free points → backstory |
| 2.3 | **Dialogue / Scene** | Full screen | **The core loop** — narration, dialogue, choices, checks |
| 2.4 | Overworld / Navigation | Full screen | Diorama with clickable location hotspots |
| 2.5 | Character / Insights | Overlay | View Insight levels, voices, backstory |
| 2.6 | Inventory / Casefile | Overlay | Items/evidence and case notes |
| 2.7 | Pause / System Menu | Overlay | Save, load, settings, quit |
| 2.8 | Settings | Overlay | Audio (incl. voice toggle), text speed, accessibility |

---

## 3. The Dialogue / Scene View (core layout)

This is the screen the player sees most, and it implements the layout you specified: dialogue panel right, status top-left, character portraits center, menu buttons bottom-left.

```
┌───────────────────────────────────────────────┬───────────────────────────┐
│ ┌────────┐                                     │  DIALOGUE / NARRATION LOG │
│ │ PLAYER │  DET. [NAME]                        │  (scrolls; newest at      │
│ │ PORTRAIT│  ▓▓▓▓▓▓▓░░░  Composure             │   bottom)                 │
│ │ (you)  │  ▓▓▓▓▓░░░░░  Vitality              │                           │
│ └────────┘                                     │  Narrator: The rain hasn't│
│                                                │  stopped in three days... │
│                                                │                           │
│                                                │  ┌──┐ THE LEDGER          │
│              ┌─────────────────┐               │  │▓▓│ This one's stalling.│
│              │                 │               │  └──┘ Ask about the money.│
│              │   NPC PORTRAIT  │               │                           │
│              │  (center stage, │               │  MAREN: "You're early,    │
│              │   speaking      │               │  detective. That's rare." │
│              │   character)    │               │                           │
│              │                 │               │  ─────────────────────    │
│              └─────────────────┘               │  ▶ 1. "Just doing my job."│
│                                                │  ▶ 2. [THE MASK ●] Smile  │
│                                                │  ▶ 3. [LEDGER ◆ RED] Push │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │       on the payment.     │
│ │ CHAR │ │ CASE │ │ MAP  │ │ MENU │            │  ▶ 4. Say nothing.        │
│ └──────┘ └──────┘ └──────┘ └──────┘            │                           │
│  (bottom-left cluster)                          │                           │
└───────────────────────────────────────────────┴───────────────────────────┘
```

### Region breakdown

**Top-left — Player status block**
- Player **portrait** (reflects chosen archetype; may swap art for major state changes later — e.g. heavy modification, injury).
- **Name** (the detective's name/handle).
- **Vitals**: two narrative-driven tracks, **Composure** (psychological) and **Vitality** (physical), per GDD §3 Wellbeing & Damage. Both are small-number pools; reaching zero in either is a fail-state (death / psychological break). Because they're small, the HUD should show them as **discrete pips/segments** rather than a smooth bar, so the player can read exact remaining points at a glance and *feel* each hit. Damage and healing should visibly **flash/animate** on the track when it changes, since damage arrives through dialogue and is easy to miss otherwise.

**Center — Character stage**
- Portrait of the **NPC currently speaking**, comic/manga-influenced hand-drawn style per our visual reference.
- Supports a **speaking indicator** (subtle highlight/animation on the active speaker) and a small **audio glyph** when a voiced line is playing (see §7).
- Location establishing art can also render here when no character is present (scene-setting beat before a conversation).

**Bottom-left — Navigation/menu cluster**
- Four buttons: **Char** (Insights overlay 2.5), **Case** (casefile/inventory 2.6), **Map** (overworld 2.4), **Menu** (system 2.7).
- Deliberately in the corner, out of the reading path, so it never competes with the dialogue panel for attention.

**Right — Dialogue panel** *(the heart of the UI)*
- **Scrolling log** of narration, NPC dialogue, and **Insight interjections** (see §4). Newest content appears at the bottom; the player can scroll back.
- **Choice list** anchored at the bottom of the panel, visually separated from the log by a divider.
- Each choice may carry **inline mechanical tags** (see §5) — Insight requirement, check type, White/Red marker.

---

## 4. Insight Interjections (how the "voices" render)

Insight voices are a signature of the genre and our seven-Insight system. In the dialogue log they appear as distinct entries, visually different from narrator text and NPC dialogue:

```
┌──┐ THE GRAFT                    (Insight name in its own color)
│▓▓│ Their hand won't stop
└──┘ shaking. Withdrawal, or fear?  (the interjection text)
```

- Each Insight has a **consistent color and small icon/portrait chip** so the player learns to recognize its "voice" at a glance.
- Interjections are **passive** (flavor/information the voice volunteers) — distinct from **Insight-gated choices**, which appear in the choice list (§5).
- Frequency and which Insight speaks are driven by the ink content + current Insight levels; the UI just needs to render an interjection entry type. Higher-level Insights speak more often and more usefully — the UI should make a high-level voice feel present without drowning the log.

---

## 5. Choice & Check Presentation

Choices must communicate their mechanical weight *before* the player commits. Proposed tagging vocabulary (final iconography TBD in visual design):

- **Plain choice** — no tag. Pure narrative branch, no check.
- **Insight-gated choice** — e.g. `[THE MASK ●]`. This option only appears (or only unlocks) because a relevant Insight is high enough. The tag names the Insight.
- **Check choice** — carries the Insight it rolls against and its risk class:
  - **White check** `[LEDGER ◇]` — retriable later if world state changes. Rendered in a "cool"/neutral marker.
  - **Red check** `[LEDGER ◆ RED]` — one-shot, irreversible. Rendered in an alarm color with an explicit "RED" label, because the whole design intent is that the player *knows* they're spending a non-retriable moment.
- **Locked choice (visible)** — **decided: show them, greyed out**, with the requirement labelled (`[GRAFT 4 required]`). This advertises the Insight system and gives the player visible growth goals. Flagged as reversible: if greyed-out options prove too glaring/cluttered in practice, we can switch specific ones (or all) to hidden later. The content/ink layer should therefore tag a locked choice's *reason* so the UI can either show or hide it without rewriting content.

**Check result presentation:** when a check resolves, the dialogue log shows the roll transparently — the 2d6 result, the Insight modifier, the target number, and pass/fail — then continues into the branch. Transparency here is deliberate (another Celestial Return criticism was opaque cause/effect).

```
  ● CHECK — The Ledger vs. 9
    2d6 [4][5] = 9  +2 Ledger  =  11   ▸ SUCCESS
```

---

## 6. Other Views (brief specs)

**6.1 Title / Boot** — game logo, atmospheric key art, menu: New Game / Continue / Settings / Quit. Sets tone immediately (rain, neon, a drowned skyline).

**6.2 Character Creation** — multi-step, following the GDD flow:
1. **Archetype select** — the six archetypes as selectable cards; selecting one previews its Insight distribution (bars) and shows its backstory blurb and its honest weakness.
2. **Free-point spend** — adjust Insight levels within limits; live-updating bars; the low stat the archetype saddled you with is editable but expensive to fully undo, preserving the "face the consequences" intent.
3. **Confirm / backstory** — final backstory summary and name entry, then into the opening scene.

**6.3 Overworld / Navigation** — Celestial Return–style illustrated **diorama** of Saigon SEZ. Unlocked locations are **clickable hotspots** (glow/label on hover); locked ones are absent or visibly sealed. Selecting a hotspot loads that location's scene. Same status/menu affordances available as overlays. No literal traversal — this is a "pick where to go" board, not a walkable map.

**6.4 Character / Insights overlay** — the seven Insights with current levels, each Insight's color/icon, a one-line description of its personality, and the detective's archetype + backstory. This is the closest thing to a "character sheet."

**6.5 Inventory / Casefile overlay** — two tabs likely: **Evidence/Items** (what you're carrying, keyed clues) and **Case Notes** (an auto-assembling log of what you've learned — valuable in a mystery-driven game so the player can track threads).

**6.6 System / Settings** — save/load slots, and settings including the **voice toggle**, master/music/SFX/voice volume sliders, text speed, and accessibility options (font size, high-contrast, reduce-motion).

---

## 7. Voiceover UI Affordances (ElevenLabs)

Voiceover is curated (intros/greetings in v1), so the UI treats audio as an **enhancement layer** on specific lines, never a requirement:

- **Voiced-line indicator** — when a line has an associated ElevenLabs clip and voice is enabled, show a small **audio glyph** near the speaker's portrait/name and play the clip as the line appears.
- **Interrupt on advance** — if the player advances past a line while its clip is still playing, the clip stops cleanly. Reading pace always wins over audio.
- **Replay affordance** — optional small "replay voice" control on the most recent voiced line (nice for catching a character's delivery).
- **Global voice toggle** — in Settings (§6.6); when off, no glyphs, no playback, zero behavioral difference otherwise.
- **No live synthesis** — clips are pre-generated static assets (per architecture §7). The UI only ever *plays a file*; it never calls an API. This keeps the shipped game offline-capable and cost-free at play time.

Text remains the source of truth: **every voiced line is also fully written on screen.** Voice never replaces reading.

---

## 8. Open Questions (flagged, not decided)

1. **~~Vitals model.~~ RESOLVED** — Disco-style narrative tracks (Composure/Vitality), small pools, damage via dialogue/events, zero in either = death/break. Defined in GDD §3 Wellbeing & Damage. Remaining sub-items (base pool sizes, Insight→max mapping, recovery sources) are tuning-pass work, not UI questions.
2. **~~Visible locked choices.~~ RESOLVED** — show greyed-out with requirement labels; reversible to hidden per-choice later (§5).
3. **Portrait state variance** — does the player portrait change with story state (injury, heavy modification), or stay fixed per archetype for v1? *(Now partly implied by the vitals system — at minimum a low-Vitality state might warrant altered portrait art. Worth deciding alongside art direction.)*
4. **Dialogue panel width / responsive behavior** — target desktop-first, but define minimum width and whether the stage collapses on narrow viewports.
5. **Casefile automation** — how much of the case-notes log auto-populates vs. being purely flavor. Affects how much authoring each scene needs.

---

*This document maps layout and behavior only. Actual visual design (color palette, typography, iconography, portrait art direction) is a separate pass, and would pair with the frontend-design work when we start building components.*
