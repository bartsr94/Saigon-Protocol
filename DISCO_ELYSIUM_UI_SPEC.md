# Disco Elysium–Inspired UI/UX — Spec

*Companion to SAIGON_PROTOCOL_ARCHITECTURE.md and SEA_CYBERPUNK_GDD.md. Covers a targeted UI/UX pass drawing on Disco Elysium and Celestial Return — not a full rewrite of either design doc.*

---

## 1. References & Why

- **Disco Elysium** — the dialogue-as-chat-column layout, skills personified as inner voices that interject in narration, and skill checks with upfront pass-odds and color-coded stakes (green/steel/red).
- **Celestial Return** (itch.io, Metaphor Games) — a closer visual cousin: adopts DE's dialogue/inner-voice UI framework but skins it in hand-drawn manga/American-comic illustration (*Blame!*, *Akira*, *Berserk* referenced) instead of DE's painterly isometric look, with full-body character illustrations (à la *Citizen Sleeper*) instead of small portraits.
- Decision from discussion: target a **hand-drawn/illustrated comic art direction** (Celestial Return–style) over both DE's muted painterly mood and the currently-shipped neon-pixel cyberpunk chrome. UX patterns (inner voices, upfront odds, color-coded checks) are adopted from DE; the visual skin is adopted from the Celestial Return direction.
- Explicitly **not** adopting: DE's Thought Cabinet (meta-progression), Celestial Return's consumable dice-pool economy (a reviewed pain point — "sifting through two to three full inventory pages every time I rolled a skill check"). Saigon Protocol keeps its existing clean 2d6-vs-target-number resolution engine untouched mechanically.

## 2. Scope

In scope, this pass:
- Story/dialogue view (ink-driven narration + choices)
- HUD / overworld chrome (persistent stat bars, nav, location cards)
- Character sheet screen
- Combat screen — **mood/pattern only**: DE has no combat equivalent, so this means carrying the same illustrated art direction and color language into the combat screen, not porting a DE combat UI (there isn't one).

Out of scope, this pass:
- Thought Cabinet or any new meta-progression system
- Full 22-skill personification (see §4)
- Any consumable/spendable dice resource
- Inventory/journal screens (don't currently exist in the codebase)

## 3. Visual direction

- **Art style**: move from the shipped pixel/vector neon UI asset pack (`Btn_Primary_*`, `Progress_Bar_*`, etc.) toward hand-drawn illustrated art — comic-panel-influenced backgrounds and character art, manga + American-comic reference points, matching Celestial Return's direction more than DE's oil-painting isometric look.
- **Production path**: AI-generated art pipeline. Needs, before real asset production starts (flagged as open items in §7, not solved by this spec):
  - a style guide / reference prompt set to keep generations visually consistent across characters and locations
  - a place in the repo for generated source art + the pipeline/prompts used to produce it (mirroring how `src/ink/source` vs `src/ink/compiled` separates authored source from build output)
  - a fallback/placeholder convention for screens that don't have generated art yet, so half-illustrated is a real intermediate state, not a blocker
- **Existing asset pack**: the current `Btn_Primary`/`Btn_Secondary`/`Progress_Bar` PNGs and the `text-glow-cyan`/`text-glow-magenta` treatment stay in place as functional UI chrome (buttons, bars) until/unless illustrated equivalents replace them — this spec does not delete the shipped pack, it defines what grows around it.
- **Palette**: no longer locked to pure neon-chrome; take cues from Celestial Return's more vibrant/illustrated (if not painterly-muted) palette. Concrete palette values are a design-pass deliverable, not fixed here.

## 4. Inner voices (attribute-personified commentary)

- **Granularity**: one personified voice per **attribute**, not per skill — 6 voices (Strength, Dexterity, Endurance, Intellect, Education, Social Standing), not 22. Matches Celestial Return's own finding that skill-voice commentary works fine as flavor without being mechanically deep.
- **Weight**: flavor-only, same as both reference games — voices comment, they don't change outcomes. No new mechanical hooks beyond what already exists in `resolution.ts`.
- **Authoring mechanism**: a new ink tag convention, e.g. a line tagged `# voice:intellect` marks that line as Intellect's inner voice rather than narration. `storyStore.continueStory()` needs to classify each continued line by tag (narration vs. voice + which attribute) instead of pushing everything into one `currentText: string[]`.
- **Content need**: a personality blurb per attribute (tone, what it tends to comment on) — this is a writing task, not decided here. Needs a home, likely `src/content/attributeVoices.ts` alongside `skills.ts`/`archetypes.ts`.
- **Rendering**: `StoryScreen` needs a distinct visual treatment per voice line — attribution label (e.g. "INTELLECT"), a color/icon per attribute, visually separated from narrator prose (DE uses colored spheres in-world plus distinct dialogue-column styling; our equivalent is at minimum distinct column styling since there's no free-roam world view to put a sphere above).

## 5. Upfront skill-check odds on choices

Current state (confirmed in `src/ink/source/main.ink` and `src/ink/externalFunctions.ts`): `skillCheck(skillName, targetNumber)` is an **invisible narrative gate** — it's called inline in ink logic (`{ skillCheck("streetwise", 8): -> a - else: -> b }`), not attached to a player-facing choice, and it returns only a boolean. There is currently no path from "a choice the player is looking at" to "the skill/TN/odds behind it."

Decision: retrofit this so choices can declare their check **before** the player picks, DE-style, with odds shown and the check color-coded by stakes.

### 5.1 Ink authoring convention

**Revised during implementation.** The obvious design — tag the choice line with `# check:skill:tn` — doesn't work with this project's compiler: `inkjs-compiler.js` compiles trailing tags on a choice line into the content that plays *after* the choice is picked (verified by inspecting the compiled JSON), not onto `Choice.tags`. That's too late to preview odds before the click, and `Choice.tags` is empirically always `[]` regardless of tag placement with this toolchain.

Working convention instead: encode the check as plain text *inside* the choice's own brackets, parsed and stripped back out client-side before rendering:
```
* [Talk your way past (CHECK Persuade 8)]
* [Force the issue (CHECK Tactics 10 once)]
```
`once` marks a red (one-shot) check; no flag defaults to white (repeatable, standard). A `passive` variant could mark green (auto-pass/no-roll) for completeness, though no current content needs it. Parsing lives in `src/ink/tags.ts`'s `parseChoiceCheckMarker`. Line-level tags (`# voice:...`, `# combat:...`) are unaffected by this — those *do* compile correctly onto `story.currentTags`, confirmed against the same compiler; only choice-level tags are the gap.

### 5.2 Engine addition
`resolution.ts` needs a pure probability function alongside `resolveSkillCheck` — enumerate the 36 fixed 2d6 outcomes against a given total modifier and target number to return a pass %, so the UI can show odds without rolling:
```ts
export function passProbability(params: Omit<SkillCheckParams, 'situationalModifier'> & { situationalModifier?: number }): number
```
(Exact signature TBD at implementation time — the point is it must reuse the same modifier math `resolveSkillCheck` already uses, so odds shown pre-roll and the roll itself never disagree.)

### 5.3 Store/plumbing changes
- `storyStore`'s `currentChoices` needs to carry parsed check metadata (`{ skill, targetNumber, stakes: 'green' | 'white' | 'red' }` or `null` for unchecked choices) alongside `index`/`text`.
- Choosing a checked choice needs to trigger the existing `DiceRoll` component (currently only wired into combat) in the story view — dice animate, tier resolves, *then* ink continues — rather than ink silently branching on a boolean with no visible roll.
- Red (`once`) checks need a persisted "already attempted" flag so they don't get re-offered — likely an ink variable set on attempt, since ink state already round-trips through the save layer (per the architecture doc, ink story state exports/restores as JSON natively).

### 5.4 Retrofit of existing content
`main.ink`'s one existing check (`streetwise` at the pier) is currently a hidden narration gate with no associated player choice — converted to the new pattern as the worked example/reference for future ink authoring: `* [Read the figure's stance before you move (CHECK Streetwise 8)]`, branching on a new `lastCheckSuccess` ink variable that `resolveCheck()` sets before continuing. (Also fixed in passing: the original check called `"streetwise"` lowercase, which never matched the actual skill name `"Streetwise"` in `content/skills.ts`.)

## 6. Color-coded stakes

| Stakes | Meaning | Suggested treatment |
|---|---|---|
| Green | Passive/auto-pass, informational | success-toned accent, no roll shown |
| Steel/White | Standard, repeatable | neutral accent, roll shown on selection |
| Red | One-shot, high stakes | warning-toned accent, roll shown, choice removed/greyed after first attempt |

Exact colors follow whatever palette comes out of §3 — not fixed here, but the three-tier semantic split is a firm requirement, matching DE's convention closely enough to keep hover/pre-commit legibility.

## 7. Open items / risks (not resolved by this spec)

- **AI art pipeline consistency** — no prompt/style-guide system exists yet; first real risk to nail down before generating any production art.
- ~~Ink tag parsing is currently ad hoc~~ — resolved: consolidated into `src/ink/tags.ts`. Note the split: `combat:`/`voice:` are genuine ink content tags read via `story.currentTags`; the check marker is *not* a tag (see §5.1) and is parsed out of choice text instead.
- **Red-check persistence** is an ink-authoring convention, not new engine plumbing: guard the choice with an ink variable (`{ not attempted_x }`) and set it after firing, the same way any other one-time ink content would be gated. Not yet exercised by real content — the retrofit in §5.4 is a white check, not a red one.
- **Combat screen** has no direct DE/Celestial Return UI analog to port — implementation will need to interpret "same art direction and color language" rather than following a reference layout.
- Attribute-voice personality writing (§4) and palette values (§3) are content/design deliverables that block visual completion but don't block the plumbing work in §5 — the two can proceed in parallel.

## 8. Suggested phasing

1. **Plumbing**: `passProbability`, choice-check-tag parsing, `voice:` tag parsing, store shape changes — no visual change yet, verifiable against the existing `main.ink` retrofit.
2. **Story view UI**: check badges + odds + color-coding on choices, DiceRoll wired into narrative checks, voice-line rendering distinct from narration.
3. **Content**: attribute-voice personalities written, existing/new ink content adopts the choice-check tagging convention.
4. **Visual direction**: palette + illustrated art direction applied to story view, then HUD/character sheet/combat screen in turn, backfilled with generated art as the AI pipeline matures.
