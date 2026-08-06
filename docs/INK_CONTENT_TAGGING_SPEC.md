# Ink Content-Tagging Convention — Spec

*Settled design, written before implementation. Companion to
`SAIGON_PROTOCOL_ARCHITECTURE.md` §3/§6 (names this as an open item, doesn't
detail it) and `SAIGON_PROTOCOL_UI_DESIGN.md` §4/§5 (the rendering this
convention feeds).*

---

## Problem

`DialogueScreen` and the `InsightChip`/`ChoiceRow` primitives already know
how to render an Insight interjection or a tagged choice — they just have no
real data to consume. Nothing in the ink↔TS boundary says *who* is speaking
a line (narrator vs. a named NPC vs. one of the seven Insight "voices") or
*what a choice means mechanically* (plain / Insight-gated / White check /
Red check / visibly locked). Without this, `DialogueScreen` can only render
plain narration and untagged choices, and the center-stage NPC portrait
can't follow the actual scene.

ink already gives us native content tags (`# key: value`, attachable to a
line or a choice) — this doc defines the vocabulary content authors write
and the TS-side parser that turns it into the props `ChoiceRow`/`InsightChip`
already expect.

## Scope

**In scope:**
- The tag vocabulary (below) — the only two places tags may appear: on a
  weave line, or on a choice stem.
- `src/engine/contentTags.ts` — pure parser, mirrors `checkResolution.ts`'s
  testable style. Turns raw `string[]` tags into typed `LineSpeaker` /
  `ChoiceTagInfo` values.
- `storyStore` restructured to carry tags **per line**, not flattened across
  a whole `Continue()` batch — a batch can mix a narrator line, an NPC line,
  and an Insight interjection, and each needs its own speaker.
- `DialogueScreen` rendering: per-line speaker styling in the log, the
  center-stage NPC portrait following the most recent `npc:` speaker tag,
  and `ChoiceRow` tag props driven by `parseChoiceTags(choice.tags)`.
- Extending `content/ink/demo.ink` with one example of each tag so the
  convention is proven against real compiled ink, not just unit tests.

**Out of scope** (deferred):
- Voiceover glyphs / ElevenLabs clip references (UI_DESIGN §7, Architecture
  §7 — a separate, not-yet-built layer; a future `voice: <clipId>` tag could
  hang off the same line-tag mechanism later without changing this design).
- A real per-location content pipeline (compiling/loading `.ink` files per
  location) — still Architecture §6's other open half. This spec only fixes
  *what a tag means once a story is loaded*, not how stories get organized.
- Automatic Insight-interjection frequency/selection logic — that's ink
  content authoring (weighted by Insight level, per UI_DESIGN §4), not a TS
  concern. The parser just renders whatever the ink content emits.

## Tag vocabulary

All tags are `# key: value` (single leading `#`, first `:` splits key from
value, both trimmed). Unrecognized keys/values are ignored rather than
thrown on — a typo'd tag should degrade to "plain narration" / "plain
choice," never crash a scene.

### Line tags (dialogue log entries)

Attach to any content line inside a knot/stitch/weave. At most one
`speaker` tag is meaningful per line.

| Tag | Meaning | Render |
|---|---|---|
| *(absent)* | Narrator | Plain paragraph — today's only behavior, now the explicit default. |
| `# speaker: npc:<npcId>` | An NPC line. `<npcId>` keys into `content/npcs.ts`. | Name row above the text; the center-stage portrait swaps to that NPC and stays until the next `npc:` tag. |
| `# speaker: insight:<insightId>` | An Insight interjection (UI_DESIGN §4). `<insightId>` keys into `content/insights.ts`. | `InsightChip`-headed log entry in that Insight's color, no center-stage change. |

An unrecognized `npcId`/`insightId` (typo, or an NPC not yet added to
`npcs.ts`) falls back to narrator rendering for that line rather than
breaking the scene.

Tags go on the *same source line* as the text they describe — ink attaches
`currentTags` to whatever line is currently being built, and a standalone
tag-only line risks landing on the next paragraph instead of the one
intended. So always write text and tag together:

```ink
Rain on corrugated steel. The checkpoint drone hunts your face.
The drone's thermal bloom is off. Someone vented heat here recently. # speaker: insight:static
Mei Hong steps out of the noodle stall's steam. "You're late, detective." # speaker: npc:meiHong
```

### Choice tags

inkjs only populates `Choice.tags` from tags written **inside** a choice's
`[choice-only]` brackets — a tag placed after the closing bracket attaches
to the *next line of output* (the content shown once the choice is picked),
not to the choice itself. So choice tags always go inside the brackets,
even for a choice with no separate bracket-only text otherwise:
`* [Full choice text # tag]`. A choice may combine `insight` with `check`
(an Insight-gated check) or with `locked` (visible-but-disabled).

| Tag | Meaning | `ChoiceRow` props |
|---|---|---|
| *(absent)* | Plain choice, no mechanical weight. | `tagVariant="none"` |
| `# insight: <insightId>` | Insight-gated and/or the Insight a check rolls against. | `insightColor` = that Insight's color; `tagLabel` = its name. |
| `# check: white` | White check — retriable. | `tagVariant="white-check"` |
| `# check: red` | Red check — one-shot. | `tagVariant="red-check"` |
| `# locked: <reason text>` | Visibly shown, greyed out, disabled (UI_DESIGN §5's "decided: show them, greyed out"). | `tagVariant="locked"`, `tagLabel` = `<reason text>` verbatim. |

Precedence when a choice carries more than one tag: `locked` wins (a locked
choice always renders as locked, regardless of any `insight`/`check` tags
also present — this is how a single choice line shows two states across a
run: tag both `insight` and a *conditionally-attached* `locked` line so the
lock disappears once the requirement is met and the same choice falls
through to `insight-gated`/check rendering). Absent `locked`, `check`
(white or red) wins over a bare `insight` tag, since a check is strictly
more specific than "gated."

```ink
* [Push on the payment. # insight: ledger # check: red]
* [Ask about the drone. # insight: static]
* { graft < 4 } [Force the panel open. # insight: graft # locked: GRAFT 4 required]
```

(The third example's ink-side `{ graft < 4 }` condition is a normal
weight/prefix on the same line the `locked` tag also guards — both must
agree, condition controls whether the choice offers its normal outcome vs.
whatever the `locked` branch does; a later pass can drop the ink condition
in favor of purely presentational locking if that proves simpler in
practice. Not settling that nuance now — it's a content-authoring detail,
not a UI or parser concern.)

## Design

### `src/engine/contentTags.ts`

```ts
export type LineSpeaker =
  | { type: 'narrator' }
  | { type: 'npc'; npcId: NpcId }
  | { type: 'insight'; insightId: InsightId }

export function parseLineSpeaker(tags: string[]): LineSpeaker

export interface ChoiceTagInfo {
  variant: ChoiceTagVariant // re-exported from ui/ChoiceRow
  insightId?: InsightId
  lockedReason?: string
}

export function parseChoiceTags(tags: string[] | null): ChoiceTagInfo
```

Pure functions, no store imports — same tier as `checkResolution.ts`. Takes
raw tag strings (from `story.currentTags` for a line, `choice.tags` for a
choice — both already exposed by inkjs) and returns typed data; callers
(`storyStore`, `DialogueScreen`) own turning that into rendering.

### `src/stores/storyStore.ts` (edit)

`currentText: string[]` + `currentTags: string[]` (one flat pair per
`Continue()` batch) become `currentLines: { text: string; speaker:
LineSpeaker }[]` — one entry per ink line, tagged individually via
`parseLineSpeaker(story.currentTags)` read right after that line's own
`Continue()` call, before the next one overwrites `story.currentTags`.
`currentChoices` is unchanged (inkjs's `Choice.tags` is already there for
`parseChoiceTags` to consume directly at the component layer — no store
change needed for choices).

### `src/components/screens/DialogueScreen.tsx` (edit)

- Log entries carry `lines: StoryLine[]` instead of one joined string;
  narrator lines render as today, NPC lines get a name row, Insight lines
  get an `InsightChip` header. The typing-reveal effect still operates on
  the concatenated text length of the latest entry, sliced back out per
  line for rendering — this is presentational timing logic, not simulation
  state, so it stays component-local per CLAUDE.md's simulation/UI split.
- Local `activeNpcId` state, updated to the most recent `npc:` speaker seen;
  center stage renders that NPC's portrait via the existing `PortraitFrame`
  pipeline, replacing the hardcoded Mei Hong test render from the portrait-
  pipeline work.
- Each `ChoiceRow` gets `tagVariant`/`tagLabel`/`insightColor` computed from
  `parseChoiceTags(choice.tags)` plus an `INSIGHTS` lookup for name/color.

### `content/ink/demo.ink` (edit)

Adds one example each of an Insight interjection line, an NPC line (Mei
Hong — the one NPC with real art), and a check choice carrying `insight`
+`check` tags, so the convention is exercised against real compiled ink in
`storyStore.test.ts`, not just unit-tested in isolation. Recompiled to
`demo.json` via the same one-off `Compiler` scratch-script pattern the
original demo used (never shipped, never imported outside that script).

## Verification

- `contentTags.test.ts`: every tag/value combination above, plus
  unrecognized-key and unrecognized-id fallback behavior.
- `storyStore.test.ts`: updated to assert against `currentLines` (one entry
  per ink line, each with the right `speaker`), and a new case covering the
  demo's Insight/NPC/check tags end-to-end.
- Manual browser pass: Insight interjection renders with its chip/color in
  the log; the NPC line swaps the center-stage portrait; the check choice
  shows the `RED`/`◇` tag before it's chosen.
- `npm run lint`, `tsc -b`, and `npm test` clean.
