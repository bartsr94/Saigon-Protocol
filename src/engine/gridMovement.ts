// Pure movement/collision math for walkable grid exploration
// (docs/LOCATION_GRID_EXPLORATION_SPEC.md). No store or DOM access here —
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

export type TileKind = 'floor' | 'wall' | 'poi' | 'void'

/**
 * Classifies the raw `layoutRows` character at `position`, or null if the
 * position is off the grid entirely. 'void' (' ') means "not part of this
 * location's floor plan" — distinct from a wall, which is still part of the
 * room, just solid. Any character other than the four recognized markers
 * defaults to 'floor', matching '.'.
 */
export function tileKindAt(grid: GridLayout, position: GridPosition): TileKind | null {
  const tile = tileAt(grid, position)
  if (tile === null) return null
  if (tile === '#') return 'wall'
  if (tile === 'o') return 'poi'
  if (tile === ' ') return 'void'
  return 'floor'
}

/** A tile is walkable only if it's floor or a POI marker — walls, void, and off-grid positions are not. */
export function isWalkable(grid: GridLayout, position: GridPosition): boolean {
  const kind = tileKindAt(grid, position)
  return kind === 'floor' || kind === 'poi'
}

/** The tile reached by moving one step from `from` in `direction`, or `from` unchanged if the target is a wall or off the grid. */
export function step(grid: GridLayout, from: GridPosition, direction: GridDirection): GridPosition {
  const delta = DIRECTION_DELTAS[direction]
  const next = { x: from.x + delta.x, y: from.y + delta.y }
  return isWalkable(grid, next) ? next : from
}

export function tileKey(position: GridPosition): string {
  return `${position.x},${position.y}`
}

/**
 * Tile keys within `radius` (Manhattan distance) of `position` that exist on
 * the grid — used for fog-of-war reveal bookkeeping. Manhattan distance
 * gives the "+"-shaped vision the spec describes at radius 1 (orthogonal
 * neighbors only, no diagonals) without special-casing that shape. Only
 * floor/POI tiles are revealable — walls and void are never rendered as a
 * square (only enterable tiles are), so there's nothing to reveal about them.
 */
export function tilesWithinRadius(grid: GridLayout, position: GridPosition, radius: number): string[] {
  const keys: string[] = []
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (Math.abs(dx) + Math.abs(dy) > radius) continue
      const candidate = { x: position.x + dx, y: position.y + dy }
      if (isWalkable(grid, candidate)) keys.push(tileKey(candidate))
    }
  }
  return keys
}

/** The POI occupying `position`, if any — generic over any POI shape carrying a `position`, so Hub POIs and District Street POIs share this lookup. */
export function poiAt<TPoi extends { position: GridPosition }>(grid: { pois: TPoi[] }, position: GridPosition): TPoi | null {
  return grid.pois.find((poi) => poi.position.x === position.x && poi.position.y === position.y) ?? null
}
