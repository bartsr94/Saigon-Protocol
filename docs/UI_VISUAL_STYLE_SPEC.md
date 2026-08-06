# UI Visual Style — Spec

*Settled design, written before implementation. Companion to
`SAIGON_PROTOCOL_UI_DESIGN.md`, which specifies layout and behavior but
explicitly defers "actual visual design (color palette, typography,
iconography, portrait art direction)" to a later pass — this is that pass.
`src/content/insights.ts` already anticipates it (`color` field comment:
"placeholder identity color — real iconography is a separate visual-design
pass").*

---

## Problem

We have two pieces of visual reference and no written bridge between them:

- **`UI inspo/*.html`** — five standalone "NEON FURY" mockups (Neon Game
  Menu, HUD Overlay, Inventory Grid, Dialogue System, Settings Menu). These
  demo a cohesive cyberpunk-HUD visual *language* — angular cut-corner
  panels, cyan/magenta neon glow, Orbitron/Rajdhani typography, scanlines,
  glitch text — but their content (HP/MP/SP bars, item rarity tiers, generic
  fantasy-shooter labels) is a different game and doesn't map 1:1 onto ours.
- **The reference screenshot** — establishes the actual on-screen *shape*:
  viewport is a 75/25 split, left three-quarters is an illustrated stage,
  right quarter is a bordered text panel carrying dialogue, an Insight
  interjection, numbered choices, and a status/roll strip. A vertical icon
  rail sits at the far-left edge; the player portrait and wellbeing pips sit
  top-left.

This spec adopts the inspo language, adapts it where it conflicts with our
own design principles or content model, and maps the result onto the actual
regions defined in `SAIGON_PROTOCOL_UI_DESIGN.md` §2–§7.

## Scope

**In scope:**
- Design tokens: color roles, typography, the "cut-corner panel" chrome
  pattern, glow/blur conventions.
- Per-region mapping: which inspo pattern serves which UI_DESIGN region, and
  what must change to fit.
- Accessibility guardrails for the animation-heavy parts of the inspo
  language, tying into UI_DESIGN §6.6's planned settings.
- Implementation approach (where tokens live, what reusable presentational
  components to build) — not the components themselves.

**Out of scope** (deferred):
- Actually building the React components — that's a follow-up implementation
  task once this spec is agreed.
- Character/scene illustration art direction (per UI_DESIGN's closing note,
  a separate pass; this spec only covers UI chrome around the art).
- A real icon glyph set for the nav rail — placeholder glyphs only.
- Per-NPC name colors — depends on the content pipeline (§6, still open).

---

## 1. Color roles

The inspo files use one chrome pair (cyan primary / magenta secondary) plus
ad-hoc HP/MP/SP colors. We already have *content*-level colors — the seven
Insights each have one (`insights.ts`) — so this spec splits color into two
non-overlapping layers: **chrome** (UI frame, generic) and **semantic**
(meaning-bearing, content-driven). Chrome never borrows a semantic color and
vice versa, so an Insight's color always reads as "this is that Insight"
and never as "this is a hover state."

| Role | Color | Source / reuse |
|---|---|---|
| Chrome — default/idle | Neon cyan (`#00f2ff`-ish) | Inspo `--primary-color`, used for default borders, glow, button idle state, nav rail idle state |
| Chrome — hover/focus/active | Neon magenta (`#ff00ff`-ish) | Inspo `--secondary-color`, used consistently across buttons, checkboxes, sliders, choice-row hover |
| Vitality (physical wellbeing) | Neon red/pink | Direct reuse of inspo HUD Overlay's `--hp-color` — physical damage reads as "health" the same way it would in any game |
| Composure (psychological wellbeing) | Neon cyan/blue | Direct reuse of inspo HUD Overlay's `--mp-color` — "mental energy" register, distinct from Vitality's red |
| White check | Cool/neutral (cyan-family outline) | Per UI_DESIGN §5's "cool/neutral marker" call, sits with chrome-idle rather than any Insight's own color |
| Red check | Alarm red/magenta, explicit "RED" label | Per UI_DESIGN §5 — shares Vitality's alarm register on purpose (both mean "this can hurt you") |
| Insight identity | Each Insight's own `color` in `insights.ts` (yellow/green/red/sky/violet/orange/pink) | Used **only** for that Insight's interjection chip, name tag, and gated-choice tags — never repurposed as chrome |
| Background | Near-black (`#050505`-ish) | Direct reuse, matches the existing neo-noir tone (`color-scheme: dark` already set in `index.css`) |

Muscle Memory's Insight color (`#ef4444`, red) sits close to the Vitality/
Red-check alarm register — acceptable since Muscle Memory is itself a
physical/violence Insight, but worth a glance during implementation so an
interjection chip and a nearby Red-check tag don't visually blur together.

## 2. Typography

Direct adoption of the inspo pairing — it already fits the neo-noir-tech
tone and the Orbitron/Rajdhani split maps cleanly onto our own
label-vs-body distinction:

- **Orbitron** (700/900): screen and panel titles, speaker names, Insight
  names, HUD labels, button labels. Uppercase, letter-spaced, per inspo
  convention.
- **Rajdhani** (500/600/700): dialogue body text, narration, choice text,
  descriptions. This is the reading-heavy typeface, so it gets no glitch
  treatment (see §4).

**Self-host both fonts** (e.g. `@fontsource/orbitron` +
`@fontsource/rajdhani`, or static files under `public/fonts`) rather than
the inspo files' Google Fonts CDN `<link>`. This matches the project's
existing no-runtime-network-dependency stance (Architecture §7's rationale
for baked voiceover assets applies equally here).

## 3. The cut-corner panel pattern

Every inspo mockup uses the same angular `clip-path: polygon(...)`
cut-corner treatment at different scales, plus a matching border + glow +
`backdrop-filter: blur()`. This is the single most reusable piece of the
inspo language — treat it as one parameterized pattern, not five
hand-copied ones:

| Token | Cut size | Used for |
|---|---|---|
| `cut-sm` | ~10px | Wellbeing pips, evidence-grid slots, small tag/badge chips |
| `cut-md` | ~20–25px | Choice rows, nav-rail buttons, section panels inside overlays |
| `cut-lg` | ~40px | Full modal-level panels: dialogue panel, Settings modal, Casefile modal |

Standard chrome for any cut-corner panel: 1px border in the panel's chrome
color at ~30–40% opacity, `rgba(5,5,5,0.75)`-ish background with
backdrop-blur, outer+inset glow box-shadow matching the border color, and
(on the larger `cut-lg` panels only) a short glowing accent bar decal at the
top-left corner, per the inspo modals' `::before` deco line.

## 4. Motion & glitch — restraint, not removal

The inspo files lean hard on continuous animation: infinite glitch-text
clones, flickering hover states, pulsing "next" prompts, animated diagonal
stripes on bars. UI_DESIGN's Design Principle #4 — **"Readable first,
stylish second... this is a reading-heavy game"** — means we can't adopt
all of it as-is on text the player is meant to actually read.

Rule of thumb: **no continuous/infinite glitch or flicker on anything read
for more than a second.**

- **Allowed as continuous/looping:** Boot/Title logo glitch (not body text,
  seen once per session), button hover flicker (brief, user-triggered,
  stops on mouse-out), the pulsing "continue" (▸▸) glyph, wellbeing-pip
  flash on change (one-shot, ~300–600ms, not looping).
  Insight interjection speaker tag flicker on its *first* appearance in the log — one-shot, then it holds still.
- **Never continuous:** dialogue text, choice text, narration, anything in
  the scrolling log once it's no longer the newest entry.
- **Scanlines / background grid:** global, very low opacity, decorative
  only — fine to keep, but gate under the accessibility settings below.

**Accessibility gating.** UI_DESIGN §6.6 plans Reduce Motion and
High Contrast settings; until that Settings overlay exists, respect the OS
`prefers-reduced-motion` media query as the baseline default. When active:
scanlines, glitch clones, and flicker/pulse animations are disabled outright
(swap to a static equivalent — e.g. a solid border instead of a pulsing
glow), and pip-flash-on-change becomes an instant color swap.

## 5. Region mapping

Mapping the inspo files onto `SAIGON_PROTOCOL_UI_DESIGN.md`'s actual regions
(§3 and §6). Each entry says what's adopted directly vs. what must change.

### 5.1 Top-left player status block (UI_DESIGN §3)

- **Adopt directly:** HUD Overlay's `portrait-frame`/`portrait-inner`
  angular corner-cut avatar frame with its subtle glow.
- **Must change:** the smooth striped `bar-fill` progress bars. UI_DESIGN §3
  is explicit that Composure/Vitality need **discrete pips/segments**, not a
  smooth bar, so the player can read exact remaining points and feel each
  hit. Convert: one small `cut-sm` cell per point of the track's current
  max, filled cells glow in the track's color (§1), empty cells render dim
  and hollow. On damage/heal, the *changed* pip(s) get the one-shot flash
  from §4 — not a continuous animation.
- Two tracks only (Composure, Vitality), not the inspo's three (HP/MP/SP).

### 5.2 Center stage (UI_DESIGN §3)

Mostly out of scope (art direction, separate pass). UI-wise: an optional
subtle glow/frame on the currently-speaking NPC portrait (speaking
indicator, per UI_DESIGN §3), no chrome at all when the stage is showing a
location establishing shot instead of a character.

### 5.3 Left icon rail (nav cluster)

The reference screenshot places the four nav buttons (Char/Case/Map/Menu,
per UI_DESIGN §3) as a **vertical icon rail flush to the left edge**, not
the bottom-left horizontal row UI_DESIGN's ASCII sketch shows. This spec
follows the screenshot; UI_DESIGN §3's diagram should be corrected to match
in a follow-up doc pass. Style: `cut-md` icon buttons, chrome idle/hover
per §1, icon-only with a tooltip label — real glyphs are a placeholder set
for now.

### 5.4 Dialogue panel (UI_DESIGN §3, §4, §5) — the core adaptation

The inspo Dialogue System file is the richest single source but models a
single overwritten line, bottom-anchored, no player choices. Ours is a
**scrolling log**, full-height, right-hand column. Adopt the chrome
(`cut-lg` card, border/glow, backdrop-blur) and the typewriter/skip
mechanic; restructure the interior:

- **Narration** — plain Rajdhani, slightly dimmed, no name tag.
- **NPC dialogue** — Orbitron name tag in that character's color (content
  pipeline TBD, §6) + Rajdhani body.
- **Insight interjection** (UI_DESIGN §4) — name tag in the Insight's own
  `insights.ts` color, preceded by a small `cut-sm` icon swatch filled with
  that color (a shrunk version of the inspo portrait-frame cut), body text
  in italic Rajdhani. One-shot flicker on first appearance only (§4).
- **Choice list** (UI_DESIGN §5) — divider above, each choice a row with a
  leading angular bullet, hover/focus shifts chrome cyan→magenta with a
  slight indent (direct reuse of the inspo button hover transform). Inline
  tags per §5's vocabulary: plain = no tag; Insight-gated = a small pill in
  that Insight's color; White check = cyan-outline pill "◇"; Red check =
  filled alarm-red pill "◆ RED"; locked-visible = desaturated row + lock
  glyph + requirement text.
- **Check-result block** (UI_DESIGN §5) — a `cut-sm`-framed sub-row showing
  the dice/modifier/target/pass-fail line, cyan/green on success, magenta/
  red on fail.
- **Typewriter speed & skip** — adopt the inspo's per-character reveal and
  click-to-complete, but speed must respect the planned Settings Text Speed
  slider (§6.6), and an "instant text" option should bypass the effect
  entirely for players who want it off.

### 5.5 Title / Boot (UI_DESIGN §6.1)

Near-direct adoption of the Neon Game Menu file: glitch-title (continuous
glitch is fine here, per §4 — it's a logo, seen once, not read continuously)
over atmospheric key art (the inspo's procedural cyber-grid becomes a
secondary/optional layer behind real key art, not the primary background).
Vertical stack of `cut-md` buttons for New Game / Continue / Settings / Quit.

### 5.6 Settings overlay (UI_DESIGN §6.6)

Near-direct adoption of the Settings Menu file's two-column `cut-lg` panel
layout. Left panel (Audio): Master / SFX / Music sliders **plus a Voice
slider and voice on/off toggle** (§7's global voice toggle lives here).
Right panel: swap the inspo's decorative checkboxes (Chromatic
Aberration/HUD Glitch Effects) for the real accessibility set — Reduce
Motion, High Contrast, Large Text — plus Text Speed as a slider. Bottom
action row reused as-is: Quit / Back to Game / Save Changes.

### 5.7 Casefile / Inventory overlay (UI_DESIGN §6.5)

Near-direct adoption of the Inventory Grid file's two-pane grid+sidebar for
the **Evidence/Items** tab. Its three-tier rarity coloring is repurposed
rather than dropped: common/rare/legendary becomes flavor / clue / key
evidence, reusing the exact same color-tier mechanic to signal case
importance instead of loot rarity. The **Case Notes** tab drops the grid
entirely and reuses the dialogue-log chrome (§5.4) for a scrolling text log
instead. A pair of `cut-md` buttons switches between the two tabs.

## 6. Implementation approach

- **Tokens live in `src/index.css`.** Tailwind 4 is CSS-first
  (`@import "tailwindcss"` is already there); extend it with an `@theme`
  block defining the §1 colors and §3 cut-size tokens as Tailwind theme
  values (e.g. `--color-chrome-primary`, `--color-vitality`, `--radius-cut-md`
  as arbitrary-property inputs), rather than a parallel untyped CSS-variable
  system, so the rest of the app can use ordinary Tailwind utilities.
- **New `src/components/ui/` folder** for the reusable presentational
  primitives this spec implies: `Panel`, `CyberButton`, `PipTrack`,
  `ChoiceRow`, `InsightChip`, `CheckResultBlock`, `GlitchText`, `NeonSlider`,
  `NeonCheckbox` (opt-in animation, respects `prefers-reduced-motion`
  internally where relevant). These are pure/presentational — props in, no
  store imports — per CLAUDE.md's simulation/UI separation rule. They
  replace the throwaway Harnesses' inline styling once real screens get
  built, but this spec doesn't build the screens themselves. (Built:
  `src/components/screens/` now hosts Title/Boot, Overworld, Dialogue/Scene,
  Settings, and Casefile on top of these primitives.)
- Update `insights.ts`'s `color` field comment to point at this file instead
  of the informal "UI doc §9" forward-reference once this spec lands.

## 7. Verification

- `npm run lint` and `tsc -b` clean once tokens/components exist.
- Manual pass: restyle the existing dev harnesses (or a new small style
  harness) against the reference screenshot's shape to confirm the token
  system and chrome pattern read correctly before building real screens.
- Dialogue body text contrast meets WCAG AA against the panel background.
- With `prefers-reduced-motion: reduce` set, scanlines/glitch/flicker are
  off and pip-change animation falls back to an instant swap.
