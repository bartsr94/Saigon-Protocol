// Shared WASD/arrow-key tile-stepping for HubGridView/DistrictStreetView —
// extracted so both screens' "what blocks movement" list lives behind one
// signature instead of two copy-pasted effects that could silently drift
// (see docs/SAIGON_PROTOCOL_ARCHITECTURE.md's live-map-editor entry: the
// duplicated effect once forgot to check the live Map Editor's open state,
// so typing in an editor text field moved the player instead).

import { useEffect } from 'react'
import type { GridPosition } from '../../content/locationHubs'
import { step, type GridDirection } from '../../engine/gridMovement'

/** The minimal shape `step()` needs — same structural typing gridMovement.ts uses throughout. */
interface SteppableGrid {
  layoutRows: string[]
  entryTile: GridPosition
}

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

/**
 * Discrete tile-stepping: one keypress/repeat moves exactly one tile, per
 * the spec's movement rules — not continuous free movement. Re-registers
 * whenever `playerPosition` changes so `step()` always collides against the
 * current tile, not a stale closure. Does nothing while `blocked` is true —
 * pass every state that should suspend movement (an open overlay, the live
 * Map Editor, anything else added later) so a text field elsewhere on
 * screen never loses its keystrokes to the player walking around behind it.
 */
export function useGridKeydownMovement(
  grid: SteppableGrid,
  playerPosition: GridPosition,
  moveTo: (position: GridPosition) => void,
  isDoorUnlocked: (position: GridPosition) => boolean,
  blocked: boolean,
) {
  useEffect(() => {
    if (blocked) return
    function handleKeyDown(event: KeyboardEvent) {
      const direction = KEY_DIRECTIONS[event.key.toLowerCase()]
      if (!direction) return
      event.preventDefault()
      const next = step(grid, playerPosition, direction, isDoorUnlocked)
      if (next.x !== playerPosition.x || next.y !== playerPosition.y) moveTo(next)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [blocked, grid, playerPosition, moveTo, isDoorUnlocked])
}
