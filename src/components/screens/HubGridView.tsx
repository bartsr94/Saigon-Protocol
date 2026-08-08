// Walkable fog-of-war Location Hub presentation
// (docs/LOCATION_GRID_EXPLORATION_SPEC.md): a small tile grid rendered as a
// HUD/AR-scan overlay over the dimmed location background. WASD/arrow keys
// move the player one tile at a time (src/engine/gridMovement.ts owns the
// pure step/collision math); standing on a POI tile surfaces its
// interaction list in the bottom action bar.

import { useEffect, useMemo } from 'react'
import type { BackgroundDefinition } from '../../content/backgrounds'
import type { GridHubDefinition } from '../../content/locationHubs'
import type { LocationId } from '../../content/locations'
import { step, tileKey, type GridDirection } from '../../engine/gridMovement'
import { useGameplayStore } from '../../stores/gameplayStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useUiStore } from '../../stores/uiStore'
import { CyberButton, Panel } from '../ui'

interface HubGridViewProps {
  hub: GridHubDefinition
  background: BackgroundDefinition | null
  onEnterStory: (id: LocationId) => void
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

export function HubGridView({ hub, background, onEnterStory }: HubGridViewProps) {
  const playerPosition = useGameplayStore((s) => s.playerPosition) ?? hub.grid.entryTile
  const revealedTiles = useGameplayStore((s) => s.revealedTiles[hub.id]) ?? EMPTY_REVEALED
  const moveTo = useGameplayStore((s) => s.moveTo)
  const activeOverlay = useUiStore((s) => s.activeOverlay)
  const reduceMotion = useSettingsStore((s) => s.reduceMotion)

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
      const next = step(hub.grid, playerPosition, direction)
      if (next.x !== playerPosition.x || next.y !== playerPosition.y) moveTo(next)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeOverlay, hub.grid, playerPosition, moveTo])

  const currentPoi = useMemo(
    () => hub.grid.pois.find((poi) => poi.position.x === playerPosition.x && poi.position.y === playerPosition.y) ?? null,
    [hub.grid.pois, playerPosition],
  )

  const discoveredPois = useMemo(
    () => hub.grid.pois.filter((poi) => revealedTiles.has(tileKey(poi.position))),
    [hub.grid.pois, revealedTiles],
  )

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
          <Panel size="md" className="inline-flex max-w-xl flex-col gap-2 p-4">
            <span className="font-display text-[11px] uppercase tracking-[0.35em] text-chrome-primary/70">Location Hub — AR Scan</span>
            <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-white">{hub.name}</h1>
            <p className="font-body text-base leading-6 text-white/72">{hub.blurb}</p>
          </Panel>

          {/* Text fallback for keyboard/precision players and screen readers
              (docs/LOCATION_GRID_EXPLORATION_SPEC.md's Accessibility section) —
              only lists POIs already revealed; clicking one is equivalent to
              walking onto it, not a fog-bypassing shortcut. */}
          <Panel size="sm" className="max-w-xs p-3">
            <p className="font-display text-[10px] uppercase tracking-[0.3em] text-white/60">Known Places</p>
            <div className="mt-2 flex flex-col gap-1">
              {discoveredPois.length === 0 && <p className="font-body text-xs text-white/40">Nothing mapped yet. Move to reveal the room.</p>}
              {discoveredPois.map((poi) => (
                <button
                  key={poi.id}
                  type="button"
                  onClick={() => moveTo(poi.position)}
                  className="text-left font-body text-xs text-white/65 underline decoration-white/20 underline-offset-2 hover:text-chrome-secondary"
                >
                  {poi.interactions.map((interaction) => interaction.label).join(' / ')}
                </button>
              ))}
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
              [...row].map((char, x) => {
                const key = tileKey({ x, y })
                const revealed = revealedTiles.has(key)
                const isWall = char === '#'
                const isPlayer = playerPosition.x === x && playerPosition.y === y
                const poi = hub.grid.pois.find((p) => p.position.x === x && p.position.y === y)

                return (
                  <div
                    key={key}
                    className={`relative flex items-center justify-center border ${reduceMotion ? '' : 'transition-colors duration-150'}`}
                    style={{
                      borderColor: revealed ? 'color-mix(in srgb, var(--color-chrome-primary) 35%, transparent)' : 'rgba(255,255,255,0.05)',
                      background: !revealed
                        ? 'rgba(2,4,6,0.95)'
                        : isWall
                          ? 'rgba(255,255,255,0.06)'
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

        {/* Bottom interaction bar — only ever shows the current tile's POI, a
            list because one POI can hold several people/things
            (docs/LOCATION_GRID_EXPLORATION_SPEC.md's multi-interaction decision). */}
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
  )
}
