// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { reachableTiles } from '../../engine/gridMovement'
import { useGridKeydownMovement } from './useGridKeydownMovement'

// This project doesn't enable Vitest's `globals` mode, so @testing-library/react's
// automatic afterEach(cleanup) detection never fires — without this, every test's
// window keydown listener stays registered and piles up across the whole file.
afterEach(() => cleanup())

// All-floor 3x3 grid, player starts centered so every direction is a legal move.
const GRID = {
  layoutRows: ['...', '...', '...'],
  entryTile: { x: 1, y: 1 },
}
// Every tile is floor with no doors, so the whole grid is reachable — same
// set `HubGridView`/`DistrictStreetView` would compute and pass in for real.
const REACHABLE = reachableTiles(GRID)

function pressKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}

describe('useGridKeydownMovement', () => {
  it('moves the player one tile per direction keypress when nothing blocks it', () => {
    const moveTo = vi.fn()
    renderHook(() => useGridKeydownMovement(GRID, { x: 1, y: 1 }, moveTo, REACHABLE, false))

    pressKey('w')

    expect(moveTo).toHaveBeenCalledWith({ x: 1, y: 0 })
  })

  it('ignores movement keys entirely while blocked — the live Map Editor / an open overlay case', () => {
    const moveTo = vi.fn()
    renderHook(() => useGridKeydownMovement(GRID, { x: 1, y: 1 }, moveTo, REACHABLE, true))

    pressKey('w')
    pressKey('a')
    pressKey('s')
    pressKey('d')
    pressKey('arrowup')

    expect(moveTo).not.toHaveBeenCalled()
  })

  it('ignores non-movement keys', () => {
    const moveTo = vi.fn()
    renderHook(() => useGridKeydownMovement(GRID, { x: 1, y: 1 }, moveTo, REACHABLE, false))

    pressKey('q')

    expect(moveTo).not.toHaveBeenCalled()
  })

  it('removes its keydown listener on unmount, so an unmounted screen never eats keystrokes for the next one', () => {
    const moveTo = vi.fn()
    const { unmount } = renderHook(() => useGridKeydownMovement(GRID, { x: 1, y: 1 }, moveTo, REACHABLE, false))

    unmount()
    pressKey('w')

    expect(moveTo).not.toHaveBeenCalled()
  })
})
