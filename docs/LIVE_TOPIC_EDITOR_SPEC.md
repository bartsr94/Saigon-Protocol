# Live Topic Editor Spec

*Working implementation spec for extending the dev-only in-game live-edit
tooling (`debugTextEditPlugin.ts`, `debugMapEditPlugin.ts`) to NPC
conversation topics. Production-planning document, not final canon.*

## Goal

While actually standing in Conversation View (`ConversationScreen.tsx`) with
a met NPC, let a dev add/edit/remove/reorder that NPC's repeat-visit
**topics** — the `* [Choice text]` / response pairs inside their
`topicsKnot` loop (`docs/GAME_GUIDE.md` §5, `SAIGON_PROTOCOL_ARCHITECTURE.md`
§7) — and have Save write the result straight back to
`content/ink/<storyLocationId>.ink`, recompile it to its sibling `.json`
in-process, and have the change show up on the next topic-bar render. Same
"live, writes to disk, dev-only" model the text and map editors already
established.

**Explicitly out of scope:**
- Creating a `topicsKnot` for an NPC that doesn't have one yet. That also
  requires writing a new `topicsKnot: '...'` field into
  `content/locationHubs.ts` and authoring a brand-new ink knot from
  scratch — a second file, and free-form knot creation rather than editing
  an existing regular structure. Same "editing only ever targets a record
  that already exists" boundary `LIVE_MAP_EDITOR_SPEC.md` drew for hubs.
- First-encounter scenes (`sceneKnot`) and any other non-topics-loop ink
  content. Those are branching narrative with no repeating structure to
  template against.
- Any topic that isn't a **simple topic** (defined below) — one with a
  `roll_check` call, an `is_red_check_consumed(...)` precondition, a
  casefile grant (`gain_evidence`/`unlock_note`/`set_case_flag`), or
  multi-branch conditionals. Those stay hand-edit-only. This tool doesn't
  attempt to visually model ink control flow in general — see "Design §1."

## Relationship to other docs / existing code

- **Direct precedent:** `vite-plugins/debugTextEditPlugin.ts` +
  `src/stores/debugTextEditStore.ts` (single-field live replace) and
  `vite-plugins/debugMapEditPlugin.ts` + `mapRecordSerializer.ts`
  (whole-record live replace). Same dev-only (`apply: 'serve'`), same
  "refuse rather than guess" failure mode on anything ambiguous.
- **`docs/GAME_GUIDE.md` §5** — the tag vocabulary and topics-loop pattern
  this tool generates ink text against; nothing here changes that
  vocabulary. **§13 / `docs/SAIGON_PROTOCOL_ARCHITECTURE.md` §7** — the
  `topicsKnot`/`sceneKnot` `HubInteraction` fields this tool reads but
  never writes.
- **Reused pattern, new territory:** unlike the map editor, there's no
  existing "topic builder" UI to extract — `ConversationScreen.tsx` only
  *renders* ink's live `currentChoices`, it doesn't model topics as data.
  This spec's editor is new UI, not an extraction.

## Design

### 1. What a "simple topic" is

Looking at the topics loops that exist today (`mei_hong_topics`,
`lakshmi_avani_topics` in `content/ink/checkpoint.ink`), most topics share
one exact shape:

```ink
* [Choice text here. # insight: <insightId>]
    Response paragraph, optionally multi-sentence. # speaker: npc:<npcId>
    -> <knotName>
```

A **simple topic** is a block matching that shape exactly:
- One `* [...]` line. Inside the brackets: free text, plus an optional
  trailing `# insight: <id>` tag. (`# check: white/red` and any ink
  condition prefix, e.g. `{ is_red_check_consumed(...) }`, disqualify it —
  those are check-gated or precondition-gated, not simple.)
- One response block: one or more plain-text lines with an optional
  trailing `# speaker: npc:<id>` tag on the last line, and no `~`
  (ink logic) lines, no `{ }` conditionals, no nested `*` choices.
- A final `-> <knotName>` divert back to the knot itself (the loop).

Anything else inside a `topicsKnot` — a `roll_check` call, a `{ cond: ...
- else: ... }` branch, an `is_red_check_consumed` precondition, a
`~ unlock_note(...)`/`~ gain_evidence(...)`/`~ set_case_flag(...)` call —
is a **complex topic**: parsed as an opaque text block, shown read-only in
the editor, and re-emitted byte-for-byte unchanged on save. This keeps every
existing check/casefile topic (`lakshmi_avani_topics`'s "surprised" topic,
`mei_hong_topics`'s guard topic) working and untouched even though the tool
can't edit them, and avoids the map serializer's "drops hand-written
comments" problem for content this tool doesn't understand — complex blocks
are never re-derived from a data model, just copied through.

### 2. `vite-plugins/inkTopicSerializer.ts` (new, pure, unit-tested)

Mirrors `mapRecordSerializer.ts`'s role — the highest-risk, most novel part,
built and tested in isolation first.

- `parseTopicsKnot(source, knotName): TopicBlock[]` — finds `` === knotName
  === `` (throws if not found or ambiguous, same as the map serializer's id
  lookup), takes everything up to the next top-level `===` header or EOF,
  and splits it on top-level `* [` lines into an ordered list of
  `{ kind: 'simple', choiceText, insightTag?, responseText, speakerTag? }`
  or `{ kind: 'complex', raw }`. The knot's opening narration line (before
  the first `*`) is preserved as a fixed preamble, not part of the topic
  list.
- `serializeTopicsKnot(knotName, preamble, topics): string` — the inverse:
  re-emits the preamble, then each topic (complex blocks verbatim, simple
  blocks rebuilt from their fields into the exact template above), in list
  order.
- `replaceKnotBody(source, knotName, newBody): string` — knot-delimited
  version of `replaceRecordById`'s brace-counting replace: locate `` ===
  knotName === ``, locate the next `` === `` header or EOF, splice.
  Refuses (throws) on a missing/ambiguous knot name.
- Reuses `debugTextEditPlugin.ts`'s typographic-apostrophe sanitizer for any
  free text a dev types in, so the same "straight apostrophes never need
  escaping" convention holds in generated ink text as it does in TS string
  literals.

### 3. `vite-plugins/debugTopicEditPlugin.ts` (new, dev-only middleware)

`POST /__debug/save-topics` with `{ storyLocationId, knotName, topics }`
(the full ordered topic list — whole-knot-body replace, not a per-topic
diff, same simplicity tradeoff the map editor made for whole-record
replace).

1. Validate `storyLocationId` resolves to an existing
   `content/ink/<storyLocationId>.ink` (allow-list = the directory listing,
   same spirit as `debugTextEditPlugin.ts`'s `EDITABLE_FILES` but derived
   rather than hand-enumerated, since every location already has exactly
   one ink file).
2. Read the file, `parseTopicsKnot` to recover the preamble, splice in the
   posted `topics` via `serializeTopicsKnot` + `replaceKnotBody`.
3. **Compile before writing anything to disk.** Run the resulting source
   through `inkjs/full`'s `Compiler` in-process (the same call
   `scripts/compile-ink.mjs` makes) — this is the key technical enabler
   that closes the "manual `npm run compile:ink`" gap the other two editors
   don't have to deal with, since ink content is compiled, not interpreted
   TS. If compilation throws, refuse the write (500 + the compiler's error
   message surfaced verbatim) — never leave `.ink`/`.json` desynced or a
   broken `.json` on disk.
4. On success, write `.ink` then its recompiled `.json` sibling. Return ok.

### 4. Tracking which knot Conversation View is parked on

`storyStore`'s `loadStory` currently records `activeStoryId` and
`activeNpcId` but not which `topicsKnot` a conversation-mode session is
parked on (`LocationHubScreen.enterHubInteraction` knows `topicsKnot` at
call time but doesn't thread it through into store state — confirmed via
`loadStory`'s `options: { entryKnot?, mode?, npcId? }` shape). Add
`activeTopicsKnot: string | null` to `storyStore`, set whenever
`mode === 'conversation'` (regardless of whether `entryKnot` was passed
this call — a resumed conversation is still parked on that same knot).
`ConversationScreen` then has everything the editor needs:
`activeStoryId` (→ file), `activeTopicsKnot` (→ knot name), `activeNpcId`
(→ default speaker tag for new topics).

### 5. `TopicEditorPanel.tsx` (new) + entry point

A dev-only "Edit Topics" `CyberButton` in `ConversationScreen`'s bottom
topic bar, next to "Leave Conversation", `import.meta.env.DEV`-gated (same
convention `EditableText.tsx` uses, rather than a separate toggle store —
Conversation View is already the one place this data is meaningful, unlike
the text editor's "renders everywhere" case). Opens a full-panel overlay
(`DebugOverlay` sizing precedent) seeded via `parseTopicsKnot` against
`activeStoryId`/`activeTopicsKnot`.

Panel contents:
- One card per topic, in order. Simple topics: editable choice-text field,
  an insight-tag `<select>` (none + the 7 `InsightId`s), a response
  textarea, a speaker toggle (defaults to the current NPC, or "Narrator" —
  no tag). Complex topics: read-only, raw text shown, labeled "Not editable
  here — check/casefile logic. Hand-edit `content/ink/<file>.ink`."
- "Add Topic" appends a blank simple topic (speaker pre-filled to the
  current NPC) at the end of the list.
- Per-topic "Remove" and up/down reorder controls. Topics aren't referenced
  elsewhere by index or name (unlike the map editor's `unlockFlag`
  cross-reference risk with doors), so reordering/removing is low-risk.
- "Save" POSTs the full topic list to `/__debug/save-topics`; a compiler
  error from the plugin surfaces inline instead of closing the panel.

### 6. Accepted risk

- The in-process compile step catches ink *syntax* errors before writing,
  but not semantic mismatches this tool can't see: a chosen `InsightId`
  the target file's `VAR` declarations don't sync (unlikely — all seven are
  always declared per `storyEngine.ts`'s sync map), or content that just
  reads oddly. No automatic smoke test — same "git is the undo button, Vite
  overlay surfaces a broken file on reload" bar the map editor accepts.
  Manual verification is a Conversation View visit after Save.
- Complex-topic passthrough means the round-trip (parse → serialize) must
  be byte-exact for anything not being edited, or unrelated topics could
  drift on every save. `inkTopicSerializer.test.ts` should assert a
  no-op round-trip (parse then immediately serialize with zero edits)
  against both real topics knots in `checkpoint.ink` as its core test.
- `checkId` global-uniqueness (`GAME_GUIDE.md` §5.3) can't be violated
  through this tool, since simple topics never contain `roll_check` —
  one more reason to keep complex topics genuinely out of scope rather
  than a stretch goal, instead of reimplementing that convention's
  enforcement inside the editor.

## File impact summary

- `vite-plugins/inkTopicSerializer.ts` (new) + `inkTopicSerializer.test.ts`
  (new)
- `vite-plugins/debugTopicEditPlugin.ts` (new)
- `vite.config.ts` — register the new plugin
- `src/components/screens/TopicEditorPanel.tsx` (new)
- `src/components/screens/ConversationScreen.tsx` — "Edit Topics" button +
  overlay wiring
- `src/stores/storyStore.ts` — add `activeTopicsKnot: string | null`

No changes to `content/locationHubs.ts`'s schema, `GAME_GUIDE.md`'s tag
vocabulary, or any existing `sceneKnot`/first-encounter content.

## Recommended sequencing

1. Build `inkTopicSerializer.ts` with unit tests (no-op round-trip on
   `mei_hong_topics` and `lakshmi_avani_topics`; add/edit/remove a simple
   topic; confirm a complex topic block is preserved verbatim) — de-risk
   the parser/serializer first, independent of any UI or plugin.
2. Build `debugTopicEditPlugin.ts` around it, wired to the in-process
   `inkjs/full` `Compiler`, register in `vite.config.ts`. Test by hand with
   `curl`/a REST client before any UI exists.
3. Add `activeTopicsKnot` to `storyStore`.
4. Build `TopicEditorPanel.tsx`, wire the "Edit Topics" button into
   `ConversationScreen.tsx`.
5. Verification gate (`npm run lint`, `npx tsc -b`, `npm test`) plus a live
   smoke test: edit an existing simple topic, add a new one, confirm both
   show up correctly in Conversation View on the next visit without a
   manual `npm run compile:ink`.

## Decisions

- **No Insight-interjection field in v1.** A "simple topic" stays exactly
  the choice+response+self-divert shape in Design §1, with no second
  structured field for the `{ ledger >= 3: ... - else: ... }` pattern. No
  existing topic uses it inside a `topicsKnot` today (only
  `lakshmi_avani_intro`'s first-encounter scene does), so there's no real
  usage to build against yet. If it's wanted later, it's a follow-up to
  Design §1's classifier and `SimpleTopic`'s shape, not a v1 requirement.
- **No cross-NPC speaker.** The speaker toggle is "current NPC or
  Narrator" only, matching the `speakerNpcId?: string` field in Design
  §2 — no topic today has a response voiced by a second NPC, so a topic
  that ever needed one falls outside "simple topic" scope, same as any
  other complex case: hand-edit the `.ink` file directly.
- **Save is one click, no confirm step.** Matches the text editor's
  instant-feel precedent. The in-process compile-before-write (Design §3)
  is the real safety net — a confirm dialog wouldn't catch anything the
  compiler doesn't already catch, and would add friction to what's meant
  to be a fast, iterative writing tool.
