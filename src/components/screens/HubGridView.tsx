// Walkable fog-of-war Location Hub presentation
// (Architecture §7's Location Hub Layer): a small tile grid rendered as a
// HUD/AR-scan overlay over the dimmed location background. WASD/arrow keys
// move the player one tile at a time (src/engine/gridMovement.ts owns the
// pure step/collision math); standing on a POI tile surfaces its
// interaction list in the bottom action bar.

import { useCallback, useMemo } from 'react'
import { BACKGROUNDS, type BackgroundDefinition } from '../../content/backgrounds'
import type { GridHubDefinition, GridPosition, HubInteraction } from '../../content/locationHubs'
import { NPCS, type NpcId } from '../../content/npcs'
import { AMBIENT_FOG_RADIUS, doorAt, reachableTiles, tileKey, tileKindAt, tilesWithinRadius } from '../../engine/gridMovement'
import { useCaseStore } from '../../stores/caseStore'
import { useConversationStore } from '../../stores/conversationStore'
import { useDebugMapEditStore } from '../../stores/debugMapEditStore'
import { useDebugTileIdStore } from '../../stores/debugTileIdStore'
import { useGameplayStore } from '../../stores/gameplayStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useUiStore } from '../../stores/uiStore'
import { CyberButton, Icon, Panel, PortraitFrame } from '../ui'
import { EditableText } from '../debug/EditableText'
import { MapEditorPanel, type SaveResult } from './MapEditorPanel'
import { hubToBuilderState } from './mapEditorSeed'
import { useGridKeydownMovement } from './useGridKeydownMovement'

// Large portrait stacked above a Talk button in the bottom interaction bar
// (docs/GAME_GUIDE.md §6.2's "Talk portraits") — silhouette until
// conversationStore.hasMet(npcId), the NPC's real portrait after. Dimmed
// like HubCardListView's locked-presence treatment when the interaction
// itself isn't available yet; met-ness and availability are independent.
// Sized well past PortraitFrame's square presets (native ~2:3 portrait
// aspect instead) and rendered `frameless` — no accent border/glow or dark
// backdrop — so it reads as the NPC standing in front of the scene rather
// than a HUD chip.
function TalkPortrait({ npcId, available }: { npcId: NpcId; available: boolean }) {
  const met = useConversationStore((s) => s.hasMet(npcId))
  const npc = NPCS[npcId]
  return (
    <PortraitFrame
      src={met ? npc.portraits?.neutral : undefined}
      silhouette={!met}
      alt={npc.name}
      fallbackText={npc.name.slice(0, 2).toUpperCase()}
      size="lg"
      width={260}
      height={380}
      frameless
      accent={available ? 'var(--color-chrome-primary)' : 'rgba(255,255,255,0.45)'}
    />
  )
}

// A talk interaction's button label is the NPC's name (authored directly as
// `HubInteraction.label`) — hide it behind the same `hasMet` gate as the
// portrait above it, so a stranger's name doesn't leak through their first
// silhouette encounter. A plain inline hasMet lookup can't live in the
// `.interactions.map()` below (Rules of Hooks forbids a hook call inside a
// loop), hence its own tiny component.
function TalkButtonLabel({ npcId, label }: { npcId: NpcId; label: string }) {
  const met = useConversationStore((s) => s.hasMet(npcId))
  return <>{met ? label : '…'}</>
}

async function saveHubRecord(hubId: string, record: object): Promise<SaveResult> {
  try {
    const res = await fetch('/__debug/save-map-record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: 'locationHubs', id: hubId, record }),
    })
    const body: { error?: string } = await res.json()
    return res.ok ? { ok: true } : { ok: false, error: body.error ?? 'Save failed.' }
  } catch {
    return { ok: false, error: 'Save failed — is the dev server running?' }
  }
}

interface HubGridViewProps {
  hub: GridHubDefinition
  background: BackgroundDefinition | null
  onEnterInteraction: (interaction: HubInteraction) => void
  onReturnToMap: () => void
  atEntry: boolean
}

const TILE_PX = 56
const TILE_GAP = 2
const TILE_PITCH = TILE_PX + TILE_GAP
const EMPTY_REVEALED: Set<string> = new Set()

export function HubGridView({ hub, background, onEnterInteraction, onReturnToMap, atEntry }: HubGridViewProps) {
  const playerPosition = useGameplayStore((s) => s.playerPosition) ?? hub.grid.entryTile
  const revealedTiles = useGameplayStore((s) => s.revealedTiles[hub.id]) ?? EMPTY_REVEALED
  const moveTo = useGameplayStore((s) => s.moveTo)
  const activeOverlay = useUiStore((s) => s.activeOverlay)
  const reduceMotion = useSettingsStore((s) => s.reduceMotion)
  const caseFlags = useCaseStore((s) => s.flags)
  const mapEditEnabled = useDebugMapEditStore((s) => s.enabled)
  const editingMap = useDebugMapEditStore((s) => s.editingMap)
  const openMapEditor = useDebugMapEditStore((s) => s.openMapEditor)
  const closeMapEditor = useDebugMapEditStore((s) => s.closeMapEditor)
  const showTileIds = useDebugTileIdStore((s) => s.enabled)

  // Resolves a door tile's lock state from caseStore at the component
  // layer — gridMovement.ts stays store-agnostic (CLAUDE.md's simulation/UI
  // separation), so `step()` takes this as an injected predicate rather
  // than reaching for the store itself.
  const isDoorUnlocked = useCallback(
    (position: GridPosition) => {
      const door = doorAt(hub.grid, position)
      return door ? caseFlags.has(door.unlockFlag) : false
    },
    [hub.grid, caseFlags],
  )

  // Tiles actually reachable right now (locked doors block whatever's past
  // them) — gates the "Known Places" shortcut so clicking a POI glimpsed
  // through a sealed door can't teleport past it; walking there the normal
  // way is already gated the same way inside step(). Computed once per move
  // and shared with useGridKeydownMovement below, rather than each
  // recomputing its own flood-fill (PERFORMANCE_PASS_SPEC.md §2).
  const reachable = useMemo(() => reachableTiles(hub.grid, isDoorUnlocked), [hub.grid, isDoorUnlocked])

  // Tiles within AMBIENT_FOG_RADIUS of wherever the player is standing right
  // now — recomputed live off playerPosition rather than persisted, unlike
  // revealedTiles below (see gridMovement.ts's AMBIENT_FOG_RADIUS doc
  // comment). Lets a hub's floor plan sprawl arbitrarily far past what's
  // ever been walked, since only this nearby bubble plus permanently
  // revealed tiles ever render at all.
  const nearbyTiles = useMemo(() => new Set(tilesWithinRadius(hub.grid, playerPosition, AMBIENT_FOG_RADIUS)), [hub.grid, playerPosition])

  useGridKeydownMovement(hub.grid, playerPosition, moveTo, reachable, Boolean(activeOverlay) || editingMap)

  const currentPoi = useMemo(
    () => hub.grid.pois.find((poi) => poi.position.x === playerPosition.x && poi.position.y === playerPosition.y) ?? null,
    [hub.grid.pois, playerPosition],
  )

  const currentDoor = useMemo(() => doorAt(hub.grid, playerPosition), [hub.grid, playerPosition])
  const currentBackgroundZone = useMemo(
    () =>
      hub.grid.backgroundZones?.find((zone) =>
        zone.tiles.some((tile) => tile.x === playerPosition.x && tile.y === playerPosition.y),
      ) ?? null,
    [hub.grid.backgroundZones, playerPosition],
  )
  const activeBackground = currentPoi?.backgroundId
    ? BACKGROUNDS[currentPoi.backgroundId]
    : currentDoor?.backgroundId
      ? BACKGROUNDS[currentDoor.backgroundId]
    : currentBackgroundZone
      ? BACKGROUNDS[currentBackgroundZone.backgroundId]
      : background

  const discoveredPois = useMemo(
    () => hub.grid.pois.filter((poi) => revealedTiles.has(tileKey(poi.position))),
    [hub.grid.pois, revealedTiles],
  )

  // What the AR-scan panel says about the square the player is standing on
  // right now, in place of a single static hub-wide blurb — a POI's or
  // door's own description if standing on one, else the hub's general blurb.
  // Only the hub-blurb fallback is a single atomic field, so it's the only
  // case wrapped for editing below — the POI branch joins several
  // interactions' descriptions into one string, which isn't a single source
  // field to write back to.
  const squareBlurb = useMemo(() => {
    if (currentPoi) {
      return currentPoi.interactions
        .map((interaction) => (interaction.available ? interaction.description : (interaction.lockedReason ?? interaction.description)))
        .join(' ')
    }
    if (currentDoor) return isDoorUnlocked(playerPosition) ? currentDoor.label : currentDoor.lockedReason
    return hub.blurb
  }, [currentPoi, currentDoor, isDoorUnlocked, playerPosition, hub.blurb])
  const squareBlurbIsHubBlurb = !currentPoi && !currentDoor

  return (
    <>
    <div className="relative flex-1 overflow-hidden">
      {activeBackground?.imageSrc && (
        <>
          <img src={activeBackground.imageSrc} alt="" className="absolute inset-0 h-full w-full object-cover blur-[4px]" />
          <div className="absolute inset-0 bg-black/35" />
        </>
      )}
      {!background?.imageSrc && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 25%, color-mix(in srgb, var(--color-chrome-primary) 12%, transparent), transparent 35%), linear-gradient(180deg, rgba(2, 5, 8, 0.8), rgba(5, 5, 5, 0.97))',
          }}
        />
      )}

      {/* Floating AR-scan overlay — absolutely positioned over the grid
          rather than a flex sibling of it, so a long blurb (a POI's joined
          interaction descriptions, or the hub's own blurb) can never steal
          vertical space from the grid area below and force it into its own
          scrollbar. Panel's own bg-black/75 + backdrop-blur (ui/Panel.tsx)
          is exactly the "hovering HUD chrome over the scene" look this
          needs, the same treatment DialogueScreen's status HUD already
          uses. pointer-events-none on the wrapper, re-enabled per-panel, so
          the dead space between the two panels doesn't swallow clicks/drags
          meant for the grid underneath. */}
      <div className="pointer-events-none absolute inset-x-6 top-6 z-20 flex flex-wrap items-start justify-between gap-4">
        <Panel size="md" className="pointer-events-auto inline-flex max-w-xl flex-col gap-3 p-4">
          <span className="font-display text-[11px] uppercase tracking-[0.35em] text-chrome-primary/70">Location Hub — AR Scan</span>
          <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-white">{hub.name}</h1>
          {showTileIds && <p className="font-display text-[10px] uppercase tracking-[0.3em] text-white/45">Square ID: {tileKey(playerPosition)}</p>}
          {squareBlurbIsHubBlurb ? (
            <EditableText className="font-body text-base leading-6 text-white/72" value={squareBlurb} file="locationHubs" field="blurb" />
          ) : (
            <p className="font-body text-base leading-6 text-white/72">{squareBlurb}</p>
          )}
          {/* HubCardListView already has an inline "Return to Map" button;
              grid hubs relied on NavRail's small MAP icon alone, which
              didn't read as an obvious way out. Gated on standing at the
              grid's entry tile — the same square you walked in on is the
              only way back out, same as entering. */}
          <div className="flex gap-2">
            <CyberButton
              className="self-start !px-3 !py-2 !text-xs"
              disabled={!atEntry}
              title={atEntry ? undefined : 'Return to the entrance to leave.'}
              onClick={onReturnToMap}
            >
              Return to Map
            </CyberButton>
            {import.meta.env.DEV && mapEditEnabled && (
              <CyberButton className="self-start !px-3 !py-2 !text-xs" onClick={openMapEditor}>
                Edit Map
              </CyberButton>
            )}
          </div>
        </Panel>

        {/* Text fallback for keyboard/precision players and screen readers —
            only lists POIs already revealed; clicking one is equivalent to
            walking onto it, so a POI glimpsed through a locked door is
            listed but disabled rather than a fog/door-bypassing shortcut. */}
        <Panel size="sm" className="pointer-events-auto max-w-xs p-3">
          <p className="font-display text-[10px] uppercase tracking-[0.3em] text-white/60">Known Places</p>
          <div className="mt-2 flex flex-col gap-1">
            {discoveredPois.length === 0 && <p className="font-body text-xs text-white/40">Nothing mapped yet. Move to reveal the room.</p>}
            {discoveredPois.map((poi) => {
              const isReachable = reachable.has(tileKey(poi.position))
              return (
                <button
                  key={poi.id}
                  type="button"
                  disabled={!isReachable}
                  title={isReachable ? undefined : 'Sealed behind a locked door.'}
                  onClick={() => isReachable && moveTo(poi.position)}
                  className={`text-left font-body text-xs underline decoration-white/20 underline-offset-2 ${
                    isReachable ? 'text-white/65 hover:text-chrome-secondary' : 'text-white/30 no-underline'
                  }`}
                >
                  {poi.interactions.map((interaction) => interaction.label).join(' / ')}
                </button>
              )
            })}
          </div>
        </Panel>
      </div>

      <div className="relative z-10 flex h-full flex-col gap-4 p-6">
        {/* Camera viewport: fixed-size and overflow-hidden rather than the
            old "center the whole grid, scroll if it's bigger than the
            screen" layout — the inner grid is absolutely positioned and
            panned via `transform` so the player's tile always sits at the
            viewport's center, however large the authored grid is. This is
            also what makes AMBIENT_FOG_RADIUS's "sprawl past the visible
            area" fog meaningful: without a camera, a big enough hub would
            just force a scrollbar (or shrink to fit) instead of staying
            explorable. */}
        <div className="relative flex-1 overflow-hidden">
          <div
            className={`absolute left-1/2 top-1/2 ${reduceMotion ? '' : 'transition-transform duration-200 ease-out'}`}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${hub.grid.width}, ${TILE_PX}px)`,
              gridTemplateRows: `repeat(${hub.grid.height}, ${TILE_PX}px)`,
              gap: TILE_GAP,
              transform: `translate(${-(playerPosition.x * TILE_PITCH + TILE_PX / 2)}px, ${-(playerPosition.y * TILE_PITCH + TILE_PX / 2)}px)`,
            }}
          >
            {hub.grid.layoutRows.flatMap((row, y) =>
              [...row].map((_char, x) => {
                const key = tileKey({ x, y })
                const kind = tileKindAt(hub.grid, { x, y })

                // Only enterable tiles (floor/POI/door) are ever rendered as
                // a square — walls and void alike are invisible, occupying
                // their CSS grid slot (required for the implicit row-major
                // auto-placement below to keep every other cell aligned)
                // without drawing anything, since neither can be walked onto.
                if (kind !== 'floor' && kind !== 'poi' && kind !== 'door') return <div key={key} className="pointer-events-none" />

                const revealed = revealedTiles.has(key)
                // Neither permanently revealed nor currently nearby — render
                // nothing, same as a wall/void tile, rather than the faint
                // "unrevealed" outline below (AMBIENT_FOG_RADIUS above).
                if (!revealed && !nearbyTiles.has(key)) return <div key={key} className="pointer-events-none" />
                const isPlayer = playerPosition.x === x && playerPosition.y === y
                const poi = hub.grid.pois.find((p) => p.position.x === x && p.position.y === y)
                const door = kind === 'door' ? doorAt(hub.grid, { x, y }) : null
                const doorUnlocked = door ? isDoorUnlocked({ x, y }) : false
                const isEntry = hub.grid.entryTile.x === x && hub.grid.entryTile.y === y
                // A POI reads as "a person" only when every interaction on it
                // is talk — a tile mixing talk and inspect (or inspect-only)
                // still gets the generic poiMarker, since it isn't just a person.
                const isPureCharacter = Boolean(poi && poi.interactions.length > 0 && poi.interactions.every((i) => i.type === 'talk'))

                return (
                  <div
                    key={key}
                    title={door ? (doorUnlocked ? door.label : door.lockedReason) : isEntry ? 'Entrance — return here to leave.' : undefined}
                    className={`relative flex items-center justify-center border ${reduceMotion ? '' : 'transition-colors duration-150'}`}
                    style={{
                      borderColor: revealed ? 'color-mix(in srgb, var(--color-chrome-primary) 35%, transparent)' : 'rgba(255,255,255,0.05)',
                      background: !revealed
                        ? 'rgba(2,4,6,0.95)'
                        : door && !doorUnlocked
                          ? 'color-mix(in srgb, #ff4444 22%, transparent)'
                          : poi
                            ? 'color-mix(in srgb, var(--color-chrome-secondary) 18%, transparent)'
                            : 'color-mix(in srgb, var(--color-chrome-primary) 6%, transparent)',
                    }}
                  >
                    {revealed && door && !isPlayer && (
                      <Icon id="door" size={52} color={doorUnlocked ? 'rgba(255,255,255,0.55)' : '#ff6666'} glow={!doorUnlocked} />
                    )}
                    {revealed && poi && !isPlayer && (
                      <Icon id={isPureCharacter ? 'character' : 'poiMarker'} size={52} color="var(--color-chrome-secondary)" glow />
                    )}
                    {revealed && isEntry && !poi && !door && !isPlayer && (
                      <Icon id="exitPoint" size={52} color="var(--color-chrome-primary)" glow />
                    )}
                    {isPlayer && (
                      <span
                        className="h-3 w-3 rotate-45"
                        style={{ background: 'var(--color-chrome-primary)', boxShadow: '0 0 10px var(--color-chrome-primary)' }}
                      />
                    )}
                    {showTileIds && (
                      <span className="pointer-events-none absolute bottom-1 left-1 font-mono text-[9px] leading-none text-white/70">
                        {key}
                      </span>
                    )}
                  </div>
                )
              }),
            )}
          </div>
        </div>

        {/* Bottom interaction bar — only ever shows the current tile's POI, a
            list because one POI can hold several people/things. The action
            row itself (Panel) stays a thin strip; a talk entry's portrait
            floats above it instead of living inside it — Panel's clip-path
            corner-cut would crop off anything overflowing its own box, so
            the portrait row is a sibling positioned via `bottom-full` off
            this wrapper's own relative box, free to rise above (and visually
            over) the grid viewport rather than inflating the strip's
            height. Silhouette until conversationStore.hasMet(npcId), the
            NPC's real portrait after (docs/GAME_GUIDE.md §6.2's "Talk portraits"). */}
        <div className="relative min-h-[6rem]">
          {currentPoi && (
            <>
              <div className="pointer-events-none absolute inset-x-4 bottom-full z-10 flex flex-wrap items-end gap-3 pb-2">
                {currentPoi.interactions.map(
                  (interaction) =>
                    interaction.type === 'talk' &&
                    interaction.npcId && (
                      <div key={interaction.id} className="pointer-events-auto">
                        <TalkPortrait npcId={interaction.npcId} available={interaction.available} />
                      </div>
                    ),
                )}
              </div>
              <Panel size="md" className="flex flex-wrap items-end gap-3 p-4 !bg-black/20">
                {currentPoi.interactions.map((interaction) => (
                  <CyberButton
                    key={interaction.id}
                    disabled={!interaction.available}
                    tag={interaction.type === 'talk' ? 'Talk' : 'Inspect'}
                    title={interaction.available ? interaction.description : (interaction.lockedReason ?? interaction.description)}
                    onClick={() => interaction.available && onEnterInteraction(interaction)}
                  >
                    {interaction.type === 'talk' && interaction.npcId ? (
                      <TalkButtonLabel npcId={interaction.npcId} label={interaction.label} />
                    ) : (
                      interaction.label
                    )}
                  </CyberButton>
                ))}
              </Panel>
            </>
          )}
        </div>
      </div>
    </div>
    {editingMap && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={closeMapEditor}>
        <Panel size="lg" className="flex h-[95vh] w-[95vw] max-w-[1600px] flex-col gap-4 p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h1 className="font-display text-lg font-bold uppercase tracking-widest text-chrome-primary">Edit_Map — {hub.id}</h1>
            <CyberButton onClick={closeMapEditor}>Close</CyberButton>
          </div>
          <MapEditorPanel
            initialMode="hub"
            allowModeSwitch={false}
            initialData={hubToBuilderState(hub)}
            onSave={(record) => saveHubRecord(hub.id, record)}
            saveLabel="Save to locationHubs.ts"
          />
        </Panel>
      </div>
    )}
    </>
  )
}
