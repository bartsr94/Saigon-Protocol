// District Street content (docs/SAIGON_2226_OVERWORLD_SPEC.md's District
// Street Layer section): a walkable fog-of-war grid one level above a
// Location Hub, sitting between the Overworld district map and a Hub like
// `checkpoint`. POIs here don't hold talk/inspect interactions like Hub
// POIs do — each just names a `locationId`, and walking onto it is what
// transitions into that Location Hub (gameplayStore.enterHub). Shares the
// exact ASCII tile vocabulary and pure engine (engine/gridMovement.ts) that
// Location Hub grids use — see content/locationHubs.ts's `HubLayoutRows`
// doc comment for the '.'/'#'/'o'/' ' marker legend.
//
// Only districts that have earned a street map appear in DISTRICT_STREETS
// (same phased-rollout precedent as `checkpoint` being the only
// `layout: 'grid'` Hub today) — District 1/5/2 have no real destinations
// yet, so they stay on the Overworld's plain district-panel presentation
// until they do.

import type { BackgroundId } from './backgrounds'
import type { DistrictId, LocationId } from './locations'
import type { GridPosition, HubLayoutRows } from './locationHubs'

/**
 * A walkable street tile leading into a Location Hub. `available` is
 * deliberately not stored here — it's derived live from
 * `navigationStore.unlockedLocationIds` so the street map can never drift
 * out of sync with the Overworld's own unlock tracking (the one source of
 * truth for "is this location reachable at all"). `lockedReason` is just
 * the flavor text shown while it's locked.
 */
export interface DistrictStreetPoi {
  id: string
  position: GridPosition
  locationId: LocationId
  label: string
  description: string
  lockedReason?: string
}

export interface DistrictStreetDefinition {
  id: DistrictId
  name: string
  blurb: string
  backgroundId: BackgroundId | null
  width: number
  height: number
  /** Where the player spawns entering this street from the Overworld. */
  entryTile: GridPosition
  layoutRows: HubLayoutRows
  pois: DistrictStreetPoi[]
  /** Tiles revealed around the player's position on move. Defaults to 1 (a "+" shape) when omitted. */
  visionRadius?: number
}

export const DISTRICT_STREETS: Partial<Record<DistrictId, DistrictStreetDefinition>> = {
  district4: {
    id: 'district4',
    name: 'District 4 — Flood Wall',
    blurb: 'Service roads and hard rain along the sealed edge of the SEZ. Aveline runs the only lit-up building on the block.',
    backgroundId: 'district4FloodWall',
    width: 5,
    height: 3,
    entryTile: { x: 0, y: 1 },
    layoutRows: ['#####', '....o', '#####'],
    pois: [
      {
        id: 'district4-aveline-lab',
        position: { x: 4, y: 1 },
        locationId: 'checkpoint',
        label: 'Aveline District 4 Laboratory',
        description: 'The lab everyone on this street is pretending not to watch.',
      },
    ],
  },
}
