import { describe, expect, it } from 'vitest'
import { doorAt, isWalkable, poiAt, reachableTiles, step, tileKey, tileKindAt, tilesWithinRadius } from './gridMovement'
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
  describe('tileKindAt', () => {
    it('classifies floor, wall, POI, void, and door markers', () => {
      const grid = makeGrid({ layoutRows: ['# od ', '.....', '#####'] })
      expect(tileKindAt(grid, { x: 0, y: 0 })).toBe('wall')
      expect(tileKindAt(grid, { x: 1, y: 0 })).toBe('void')
      expect(tileKindAt(grid, { x: 2, y: 0 })).toBe('poi')
      expect(tileKindAt(grid, { x: 3, y: 0 })).toBe('door')
      expect(tileKindAt(grid, { x: 0, y: 1 })).toBe('floor')
    })

    it('is null off the grid', () => {
      const grid = makeGrid()
      expect(tileKindAt(grid, { x: -1, y: 0 })).toBeNull()
      expect(tileKindAt(grid, { x: 0, y: 99 })).toBeNull()
    })
  })

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

    it('is false for void tiles', () => {
      const grid = makeGrid({ layoutRows: [' ...', '....', '....', '....'] })
      expect(isWalkable(grid, { x: 0, y: 0 })).toBe(false)
    })

    it('is true for a door tile regardless of lock state — locked doors can always be stepped onto', () => {
      const grid = makeGrid({ layoutRows: ['d...', '....', '....', '....'] })
      expect(isWalkable(grid, { x: 0, y: 0 })).toBe(true)
    })
  })

  describe('reachableTiles', () => {
    it('floods every floor/POI tile reachable from entryTile when there are no doors', () => {
      const grid = makeGrid()
      const reachable = reachableTiles(grid)
      expect(reachable).toEqual(new Set(['2,2', '1,1', '2,1', '3,1', '1,2', '3,2', '1,3', '2,3', '3,3']))
    })

    it('includes a locked door tile but not what lies beyond it', () => {
      const grid = makeGrid({ entryTile: { x: 0, y: 0 }, layoutRows: ['.d.'] })
      expect(reachableTiles(grid)).toEqual(new Set(['0,0', '1,0']))
    })

    it('includes what lies beyond once the door is unlocked', () => {
      const grid = makeGrid({ entryTile: { x: 0, y: 0 }, layoutRows: ['.d.'] })
      expect(reachableTiles(grid, () => true)).toEqual(new Set(['0,0', '1,0', '2,0']))
    })
  })

  describe('step', () => {
    it('moves one tile in the given direction when walkable', () => {
      const grid = makeGrid()
      const reachable = reachableTiles(grid)
      expect(step(grid, { x: 2, y: 2 }, 'up', reachable)).toEqual({ x: 2, y: 1 })
      expect(step(grid, { x: 2, y: 2 }, 'left', reachable)).toEqual({ x: 1, y: 2 })
    })

    it('stays put when the target tile is a wall', () => {
      const grid = makeGrid()
      const reachable = reachableTiles(grid)
      expect(step(grid, { x: 1, y: 1 }, 'up', reachable)).toEqual({ x: 1, y: 1 })
      expect(step(grid, { x: 1, y: 1 }, 'left', reachable)).toEqual({ x: 1, y: 1 })
    })

    it('stays put when the target is off the grid', () => {
      const grid = makeGrid({ layoutRows: ['...', '...', '...'] })
      const reachable = reachableTiles(grid)
      expect(step(grid, { x: 0, y: 0 }, 'up', reachable)).toEqual({ x: 0, y: 0 })
      expect(step(grid, { x: 0, y: 0 }, 'left', reachable)).toEqual({ x: 0, y: 0 })
    })

    it('stays put when the target tile is void', () => {
      const grid = makeGrid({ layoutRows: [' ..', '...', '...'] })
      const reachable = reachableTiles(grid)
      expect(step(grid, { x: 1, y: 0 }, 'left', reachable)).toEqual({ x: 1, y: 0 })
    })

    it('always steps onto a locked door tile', () => {
      const grid = makeGrid({ entryTile: { x: 0, y: 0 }, layoutRows: ['.d.'] })
      const reachable = reachableTiles(grid)
      expect(step(grid, { x: 0, y: 0 }, 'right', reachable)).toEqual({ x: 1, y: 0 })
    })

    it('does not let a locked door tile be passed through to what lies beyond it', () => {
      const grid = makeGrid({ entryTile: { x: 0, y: 0 }, layoutRows: ['.d.'] })
      const reachable = reachableTiles(grid)
      expect(step(grid, { x: 1, y: 0 }, 'right', reachable)).toEqual({ x: 1, y: 0 })
    })

    it('passes through once the reachable set includes what lies beyond the door', () => {
      const grid = makeGrid({ entryTile: { x: 0, y: 0 }, layoutRows: ['.d.'] })
      const reachable = reachableTiles(grid, () => true)
      expect(step(grid, { x: 1, y: 0 }, 'right', reachable)).toEqual({ x: 2, y: 0 })
    })

    it('still allows retreating back off a locked door tile the way the player came', () => {
      const grid = makeGrid({ entryTile: { x: 0, y: 0 }, layoutRows: ['.d.'] })
      const reachable = reachableTiles(grid)
      expect(step(grid, { x: 1, y: 0 }, 'left', reachable)).toEqual({ x: 0, y: 0 })
    })
  })

  describe('tilesWithinRadius', () => {
    it('returns a "+"-shaped set at radius 1 (no diagonals)', () => {
      const grid = makeGrid()
      const keys = tilesWithinRadius(grid, { x: 2, y: 2 }, 1)
      expect(new Set(keys)).toEqual(new Set(['2,2', '2,1', '2,3', '1,2', '3,2']))
    })

    it('excludes positions off the grid', () => {
      const grid = makeGrid({ layoutRows: ['...', '...', '...'] })
      const keys = tilesWithinRadius(grid, { x: 0, y: 0 }, 1)
      expect(new Set(keys)).toEqual(new Set(['0,0', '1,0', '0,1']))
    })

    it('excludes void tiles', () => {
      const grid = makeGrid({ layoutRows: ['.....', '. o .', '.....'] })
      const keys = tilesWithinRadius(grid, { x: 2, y: 1 }, 1)
      expect(new Set(keys)).toEqual(new Set(['2,1', '2,0', '2,2']))
    })

    it('excludes wall tiles — only enterable tiles are ever revealed', () => {
      const grid = makeGrid()
      const keys = tilesWithinRadius(grid, { x: 0, y: 0 }, 1)
      expect(new Set(keys)).toEqual(new Set())
    })

    it('includes a locked door tile — a sealed door is still worth revealing, unlike a wall', () => {
      const grid = makeGrid({ layoutRows: ['.....', '..d..', '.....'] })
      const keys = tilesWithinRadius(grid, { x: 2, y: 1 }, 1)
      expect(new Set(keys)).toEqual(new Set(['2,1', '2,0', '2,2', '1,1', '3,1']))
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

  describe('doorAt', () => {
    it('finds the door occupying a tile', () => {
      const grid = { doors: [{ id: 'test-door', position: { x: 3, y: 3 }, unlockFlag: 'test-flag', label: 'Door', lockedReason: 'Sealed.' }] }
      expect(doorAt(grid, { x: 3, y: 3 })?.id).toBe('test-door')
      expect(doorAt(grid, { x: 0, y: 0 })).toBeNull()
    })

    it('returns null when the grid has no doors list', () => {
      expect(doorAt({}, { x: 0, y: 0 })).toBeNull()
    })
  })

  it('tileKey formats as "x,y"', () => {
    expect(tileKey({ x: 3, y: 7 })).toBe('3,7')
  })
})
