# Hub Interaction Portraits — Spec

## 1. Problem

Standing on a POI tile in a `grid` Location Hub (`HubGridView.tsx`) surfaces
its interactions in the bottom action bar as plain `CyberButton`s — "Talk" /
"Inspect" plus a label, no face. `HubCardListView.tsx`'s card/leads
presentation already shows an NPC's `portraits.neutral` art next to their
"Talk" card, but unconditionally — a not-yet-met NPC's face is visible
before the player has ever spoken to them, which undercuts the fog/reveal
feel the rest of the Hub layer already has (unrevealed tiles, locked doors,
fog-of-war).

Ask: a miniature portrait above each Talk option, gated on
`conversationStore.hasMet(npcId)` — silhouette before, real portrait after.

## 2. Decided shape

**Primary target: `HubGridView`'s bottom interaction bar.** This is the
"bottom bar" the ask names, and it's the one place in the app that currently
shows Talk options with zero face at all.

Per `HubInteraction` in the current POI's list:

- `type === 'talk'` (has an `npcId`): render a small portrait chip directly
  above its `CyberButton`, in a `flex flex-col items-center` stack.
  - `conversationStore.hasMet(npcId)` **true** → `PortraitFrame` showing
    `NPCS[npcId].portraits?.neutral`, same as today's `HubCardListView`
    treatment. No art configured yet → `PortraitFrame`'s existing
    initials-fallback (unchanged behavior, nothing new to build).
  - `hasMet(npcId)` **false** → same `PortraitFrame` chrome, but the interior
    always renders the generic silhouette glyph instead of `src` — see §3.
    This is independent of whether art exists for that NPC; an unmet NPC's
    face never leaks through even if `portraits.neutral` is already
    authored.
  - `interaction.available === false` (present but not yet talkable — a
    locked/gated Talk, distinct from unmet) dims the portrait the same way
    `HubCardListView` already dims a locked presence's `PortraitFrame`
    (`accent="rgba(255,255,255,0.45)"`). Met-ness and availability are
    orthogonal — a met NPC can still become temporarily unavailable, and an
    available NPC can still be unmet the first time you find them.
- `type === 'inspect'`: unchanged, bare `CyberButton`, no chip. Inspect
  targets are places/objects, not people — no portrait applies.

Row alignment: wrap every entry (talk or inspect) in the same
`flex flex-col items-center justify-end` cell so buttons stay on one
baseline whether or not a portrait sits above them, rather than the row's
height jumping per-entry.

**Secondary/follow-on: `HubCardListView`.** Its "who's here" band and card
grid already render `PortraitFrame` next to every Talk entry, but never
checks `hasMet` — once the grid-hub silhouette rule ships, this becomes the
one remaining place in the app where a not-yet-met NPC's face is visible
early, which will read as an inconsistency once players learn the "gray
face = stranger" convention from grid hubs. Same gating
(`hasMet(presence.npcId)` → real portrait vs. silhouette) should land here
too. Flagging as a distinct, smaller follow-up rather than folding into the
same patch — it's the same rule applied to a different, already-portrait-
bearing view rather than new layout work.

## 3. Mechanism

### 3.1 Silhouette asset — reuse, don't add

`public/icons/character.png` (`IconId: 'character'`, `content/icons.ts`) is
already the game's "a person is here" glyph — it's what an unstepped-on
talk-only POI tile shows on the grid itself (`HubGridView.tsx`'s
`isPureCharacter` marker). Reusing it for the unmet-portrait state means the
same glyph means "unidentified person" everywhere in the Hub layer, and
ships with zero new art. The ask's "we can use the available portraits, but
I will make specific ones for this view later" covers the *met* side (reuse
`portraits.neutral`); the *unmet* side doesn't need bespoke art at all if
`character.png` carries it — flag for the user if a dedicated
silhouette-portrait asset (as opposed to the map-marker icon) is wanted
instead once real portraits start landing.

### 3.2 `PortraitFrame` change

`PortraitFrame` (`src/components/ui/PortraitFrame.tsx`) currently has one
fallback path: no/failed `src` → initials text. Add a second, explicit one:

```ts
export interface PortraitFrameProps {
  src?: string
  alt: string
  fallbackText: string
  accent?: string
  size?: PortraitSize
  className?: string
  /** True forces the generic silhouette glyph regardless of `src` — used for a not-yet-met NPC. */
  silhouette?: boolean
}
```

When `silhouette` is true, the inner content swaps to the `Icon
id="character"` glyph (centered, dimmed to something like 50–60% opacity so
it doesn't compete visually with the real-portrait case) instead of
attempting `src` at all — `src` is intentionally not even read in that
branch, so a met-later NPC's art can already exist in `NPCS` without
prematurely leaking through if this prop is ever passed incorrectly. Keeps
every other call site (`HubCardListView`'s existing four `PortraitFrame`
uses, the player HUD chip, chargen, Character overlay) untouched — `
silhouette` defaults to `false`/unset, same rendering as today.

### 3.3 `HubGridView` change

In the bottom interaction bar (`HubGridView.tsx` ~line 300), for each
`interaction` in `currentPoi.interactions`:

```tsx
<div className="flex flex-col items-center justify-end gap-2">
  {interaction.type === 'talk' && interaction.npcId && (
    <TalkPortrait npcId={interaction.npcId} available={interaction.available} />
  )}
  <CyberButton
    disabled={!interaction.available}
    tag={interaction.type === 'talk' ? 'Talk' : 'Inspect'}
    title={interaction.available ? interaction.description : (interaction.lockedReason ?? interaction.description)}
    onClick={() => interaction.available && onEnterInteraction(interaction)}
  >
    {interaction.label}
  </CyberButton>
</div>
```

`TalkPortrait` is a small local component (or inlined — it's a handful of
lines) doing the `hasMet` lookup and rendering `PortraitFrame`:

```tsx
function TalkPortrait({ npcId, available }: { npcId: NpcId; available: boolean }) {
  const met = useConversationStore((s) => s.hasMet(npcId))
  const npc = NPCS[npcId]
  return (
    <PortraitFrame
      src={met ? npc.portraits?.neutral : undefined}
      silhouette={!met}
      alt={npc.name}
      fallbackText={npc.name.slice(0, 2).toUpperCase()}
      size="sm"
      accent={available ? 'var(--color-chrome-primary)' : 'rgba(255,255,255,0.45)'}
    />
  )
}
```

`useConversationStore((s) => s.hasMet(npcId))` is reactive — `hasMet` reads
`get().metNpcIds` fresh each call, and Zustand re-runs the selector and
diffs the returned boolean on every store update, so the chip flips the
instant `markMet` fires (`DialogueScreen.tsx`, when the first-encounter
scene ends — see `conversationStore.ts`'s header comment). No new store
plumbing needed; `hasMet`/`metNpcIds` already exist and are already used
for the identical met/unmet branch in `LocationHubScreen.tsx`'s
`enterHubInteraction`.

### 3.4 Sizing

`size="sm"` (64px, `PortraitFrame`'s existing small token) — already the
"miniature/inline" size used by `HubCardListView`'s cards and "who's here"
band; no new size token needed for "in miniature."

## 4. Open questions to resolve during implementation

- **Silhouette dimming exact value** — 50–60% opacity above is a starting
  guess; eyeball against the real neon chrome once it's on screen.
- **HubCardListView follow-on (§2)** — confirm whether the user wants it in
  the same patch or genuinely deferred; it's low-cost once `PortraitFrame`'s
  `silhouette` prop exists (four call sites, same `hasMet` check pattern
  `LocationHubScreen.tsx` already has for its own routing decision).
- **Multiple Talk interactions on one POI** — the type already supports a
  POI with more than one `talk` entry; the per-interaction wrap above
  handles it for free (each gets its own chip+button stack), but worth a
  quick look at a real multi-NPC POI once one exists, in case two portraits
  side by side reads as cramped at `sm` size in a `flex-wrap` bar.
- **Bespoke unmet art later** — if the user wants a distinct
  "silhouette portrait" asset (rather than reusing the map's
  `character.png` marker) once real portraits start landing, that's a
  content-only follow-up (`Icon`'s glyph → a new `/portraits/` asset) with
  no further code change to `PortraitFrame`'s `silhouette` branch.
