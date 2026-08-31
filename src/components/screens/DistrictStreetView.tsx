// Walkable fog-of-war District Street presentation
// (Architecture §7's District Street Layer): the same
// tile-grid/AR-scan treatment HubGridView.tsx uses one level up — a small
// walkable street between the Overworld and a Location Hub, where each POI
// names a Location Hub rather than a talk/inspect interaction list. Kept as
// its own component rather than sharing a base with HubGridView (same
// precedent as HubGridView/HubCardListView already coexisting as
// independent siblings) since the bottom-bar content genuinely differs.

import { useCallback, useMemo } from 'react'
import type { BackgroundDefinition } from '../../content/backgrounds'
import type { DistrictStreetDefinition } from '../../content/districtStreets'
import type { GridPosition } from '../../content/locationHubs'
import { AMBIENT_FOG_RADIUS, doorAt, reachableTiles, tileKey, tileKindAt, tilesWithinRadius } from '../../engine/gridMovement'
import { useCaseStore } from '../../stores/caseStore'
import { useDebugMapEditStore } from '../../stores/debugMapEditStore'
import { useDebugTileIdStore } from '../../stores/debugTileIdStore'
import { useGameplayStore } from '../../stores/gameplayStore'
import { useNavigationStore } from '../../stores/navigationStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useUiStore } from '../../stores/uiStore'
import { CyberButton, Icon, Panel } from '../ui'
import { EditableText } from '../debug/EditableText'
import { MapEditorPanel, type SaveResult } from './MapEditorPanel'
import { streetToBuilderState } from './mapEditorSeed'
import { enterLocationHub } from './enterLocationHub'
import { useGridKeydownMovement } from './useGridKeydownMovement'

async function saveStreetRecord(streetId: string, record: object): Promise<SaveResult> {
  try {
    const res = await fetch('/__debug/save-map-record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: 'districtStreets', id: streetId, record }),
    })
    const body: { error?: string } = await res.json()
    return res.ok ? { ok: true } : { ok: false, error: body.error ?? 'Save failed.' }
  } catch {
    return { ok: false, error: 'Save failed — is the dev server running?' }
  }
}

interface DistrictStreetViewProps {
  street: DistrictStreetDefinition
  background: BackgroundDefinition | null
  onReturnToMap: () => void
  atEntry: boolean
}

const TILE_PX = 56
const TILE_GAP = 2
const TILE_PITCH = TILE_PX + TILE_GAP
const EMPTY_REVEALED: Set<string> = new Set()

export function DistrictStreetView({ street, background, onReturnToMap, atEntry }: DistrictStreetViewProps) {
  const playerPosition = useGameplayStore((s) => s.districtPlayerPosition) ?? street.entryTile
  const revealedTiles = useGameplayStore((s) => s.districtRevealedTiles[street.id]) ?? EMPTY_REVEALED
  const moveInDistrict = useGameplayStore((s) => s.moveInDistrict)
  const unlockedLocationIds = useNavigationStore((s) => s.unlockedLocationIds)
  const activeOverlay = useUiStore((s) => s.activeOverlay)
  const reduceMotion = useSettingsStore((s) => s.reduceMotion)
  const caseFlags = useCaseStore((s) => s.flags)
  const mapEditEnabled = useDebugMapEditStore((s) => s.enabled)
  const editingMap = useDebugMapEditStore((s) => s.editingMap)
  const openMapEditor = useDebugMapEditStore((s) => s.openMapEditor)
  const closeMapEditor = useDebugMapEditStore((s) => s.closeMapEditor)
  const showTileIds = useDebugTileIdStore((s) => s.enabled)

  // Same store-agnostic-engine/component-resolves-flags split as
  // HubGridView's `isDoorUnlocked`.
  const isDoorUnlocked = useCallback(
    (position: GridPosition) => {
      const door = doorAt(street, position)
      return door ? caseFlags.has(door.unlockFlag) : false
    },
    [street, caseFlags],
  )

  // Same reachability gate as HubGridView's — a locked door can be seen
  // through but not shortcut past via the "Known Places" list. Computed
  // once per move and shared with useGridKeydownMovement below, rather
  // than each recomputing its own flood-fill (PERFORMANCE_PASS_SPEC.md §2).
  const reachable = useMemo(() => reachableTiles(street, isDoorUnlocked), [street, isDoorUnlocked])

  // Same live "nearby bubble" as HubGridView's — see gridMovement.ts's
  // AMBIENT_FOG_RADIUS doc comment.
  const nearbyTiles = useMemo(() => new Set(tilesWithinRadius(street, playerPosition, AMBIENT_FOG_RADIUS)), [street, playerPosition])

  useGridKeydownMovement(street, playerPosition, moveInDistrict, reachable, Boolean(activeOverlay) || editingMap)

  const currentPoi = useMemo(
    () => street.pois.find((poi) => poi.position.x === playerPosition.x && poi.position.y === playerPosition.y) ?? null,
    [street.pois, playerPosition],
  )

  const currentDoor = useMemo(() => doorAt(street, playerPosition), [street, playerPosition])

  const discoveredPois = useMemo(() => street.pois.filter((poi) => revealedTiles.has(tileKey(poi.position))), [street.pois, revealedTiles])

  // What the AR-scan panel says about the square the player is standing on
  // right now, in place of a single static street-wide blurb. Also tracks
  // which single source field (if any) that text came from, so the panel
  // below can offer it for editing — a door's label/lockedReason isn't in
  // the editable-fields allow-list, so that case stays plain text.
  const squareBlurb = useMemo((): { value: string; field: 'blurb' | 'description' | 'lockedReason' | null } => {
    if (currentPoi) {
      const available = unlockedLocationIds.has(currentPoi.locationId)
      if (available) return { value: currentPoi.description, field: 'description' }
      return currentPoi.lockedReason
        ? { value: currentPoi.lockedReason, field: 'lockedReason' }
        : { value: currentPoi.description, field: 'description' }
    }
    if (currentDoor) return { value: isDoorUnlocked(playerPosition) ? currentDoor.label : currentDoor.lockedReason, field: null }
    return { value: street.blurb, field: 'blurb' }
  }, [currentPoi, currentDoor, unlockedLocationIds, isDoorUnlocked, playerPosition, street.blurb])

  return (
    <>
    <div className="relative flex-1 overflow-hidden">
      {background?.imageSrc && (
        <>
          <img src={background.imageSrc} alt="" className="absolute inset-0 h-full w-full object-cover blur-[4px]" />
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
          rather than a flex sibling of it, so a long blurb can never steal
          vertical space from the grid area below and force it into its own
          scrollbar (same fix/rationale as HubGridView.tsx's identical
          overlay). pointer-events-none on the wrapper, re-enabled per-panel,
          so the dead space between the two panels doesn't swallow
          clicks/drags meant for the grid underneath. */}
      <div className="pointer-events-none absolute inset-x-6 top-6 z-20 flex flex-wrap items-start justify-between gap-4">
        <Panel size="md" className="pointer-events-auto inline-flex max-w-xl flex-col gap-3 p-4">
          <span className="font-display text-[11px] uppercase tracking-[0.35em] text-chrome-primary/70">District Street — AR Scan</span>
          <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-white">{street.name}</h1>
          {showTileIds && <p className="font-display text-[10px] uppercase tracking-[0.3em] text-white/45">Square ID: {tileKey(playerPosition)}</p>}
          {squareBlurb.field ? (
            <EditableText className="font-body text-base leading-6 text-white/72" value={squareBlurb.value} file="districtStreets" field={squareBlurb.field} />
          ) : (
            <p className="font-body text-base leading-6 text-white/72">{squareBlurb.value}</p>
          )}
          {/* Gated on standing at the street's entry tile — the same square
              you walked in on is the only way back out, same as entering. */}
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

        {/* Text fallback for keyboard/precision players and screen readers
            (same rationale as HubGridView's) — only lists POIs already
            revealed; clicking one is equivalent to walking onto it. */}
        <Panel size="sm" className="pointer-events-auto max-w-xs p-3">
          <p className="font-display text-[10px] uppercase tracking-[0.3em] text-white/60">Known Places</p>
          <div className="mt-2 flex flex-col gap-1">
            {discoveredPois.length === 0 && <p className="font-body text-xs text-white/40">Nothing mapped yet. Move to reveal the street.</p>}
            {discoveredPois.map((poi) => {
              const isReachable = reachable.has(tileKey(poi.position))
              return (
                <button
                  key={poi.id}
                  type="button"
                  disabled={!isReachable}
                  title={isReachable ? undefined : 'Sealed behind a locked door.'}
                  onClick={() => isReachable && moveInDistrict(poi.position)}
                  className={`text-left font-body text-xs underline decoration-white/20 underline-offset-2 ${
                    isReachable ? 'text-white/65 hover:text-chrome-secondary' : 'text-white/30 no-underline'
                  }`}
                >
                  {poi.label}
                </button>
              )
            })}
          </div>
        </Panel>
      </div>

      <div className="relative z-10 flex h-full flex-col gap-4 p-6">
        {/* Camera viewport — same fixed-size/overflow-hidden + transform-pan
            treatment as HubGridView.tsx's identical viewport; see its
            comment for the full rationale. */}
        <div className="relative flex-1 overflow-hidden">
          <div
            className={`absolute left-1/2 top-1/2 ${reduceMotion ? '' : 'transition-transform duration-200 ease-out'}`}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${street.width}, ${TILE_PX}px)`,
              gridTemplateRows: `repeat(${street.height}, ${TILE_PX}px)`,
              gap: TILE_GAP,
              transform: `translate(${-(playerPosition.x * TILE_PITCH + TILE_PX / 2)}px, ${-(playerPosition.y * TILE_PITCH + TILE_PX / 2)}px)`,
            }}
          >
            {street.layoutRows.flatMap((row, y) =>
              [...row].map((_char, x) => {
                const key = tileKey({ x, y })
                const kind = tileKindAt(street, { x, y })

                // Only enterable tiles (floor/POI/door) are ever rendered as
                // a square — same "only render what you can walk onto"
                // treatment HubGridView uses.
                if (kind !== 'floor' && kind !== 'poi' && kind !== 'door') return <div key={key} className="pointer-events-none" />

                const revealed = revealedTiles.has(key)
                // Neither permanently revealed nor currently nearby — same
                // "render nothing at all" treatment as HubGridView's.
                if (!revealed && !nearbyTiles.has(key)) return <div key={key} className="pointer-events-none" />
                const isPlayer = playerPosition.x === x && playerPosition.y === y
                const poi = street.pois.find((p) => p.position.x === x && p.position.y === y)
                const door = kind === 'door' ? doorAt(street, { x, y }) : null
                const doorUnlocked = door ? isDoorUnlocked({ x, y }) : false
                const isEntry = street.entryTile.x === x && street.entryTile.y === y

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
                      <Icon id="poiMarker" size={52} color="var(--color-chrome-secondary)" glow />
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

        {/* Bottom interaction bar — a District Street POI is just a door into
            one Location Hub, so this is a single action, not a list. */}
        <div className="min-h-[6rem]">
          {currentPoi &&
            (() => {
              const available = unlockedLocationIds.has(currentPoi.locationId)
              return (
                <Panel size="md" className="flex flex-wrap gap-3 p-4">
                  <CyberButton
                    disabled={!available}
                    tag="Enter"
                    title={available ? currentPoi.description : (currentPoi.lockedReason ?? currentPoi.description)}
                    onClick={() => available && enterLocationHub(currentPoi.locationId)}
                  >
                    {currentPoi.label}
                  </CyberButton>
                </Panel>
              )
            })()}
        </div>
      </div>
    </div>
    {editingMap && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={closeMapEditor}>
        <Panel size="lg" className="flex h-[95vh] w-[95vw] max-w-[1600px] flex-col gap-4 p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h1 className="font-display text-lg font-bold uppercase tracking-widest text-chrome-primary">Edit_Map — {street.id}</h1>
            <CyberButton onClick={closeMapEditor}>Close</CyberButton>
          </div>
          <MapEditorPanel
            initialMode="street"
            allowModeSwitch={false}
            initialData={streetToBuilderState(street)}
            onSave={(record) => saveStreetRecord(street.id, record)}
            saveLabel="Save to districtStreets.ts"
          />
        </Panel>
      </div>
    )}
    </>
  )
}
