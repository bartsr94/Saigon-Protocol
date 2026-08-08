// Pure movement/collision math for hub grid exploration
// (docs/LOCATION_GRID_EXPLORATION_SPEC.md). No store or DOM access here —
// same pure/testable split as checkResolution.ts. HubGridView calls step()
// to compute a candidate move, then hands the result to
// gameplayStore.moveTo() to actually mutate state.

import type { GridPosition, HubGridDefinition, HubPoi } from '../content/locationHubs'

export type GridDirection = 'up' | 'down' | 'left' | 'right'

const DIRECTION_DELTAS: Record<GridDirection, GridPosition> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

function tileAt(grid: HubGridDefinition, position: GridPosition): string | null {
  const row = grid.layoutRows[position.y]
  if (row === undefined || position.x < 0 || position.x >= row.length) return null
  return row[position.x]
}

/** A tile is walkable if it exists and isn't a wall ('#'). Floor ('.') and POI ('o') markers both walk. */
export function isWalkable(grid: HubGridDefinition, position: GridPosition): boolean {
  const tile = tileAt(grid, position)
  return tile !== null && tile !== '#'
}

/** The tile reached by moving one step from `from` in `direction`, or `from` unchanged if the target is a wall or off the grid. */
export function step(grid: HubGridDefinition, from: GridPosition, direction: GridDirection): GridPosition {
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
 * neighbors only, no diagonals) without special-casing that shape.
 */
export function tilesWithinRadius(grid: HubGridDefinition, position: GridPosition, radius: number): string[] {
  const keys: string[] = []
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (Math.abs(dx) + Math.abs(dy) > radius) continue
      const candidate = { x: position.x + dx, y: position.y + dy }
      if (tileAt(grid, candidate) !== null) keys.push(tileKey(candidate))
    }
  }
  return keys
}

/** The POI occupying `position`, if any. */
export function poiAt(grid: HubGridDefinition, position: GridPosition): HubPoi | null {
  return grid.pois.find((poi) => poi.position.x === position.x && poi.position.y === position.y) ?? null
}
