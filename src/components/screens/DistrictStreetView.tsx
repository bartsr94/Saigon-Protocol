// Walkable fog-of-war District Street presentation
// (docs/SAIGON_2226_OVERWORLD_SPEC.md's District Street Layer): the same
// tile-grid/AR-scan treatment HubGridView.tsx uses one level up — a small
// walkable street between the Overworld and a Location Hub, where each POI
// names a Location Hub rather than a talk/inspect interaction list. Kept as
// its own component rather than sharing a base with HubGridView (same
// precedent as HubGridView/HubCardListView already coexisting as
// independent siblings) since the bottom-bar content genuinely differs.

import { useEffect, useMemo } from 'react'
import type { BackgroundDefinition } from '../../content/backgrounds'
import type { DistrictStreetDefinition } from '../../content/districtStreets'
import { step, tileKey, tileKindAt, type GridDirection } from '../../engine/gridMovement'
import { useGameplayStore } from '../../stores/gameplayStore'
import { useNavigationStore } from '../../stores/navigationStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useUiStore } from '../../stores/uiStore'
import { CyberButton, Panel } from '../ui'
import { enterLocationHub } from './enterLocationHub'

interface DistrictStreetViewProps {
  street: DistrictStreetDefinition
  background: BackgroundDefinition | null
  onReturnToMap: () => void
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

export function DistrictStreetView({ street, background, onReturnToMap }: DistrictStreetViewProps) {
  const playerPosition = useGameplayStore((s) => s.districtPlayerPosition) ?? street.entryTile
  const revealedTiles = useGameplayStore((s) => s.districtRevealedTiles[street.id]) ?? EMPTY_REVEALED
  const moveInDistrict = useGameplayStore((s) => s.moveInDistrict)
  const unlockedLocationIds = useNavigationStore((s) => s.unlockedLocationIds)
  const activeOverlay = useUiStore((s) => s.activeOverlay)
  const reduceMotion = useSettingsStore((s) => s.reduceMotion)

  // Discrete tile-stepping, same rules as HubGridView: one keypress/repeat
  // moves exactly one tile, re-registered whenever playerPosition changes so
  // step() always collides against the current tile, not a stale closure.
  useEffect(() => {
    if (activeOverlay) return
    function handleKeyDown(event: KeyboardEvent) {
      const direction = KEY_DIRECTIONS[event.key.toLowerCase()]
      if (!direction) return
      event.preventDefault()
      const next = step(street, playerPosition, direction)
      if (next.x !== playerPosition.x || next.y !== playerPosition.y) moveInDistrict(next)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeOverlay, street, playerPosition, moveInDistrict])

  const currentPoi = useMemo(
    () => street.pois.find((poi) => poi.position.x === playerPosition.x && poi.position.y === playerPosition.y) ?? null,
    [street.pois, playerPosition],
  )

  const discoveredPois = useMemo(() => street.pois.filter((poi) => revealedTiles.has(tileKey(poi.position))), [street.pois, revealedTiles])

  return (
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
            <span className="font-display text-[11px] uppercase tracking-[0.35em] text-chrome-primary/70">District Street — AR Scan</span>
            <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-white">{street.name}</h1>
            <p className="font-body text-base leading-6 text-white/72">{street.blurb}</p>
            <CyberButton className="self-start !px-3 !py-2 !text-xs" onClick={onReturnToMap}>
              Return to Map
            </CyberButton>
          </Panel>

          {/* Text fallback for keyboard/precision players and screen readers
              (same rationale as HubGridView's) — only lists POIs already
              revealed; clicking one is equivalent to walking onto it. */}
          <Panel size="sm" className="max-w-xs p-3">
            <p className="font-display text-[10px] uppercase tracking-[0.3em] text-white/60">Known Places</p>
            <div className="mt-2 flex flex-col gap-1">
              {discoveredPois.length === 0 && <p className="font-body text-xs text-white/40">Nothing mapped yet. Move to reveal the street.</p>}
              {discoveredPois.map((poi) => (
                <button
                  key={poi.id}
                  type="button"
                  onClick={() => moveInDistrict(poi.position)}
                  className="text-left font-body text-xs text-white/65 underline decoration-white/20 underline-offset-2 hover:text-chrome-secondary"
                >
                  {poi.label}
                </button>
              ))}
            </div>
          </Panel>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-auto">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${street.width}, ${TILE_PX}px)`,
              gridTemplateRows: `repeat(${street.height}, ${TILE_PX}px)`,
              gap: 2,
            }}
          >
            {street.layoutRows.flatMap((row, y) =>
              [...row].map((_char, x) => {
                const key = tileKey({ x, y })
                const kind = tileKindAt(street, { x, y })

                // Only enterable tiles (floor/POI) are ever rendered as a
                // square — same "only render what you can walk onto"
                // treatment HubGridView uses (docs/LOCATION_GRID_EXPLORATION_SPEC.md).
                if (kind !== 'floor' && kind !== 'poi') return <div key={key} className="pointer-events-none" />

                const revealed = revealedTiles.has(key)
                const isPlayer = playerPosition.x === x && playerPosition.y === y
                const poi = street.pois.find((p) => p.position.x === x && p.position.y === y)

                return (
                  <div
                    key={key}
                    className={`relative flex items-center justify-center border ${reduceMotion ? '' : 'transition-colors duration-150'}`}
                    style={{
                      borderColor: revealed ? 'color-mix(in srgb, var(--color-chrome-primary) 35%, transparent)' : 'rgba(255,255,255,0.05)',
                      background: !revealed
                        ? 'rgba(2,4,6,0.95)'
                        : poi
                          ? 'color-mix(in srgb, var(--color-chrome-secondary) 18%, transparent)'
                          : 'color-mix(in srgb, var(--color-chrome-primary) 6%, transparent)',
                    }}
                  >
                    {revealed && poi && !isPlayer && (
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: 'var(--color-chrome-secondary)', boxShadow: '0 0 8px var(--color-chrome-secondary)' }}
                      />
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
  )
}
