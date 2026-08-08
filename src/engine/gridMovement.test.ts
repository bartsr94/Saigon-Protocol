import { describe, expect, it } from 'vitest'
import { isWalkable, poiAt, step, tileKey, tilesWithinRadius } from './gridMovement'
import type { HubGridDefinition } from '../content/locationHubs'

function makeGrid(overrides: Partial<HubGridDefinition> = {}): HubGridDefinition {
  return {
    width: 5,
    height: 5,
    entryTile: { x: 2, y: 2 },
    layoutRows: ['#####', '#...#', '#.o.#', '#...#', '#####'],
    pois: [
      {
        id: 'test-poi',
        position: { x: 2, y: 2 },
        interactions: [
          {
            id: 'test-interaction',
            type: 'inspect',
            label: 'Test',
            description: 'Test poi',
            storyLocationId: 'checkpoint',
            available: true,
          },
        ],
      },
    ],
    ...overrides,
  }
}

describe('gridMovement', () => {
  describe('isWalkable', () => {
    it('is true for floor and POI tiles', () => {
      const grid = makeGrid()
      expect(isWalkable(grid, { x: 1, y: 1 })).toBe(true)
      expect(isWalkable(grid, { x: 2, y: 2 })).toBe(true)
    })

    it('is false for walls and off-grid positions', () => {
      const grid = makeGrid()
      expect(isWalkable(grid, { x: 0, y: 0 })).toBe(false)
      expect(isWalkable(grid, { x: -1, y: 1 })).toBe(false)
      expect(isWalkable(grid, { x: 1, y: 5 })).toBe(false)
    })
  })

  describe('step', () => {
    it('moves one tile in the given direction when walkable', () => {
      const grid = makeGrid()
      expect(step(grid, { x: 2, y: 2 }, 'up')).toEqual({ x: 2, y: 1 })
      expect(step(grid, { x: 2, y: 2 }, 'left')).toEqual({ x: 1, y: 2 })
    })

    it('stays put when the target tile is a wall', () => {
      const grid = makeGrid()
      expect(step(grid, { x: 1, y: 1 }, 'up')).toEqual({ x: 1, y: 1 })
      expect(step(grid, { x: 1, y: 1 }, 'left')).toEqual({ x: 1, y: 1 })
    })

    it('stays put when the target is off the grid', () => {
      const grid = makeGrid({ layoutRows: ['...', '...', '...'] })
      expect(step(grid, { x: 0, y: 0 }, 'up')).toEqual({ x: 0, y: 0 })
      expect(step(grid, { x: 0, y: 0 }, 'left')).toEqual({ x: 0, y: 0 })
    })
  })

  describe('tilesWithinRadius', () => {
    it('returns a "+"-shaped set at radius 1 (no diagonals)', () => {
      const grid = makeGrid()
      const keys = tilesWithinRadius(grid, { x: 2, y: 2 }, 1)
      expect(new Set(keys)).toEqual(new Set(['2,2', '2,1', '2,3', '1,2', '3,2']))
    })

    it('excludes positions off the grid', () => {
      const grid = makeGrid()
      const keys = tilesWithinRadius(grid, { x: 0, y: 0 }, 1)
      expect(new Set(keys)).toEqual(new Set(['0,0', '1,0', '0,1']))
    })
  })

  describe('poiAt', () => {
    it('finds the POI occupying a tile', () => {
      const grid = makeGrid()
      expect(poiAt(grid, { x: 2, y: 2 })?.id).toBe('test-poi')
    })

    it('returns null for a tile with no POI', () => {
      const grid = makeGrid()
      expect(poiAt(grid, { x: 1, y: 1 })).toBeNull()
    })
  })

  it('tileKey formats as "x,y"', () => {
    expect(tileKey({ x: 3, y: 7 })).toBe('3,7')
  })
})
