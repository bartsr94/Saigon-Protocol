// Pure movement/collision math for walkable grid exploration
// (Architecture §7's Location Hub Layer). No store or DOM access here —
// same pure/testable split as checkResolution.ts. Shared by both Location
// Hub grids (content/locationHubs.ts) and District Street grids
// (content/districtStreets.ts) — every function here is typed against the
// minimal structural shape it actually needs (`{ layoutRows }` for
// movement/collision, `{ pois }` for POI lookup) rather than either
// content module's concrete type, so neither duplicates this math.
// HubGridView/DistrictStreetView call step() to compute a candidate move,
// then hand the result to gameplayStore's moveTo()/moveInDistrict() to
// actually mutate state.

import type { GridPosition } from '../content/locationHubs'

export type GridDirection = 'up' | 'down' | 'left' | 'right'

/** The minimal shape movement/collision/fog math needs — just the tile rows. */
interface GridLayout {
  layoutRows: string[]
}

const DIRECTION_DELTAS: Record<GridDirection, GridPosition> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

function tileAt(grid: GridLayout, position: GridPosition): string | null {
  const row = grid.layoutRows[position.y]
  if (row === undefined || position.x < 0 || position.x >= row.length) return null
  return row[position.x]
}

export type TileKind = 'floor' | 'wall' | 'poi' | 'void' | 'door'

/**
 * Classifies the raw `layoutRows` character at `position`, or null if the
 * position is off the grid entirely. 'void' (' ') means "not part of this
 * location's floor plan" — distinct from a wall, which is still part of the
 * room, just solid. 'door' ('d') is a conditionally-walkable gate — see
 * `isWalkable`'s `isDoorUnlocked` param. Any character other than the five
 * recognized markers defaults to 'floor', matching '.'.
 */
export function tileKindAt(grid: GridLayout, position: GridPosition): TileKind | null {
  const tile = tileAt(grid, position)
  if (tile === null) return null
  if (tile === '#') return 'wall'
  if (tile === 'o') return 'poi'
  if (tile === 'd') return 'door'
  if (tile === ' ') return 'void'
  return 'floor'
}

/**
 * A tile is walkable if it's floor, a POI marker, or a door — a locked door
 * can always be stepped onto (you can walk right up to a sealed door and
 * read it), it just doesn't let movement continue past it. That "can't pass
 * beyond" gating lives in `reachableTiles`/`step`, not here — walls, void,
 * and off-grid positions are the only tiles never walkable.
 */
export function isWalkable(grid: GridLayout, position: GridPosition): boolean {
  const kind = tileKindAt(grid, position)
  return kind === 'floor' || kind === 'poi' || kind === 'door'
}

/** The minimal shape `reachableTiles` needs beyond `GridLayout` — a known spawn point to flood-fill from. */
interface GridLayoutWithEntry extends GridLayout {
  entryTile: GridPosition
}

/**
 * Every tile reachable from `grid.entryTile` by walking through floor/POI
 * tiles and unlocked doors — i.e. everywhere the player could actually walk
 * to right now. A locked door tile is itself included (you can always step
 * onto one) but flood-fill doesn't continue past it, so whatever's on the
 * far side stays unreachable until it unlocks — even if that far side is
 * otherwise open floor. Recomputed fresh on each call rather than cached:
 * hub/street grids are small (tens of tiles), so a full flood-fill per
 * keypress is cheap, and staying stateless means there's nothing to keep in
 * sync with caseStore's unlock flags.
 */
export function reachableTiles(
  grid: GridLayoutWithEntry,
  isDoorUnlocked: (position: GridPosition) => boolean = () => false,
): Set<string> {
  const start = grid.entryTile
  const visited = new Set<string>([tileKey(start)])
  const queue: GridPosition[] = [start]
  while (queue.length > 0) {
    const current = queue.shift() as GridPosition
    for (const direction of Object.keys(DIRECTION_DELTAS) as GridDirection[]) {
      const delta = DIRECTION_DELTAS[direction]
      const next = { x: current.x + delta.x, y: current.y + delta.y }
      const key = tileKey(next)
      if (visited.has(key)) continue
      const kind = tileKindAt(grid, next)
      if (kind !== 'floor' && kind !== 'poi' && kind !== 'door') continue
      visited.add(key)
      if (kind === 'door' && !isDoorUnlocked(next)) continue
      queue.push(next)
    }
  }
  return visited
}

/**
 * The tile reached by moving one step from `from` in `direction`, or `from`
 * unchanged if the target is a wall/void/off-grid tile, or is only reachable
 * by passing through a locked door. Takes an already-computed `reachable`
 * set (from `reachableTiles`) rather than flood-filling it itself — callers
 * already need that same set for their own UI (e.g. gating a "Known Places"
 * shortcut list), so computing it once per move and sharing it avoids
 * running the flood-fill twice per keypress (PERFORMANCE_PASS_SPEC.md §2).
 */
export function step(grid: GridLayout, from: GridPosition, direction: GridDirection, reachable: Set<string>): GridPosition {
  const delta = DIRECTION_DELTAS[direction]
  const next = { x: from.x + delta.x, y: from.y + delta.y }
  if (!isWalkable(grid, next)) return from
  return reachable.has(tileKey(next)) ? next : from
}

export function tileKey(position: GridPosition): string {
  return `${position.x},${position.y}`
}

/**
 * How far (Manhattan distance) around the player's *current* position a tile
 * renders as a bare fog-of-war outline even if it's never been permanently
 * revealed — distinct from a grid's own `visionRadius` (gameplayStore.ts),
 * which governs the much smaller radius that gets permanently remembered
 * (full detail: icons, POI/door identity) on each move. This radius is
 * recomputed fresh from the live player position every render rather than
 * persisted — walk away and a tile outside both this radius and
 * `revealedTiles` goes back to being fully invisible, not just undetailed,
 * since the player has no way of knowing there's a room there until they've
 * actually been close enough to see it (or, eventually, been told about it
 * by some other means).
 */
export const AMBIENT_FOG_RADIUS = 5

function isRevealable(grid: GridLayout, position: GridPosition): boolean {
  const kind = tileKindAt(grid, position)
  return kind === 'floor' || kind === 'poi' || kind === 'door'
}

/**
 * Tile keys within `radius` (Manhattan distance) of `position` that exist on
 * the grid — used for fog-of-war reveal bookkeeping. Manhattan distance
 * gives the "+"-shaped vision the spec describes at radius 1 (orthogonal
 * neighbors only, no diagonals) without special-casing that shape.
 * Floor/POI/door tiles are revealable — walls and void are never rendered as
 * a square (only enterable-or-door tiles are), so there's nothing to reveal
 * about them. A locked door is still worth revealing (the player should see
 * a sealed door, not nothing), so this deliberately doesn't route through
 * `isWalkable`/`isDoorUnlocked` the way `step()` does.
 */
export function tilesWithinRadius(grid: GridLayout, position: GridPosition, radius: number): string[] {
  const keys: string[] = []
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (Math.abs(dx) + Math.abs(dy) > radius) continue
      const candidate = { x: position.x + dx, y: position.y + dy }
      if (isRevealable(grid, candidate)) keys.push(tileKey(candidate))
    }
  }
  return keys
}

/** The POI occupying `position`, if any — generic over any POI shape carrying a `position`, so Hub POIs and District Street POIs share this lookup. */
export function poiAt<TPoi extends { position: GridPosition }>(grid: { pois: TPoi[] }, position: GridPosition): TPoi | null {
  return grid.pois.find((poi) => poi.position.x === position.x && poi.position.y === position.y) ?? null
}

/** The door occupying `position`, if any — same generic shape as `poiAt`, keyed off an (optional) `doors` list instead of `pois`. */
export function doorAt<TDoor extends { position: GridPosition }>(grid: { doors?: TDoor[] }, position: GridPosition): TDoor | null {
  return (grid.doors ?? []).find((door) => door.position.x === position.x && door.position.y === position.y) ?? null
}
