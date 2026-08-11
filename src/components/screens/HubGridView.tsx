// Walkable fog-of-war Location Hub presentation
// (Architecture §7's Location Hub Layer): a small tile grid rendered as a
// HUD/AR-scan overlay over the dimmed location background. WASD/arrow keys
// move the player one tile at a time (src/engine/gridMovement.ts owns the
// pure step/collision math); standing on a POI tile surfaces its
// interaction list in the bottom action bar.

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BackgroundDefinition } from '../../content/backgrounds'
import type { GridHubDefinition, GridPosition } from '../../content/locationHubs'
import type { LocationId } from '../../content/locations'
import { doorAt, reachableTiles, step, tileKey, tileKindAt, type GridDirection } from '../../engine/gridMovement'
import { useCasefileStore } from '../../stores/casefileStore'
import { useDebugMapEditStore } from '../../stores/debugMapEditStore'
import { useGameplayStore } from '../../stores/gameplayStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useUiStore } from '../../stores/uiStore'
import { CyberButton, Icon, Panel } from '../ui'
import { EditableText } from '../debug/EditableText'
import { MapEditorPanel, type SaveResult } from './MapEditorPanel'
import { hubToBuilderState } from './mapEditorSeed'

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
  onEnterStory: (id: LocationId) => void
  onReturnToMap: () => void
  atEntry: boolean
}

const TILE_PX = 56
const EMPTY_REVEALED: Set<string> = new Set()

const KEY_DIRECTIONS: Record<string, GridDirection> = {
  w: 'up',
  arrowup: 'up',
  s: 'down',
  arrowdown: 'down',
  a: 'left',
  arrowleft: 'left',
  d: 'right',
  arrowright: 'right',
}

export function HubGridView({ hub, background, onEnterStory, onReturnToMap, atEntry }: HubGridViewProps) {
  const playerPosition = useGameplayStore((s) => s.playerPosition) ?? hub.grid.entryTile
  const revealedTiles = useGameplayStore((s) => s.revealedTiles[hub.id]) ?? EMPTY_REVEALED
  const moveTo = useGameplayStore((s) => s.moveTo)
  const activeOverlay = useUiStore((s) => s.activeOverlay)
  const reduceMotion = useSettingsStore((s) => s.reduceMotion)
  const casefileFlags = useCasefileStore((s) => s.flags)
  const mapEditEnabled = useDebugMapEditStore((s) => s.enabled)
  const [editingMap, setEditingMap] = useState(false)

  // Resolves a door tile's lock state from casefileStore at the component
  // layer — gridMovement.ts stays store-agnostic (CLAUDE.md's simulation/UI
  // separation), so `step()` takes this as an injected predicate rather
  // than reaching for the store itself.
  const isDoorUnlocked = useCallback(
    (position: GridPosition) => {
      const door = doorAt(hub.grid, position)
      return door ? casefileFlags.has(door.unlockFlag) : false
    },
    [hub.grid, casefileFlags],
  )

  // Discrete tile-stepping: one keypress/repeat moves exactly one tile, per
  // the spec's movement rules — not continuous free movement. Re-registers
  // whenever playerPosition changes so step() always collides against the
  // current tile, not a stale closure.
  useEffect(() => {
    if (activeOverlay) return
    function handleKeyDown(event: KeyboardEvent) {
      const direction = KEY_DIRECTIONS[event.key.toLowerCase()]
      if (!direction) return
      event.preventDefault()
      const next = step(hub.grid, playerPosition, direction, isDoorUnlocked)
      if (next.x !== playerPosition.x || next.y !== playerPosition.y) moveTo(next)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeOverlay, hub.grid, playerPosition, moveTo, isDoorUnlocked])

  const currentPoi = useMemo(
    () => hub.grid.pois.find((poi) => poi.position.x === playerPosition.x && poi.position.y === playerPosition.y) ?? null,
    [hub.grid.pois, playerPosition],
  )

  const currentDoor = useMemo(() => doorAt(hub.grid, playerPosition), [hub.grid, playerPosition])

  const discoveredPois = useMemo(
    () => hub.grid.pois.filter((poi) => revealedTiles.has(tileKey(poi.position))),
    [hub.grid.pois, revealedTiles],
  )

  // Tiles actually reachable right now (locked doors block whatever's past
  // them) — gates the "Known Places" shortcut so clicking a POI glimpsed
  // through a sealed door can't teleport past it; walking there the normal
  // way is already gated the same way inside step().
  const reachable = useMemo(() => reachableTiles(hub.grid, isDoorUnlocked), [hub.grid, isDoorUnlocked])

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
      {background?.imageSrc && (
        <>
          <img src={background.imageSrc} alt="" className="absolute inset-0 h-full w-full object-cover blur-sm" />
          <div className="absolute inset-0 bg-black/70" />
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

      <div className="relative z-10 flex h-full flex-col gap-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <Panel size="md" className="inline-flex max-w-xl flex-col gap-3 p-4">
            <span className="font-display text-[11px] uppercase tracking-[0.35em] text-chrome-primary/70">Location Hub — AR Scan</span>
            <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-white">{hub.name}</h1>
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
                <CyberButton className="self-start !px-3 !py-2 !text-xs" onClick={() => setEditingMap(true)}>
                  Edit Map
                </CyberButton>
              )}
            </div>
          </Panel>

          {/* Text fallback for keyboard/precision players and screen readers —
              only lists POIs already revealed; clicking one is equivalent to
              walking onto it, so a POI glimpsed through a locked door is
              listed but disabled rather than a fog/door-bypassing shortcut. */}
          <Panel size="sm" className="max-w-xs p-3">
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

        <div className="flex flex-1 items-center justify-center overflow-auto">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${hub.grid.width}, ${TILE_PX}px)`,
              gridTemplateRows: `repeat(${hub.grid.height}, ${TILE_PX}px)`,
              gap: 2,
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
                  </div>
                )
              }),
            )}
          </div>
        </div>

        {/* Bottom interaction bar — only ever shows the current tile's POI, a
            list because one POI can hold several people/things. */}
        <div className="min-h-[6rem]">
          {currentPoi && (
            <Panel size="md" className="flex flex-wrap gap-3 p-4">
              {currentPoi.interactions.map((interaction) => (
                <CyberButton
                  key={interaction.id}
                  disabled={!interaction.available}
                  tag={interaction.type === 'talk' ? 'Talk' : 'Inspect'}
                  title={interaction.available ? interaction.description : (interaction.lockedReason ?? interaction.description)}
                  onClick={() => interaction.available && onEnterStory(interaction.storyLocationId)}
                >
                  {interaction.label}
                </CyberButton>
              ))}
            </Panel>
          )}
        </div>
      </div>
    </div>
    {editingMap && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setEditingMap(false)}>
        <Panel size="lg" className="flex h-[95vh] w-[95vw] max-w-[1600px] flex-col gap-4 p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h1 className="font-display text-lg font-bold uppercase tracking-widest text-chrome-primary">Edit_Map — {hub.id}</h1>
            <CyberButton onClick={() => setEditingMap(false)}>Close</CyberButton>
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
