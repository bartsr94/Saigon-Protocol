# NPC Portrait Variants Spec

*Working implementation spec for letting an NPC's center-stage portrait
change to a different picture mid-scene, driven by ink line tags.
Production-planning document, not final canon.*

## Goal

Let an NPC (`content/npcs.ts`) have more than one portrait image, and let
`.ink` content pick which one is showing on any given line — e.g. Lakshmi
Avani's `lakshmi_avani_topics` loop shows her `neutral` picture by default,
but a specific topic response can switch to a `smiling` or `hurt` variant
for the lines that warrant it, then the next scene/visit falls back to
`neutral` again. This is explicitly the same use case that already exists
for scene backdrops (`background:` tag) and music (`music:` tag) — one more
"swap the art the ink author names, hold it until the next tag" line-tag
channel, applied to the NPC portrait instead of the backdrop.

**Explicitly out of scope:**
- **No emotion/sentiment inference.** Variant selection is always an
  explicit `# portrait: <variantId>` tag an author writes by hand, never
  derived from the text content of the line. Same authorial-control
  philosophy as every other content tag in `GAME_GUIDE.md` §5.2.
- **No crossfade/transition polish.** The portrait `<img>` swaps its `src`
  the same instant `background:` art does today — an instant cut, not an
  animated transition. If that reads as a jarring flicker once real art is
  in, that's a follow-up, not a v1 requirement.
- **No choice-tag support.** Only line tags (an NPC's own dialogue text)
  can carry `portrait:`. `parseChoiceTags` (the player's choice-bracket tag
  system: `insight`/`check`/`locked`) is a different mechanism for a
  different purpose and isn't extended here.
- **Not the player's own portrait.** `content/portraits.ts`/`PORTRAITS` is
  a separate, unrelated system (one static chargen-time picture the player
  picked for themselves) — untouched by this spec.
- **No requirement that every NPC gets multiple variants.** Most NPCs will
  keep exactly one (`neutral`) or, like `soraBaek`/`respondingOfficer`/
  `baChau`/`pakRahman` today, none at all (name-label-only fallback,
  `NpcStagePortrait`'s existing tolerance). This spec only adds the
  *mechanism* — authoring more variants for a given NPC is ordinary content
  work, not something this spec needs to do for every NPC up front.

## Relationship to other docs / existing code

- **Direct precedent:** `background:`'s whole pipeline — `content/backgrounds.ts`
  (id-keyed image registry) → `contentTags.ts`'s `parseLineBackground` →
  `StoryLine.background` (`storyStore.ts`) → `DialogueScreen`'s
  `activeBackgroundId` state, updated from `currentLines` and held until the
  next tag. `GAME_GUIDE.md` §5.2's tag table documents that pattern; this
  spec adds a `portrait:` row to the same table once built (Documentation
  Update Protocol, `.claude/commands/docs.md`).
- **Key difference from `background`/`music`/`ambience`:** those three all
  resolve against one *global*, closed id set (`BackgroundId`, `MusicId`,
  `AmbienceId`) shared across all content. Portrait variants are inherently
  *per-NPC* — Lakshmi's `smiling` and a hypothetical future NPC's `smiling`
  are unrelated images with unrelated availability. There is no global
  `PortraitVariantId` union to validate against; validation is necessarily
  two-stage (see Design §2).
- **`NpcStagePortrait.tsx`** — already the single shared rendering surface
  for both `DialogueScreen` and `ConversationScreen`, already owns per-`npcId`
  fallback/reset logic (missing-art tolerance). This spec extends it rather
  than duplicating portrait-rendering logic into either screen.
- **`HubCardListView.tsx`** — reads `npc.portraitSrc` three times for hub
  tile/card thumbnails. Those always want the NPC's default picture
  regardless of any scene state — not a consumer of the new per-line variant
  tracking, just a call-site that needs updating for the data-shape change
  (Design §1).

## Design

### 1. Data model (`content/npcs.ts`)

Replace the single optional `portraitSrc` with a variant map. A `neutral`
entry is required whenever `portraits` is present at all — enforced by the
type, not just convention, the same way `checkId` uniqueness is convention-only
but this one doesn't need to be:

```ts
export interface NpcDefinition {
  id: NpcId
  name: string
  /**
   * Keyed by variant id, free-form per NPC (no shared enum — see spec).
   * `neutral` is the default: shown when no `# portrait:` tag has fired
   * yet for this NPC, and the fallback when a requested variant id isn't
   * one of this NPC's keys. Absent entirely = no portrait art configured
   * for this NPC yet (existing name-label-only fallback).
   */
  portraits?: {
    neutral: string
    [variantId: string]: string
  }
}
```

`meiHong`/`lakshmiAvani` migrate their existing single image to the
`neutral` key (`portraits: { neutral: '/portraits/npcs/mei-hong.png' }`) —
zero behavior change for any scene that never sets a `portrait:` tag.
`HubCardListView.tsx`'s three `npc.portraitSrc` reads become
`npc.portraits?.neutral`.

### 2. `contentTags.ts`: `parseLinePortrait`

```ts
/**
 * Resolves a line's requested portrait variant id, same
 * last-tag-wins/holds-until-next convention as `parseLineBackground`. Unlike
 * every other line-tag parser, this one does NOT validate against a closed
 * id set — portrait variants are scoped per-NPC (Design §1), and this parser
 * doesn't know which NPC is on stage. It only extracts a non-empty trimmed
 * string; resolving whether that id is actually one of the active NPC's
 * variants happens one layer up, in `NpcStagePortrait` (§3) — the same
 * "typo degrades gracefully, never throws" tolerance every other tag has,
 * just split across two steps instead of one.
 */
export function parseLinePortrait(tags: string[]): string | null {
  for (const raw of tags) {
    const parsed = parseTag(raw)
    if (parsed && parsed.key === 'portrait' && parsed.value.length > 0) return parsed.value
  }
  return null
}
```

`contentTags.test.ts` gets the usual cases: absent tag → `null`, one tag →
its value, several `portrait:` tags on one line → last wins (mirrors the
existing `parseLineBackground` test shape).

### 3. `StoryLine` + `storyStore.ts`

Add `portrait: string | null` to `StoryLine` (`storyStore.ts`, next to the
existing `background: BackgroundId | null` field), and call
`parseLinePortrait(tags)` at both of the two sites that already call
`parseLineBackground(tags)` when building the array (the normal-advance path
and the save-restore replay path).

### 4. `NpcStagePortrait.tsx`

New prop `variantId?: string | null`. Resolution:

```ts
const npc = npcId ? NPCS[npcId] : null
const src = npc?.portraits ? (npc.portraits[variantId ?? 'neutral'] ?? npc.portraits.neutral) : undefined
```

Unknown/stale `variantId` (an NPC swap mid-tag-hold, or a typo'd id) quietly
falls back to that NPC's own `neutral` — never a broken image, same
tolerance the component already has for a fully-missing `portraitSrc` today.

One existing-behavior fix needed here: the component's `loadFailed` reset
effect currently depends on `[npcId]` only —

```ts
useEffect(() => {
  setLoadFailed(false)
}, [npcId])
```

— which means a portrait that failed to load, followed by a variant swap
*for the same NPC*, would stay stuck showing the name-only fallback even
though the new variant's image might load fine. Change the dependency array
to `[npcId, variantId]`.

### 5. Tracking the active variant (new shared hook)

Both screens need "the last `portrait:` tag seen for whoever's currently on
stage, reset when the on-stage NPC changes" — `DialogueScreen` already has
this exact shape inline for `activeBackgroundId`/`activeNpcId`, but
`ConversationScreen` doesn't track any per-line art state today (its `npcId`
is fixed for the whole screen, but the topic *responses* still fire
`portrait:` tags as `currentLines` advance). Rather than duplicating the
tracking effect into both screens, add one small shared hook next to the
existing `useTranscript.ts` (same "shared between the two screens" precedent):

```ts
// src/components/screens/usePortraitVariant.ts
export function usePortraitVariant(npcId: NpcId | null, currentLines: StoryLine[]): string | null {
  const [variantId, setVariantId] = useState<string | null>(null)

  useEffect(() => {
    setVariantId(null)
  }, [npcId])

  useEffect(() => {
    const tagged = currentLines.filter((l) => l.portrait !== null)
    if (tagged.length > 0) setVariantId(tagged[tagged.length - 1].portrait)
  }, [currentLines])

  return variantId
}
```

`DialogueScreen` swaps its ad hoc portrait-adjacent state for this hook and
passes the result into `NpcStagePortrait`'s new `variantId` prop.
`ConversationScreen` adds the hook (it currently tracks no per-line art
state at all) and does the same.

## File impact summary

- `src/content/npcs.ts` — `NpcDefinition.portraitSrc` → `portraits?: { neutral: string; [variantId: string]: string }`; migrate `meiHong`/`lakshmiAvani` entries.
- `src/engine/contentTags.ts` — add `parseLinePortrait`.
- `src/engine/contentTags.test.ts` — new cases for `parseLinePortrait`.
- `src/stores/storyStore.ts` — add `StoryLine.portrait`; wire `parseLinePortrait` at both `StoryLine`-construction sites.
- `src/components/ui/NpcStagePortrait.tsx` — new `variantId` prop, per-NPC variant resolution, `loadFailed` reset dependency fix.
- `src/components/screens/usePortraitVariant.ts` (new) — shared tracking hook.
- `src/components/screens/DialogueScreen.tsx` — use the hook, pass `variantId` to `NpcStagePortrait`.
- `src/components/screens/ConversationScreen.tsx` — same.
- `src/components/screens/HubCardListView.tsx` — three `npc.portraitSrc` reads → `npc.portraits?.neutral`.
- `docs/GAME_GUIDE.md` §5.2 — add the `portrait: <variantId>` row to the line-tag table once built.

No changes to `content/backgrounds.ts`/`music.ts`/`ambience.ts`, `parseChoiceTags`, or the player's own `content/portraits.ts`.

## Recommended sequencing

1. `content/npcs.ts` data-model change + migrate the two NPCs with existing
   art. Update the three `HubCardListView.tsx` call sites in the same pass
   so the repo isn't left mid-migration.
2. `parseLinePortrait` + its unit tests (isolated, no store/component
   dependency — same "de-risk the pure function first" order the topic
   editor spec used for its serializer).
3. `StoryLine.portrait` + the two `storyStore.ts` wiring sites.
4. `NpcStagePortrait.tsx`'s `variantId` prop + resolution + the `loadFailed`
   dependency fix.
5. `usePortraitVariant.ts`, then wire it into `DialogueScreen.tsx` and
   `ConversationScreen.tsx`.
6. Verification gate (`npm run lint`, `npx tsc -b`, `npm test`) plus a live
   smoke test: author a second variant on an existing NPC (e.g. give
   Lakshmi a `smiling` picture — or, with no new art yet, reuse her
   `neutral` src under a second key to prove the plumbing), tag one line of
   `lakshmi_avani_topics` with `# portrait: smiling`, confirm it swaps and
   holds through Conversation View, and that leaving/re-entering resets to
   `neutral`.
7. `GAME_GUIDE.md` §5.2 tag-table update (Documentation Update Protocol).

## Decisions

- **Per-NPC variant ids, not a global enum.** Considered mirroring
  `BackgroundId`'s closed-union pattern exactly, but every NPC's variant set
  is unrelated to every other NPC's — a shared union would either force
  every NPC to share the same expression vocabulary (`neutral`/`smiling`/
  `hurt`/...) whether or not it makes sense for them, or need per-NPC
  branded subtypes that TS can't cleanly key a single `Record` on. A plain
  per-NPC map with a required `neutral` key gets the same typo-safety where
  it matters (the fallback key always exists) without inventing a fake
  shared vocabulary.
- **Two-stage validation (parser extracts, component resolves) instead of
  one.** Every other `parseLine*` function is fully self-validating because
  its id space is global and known to `contentTags.ts` at import time.
  Portrait variants can't be, since validity depends on which NPC is on
  stage — a fact `contentTags.ts` (pure, content-agnostic beyond the fixed
  content modules it already imports) doesn't have and shouldn't be given
  ink-line-order context to infer. Pushing the second half of validation
  into `NpcStagePortrait` keeps `contentTags.ts` pure and keeps the
  "unrecognized degrades gracefully" guarantee intact, just resolved one
  layer later than usual.
- **Reset-on-NPC-change, not reset-on-every-line.** A variant tag holds
  across multiple lines from the same NPC (matches `background`'s
  persistence model) but resets to `neutral` the moment a *different* NPC
  becomes the active speaker — carrying forward, say, Lakshmi's `hurt`
  variant id onto Mei Hong's portrait the next time she speaks would either
  silently resolve to Mei Hong's own `neutral` (harmless but confusing) or,
  worse, coincidentally collide with a real variant key Mei Hong happens to
  have. Resetting on NPC change removes the ambiguity entirely.
