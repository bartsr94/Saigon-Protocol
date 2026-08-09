// District Street content (Architecture §7's District Street Layer):
// a walkable fog-of-war grid one level above a
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
// `layout: 'grid'` Hub today) — District 5/2 have no real destinations
// yet, so they stay on the Overworld's plain district-panel presentation
// until they do.

import type { BackgroundId } from './backgrounds'
import type { DistrictId, LocationId } from './locations'
import type { GridPosition, HubDoor, HubLayoutRows } from './locationHubs'

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
  /** Locked doors gating parts of this street's floor plan (locationHubs.ts's `HubDoor` — same shape, shared engine). Defaults to none. */
  doors?: HubDoor[]
  /** Tiles revealed around the player's position on move. Defaults to 1 (a "+" shape) when omitted. */
  visionRadius?: number
}

export const DISTRICT_STREETS: Partial<Record<DistrictId, DistrictStreetDefinition>> = {
  district4: {
    id: 'district4',
    name: 'District 4 — Flood Wall',
    blurb:
      'Service roads and hard rain along the sealed edge of the SEZ — a transit stub, a night canteen, and a cordoned-off block, all pretending not to watch Aveline.',
    backgroundId: 'district4FloodWall',
    width: 11,
    height: 7,
    // A cross-shaped street rather than a single corridor: a main east-west
    // road (y=3) the player enters from the west, with two dead-end branches
    // punched through it — north to the transit platform, south to the
    // worker canteen — same non-rectangular-via-void convention
    // `locationHubs.ts`'s checkpoint grid established (only the branches and
    // main road are ever part of this location's floor plan).
    entryTile: { x: 0, y: 3 },
    layoutRows: [
      '   #       ',
      '  #o#      ',
      '  #.#      ',
      '.....o....o',
      '      #.#  ',
      '      #o#  ',
      '       #   ',
    ],
    pois: [
      {
        id: 'district4-transit-platform',
        position: { x: 3, y: 1 },
        locationId: 'transitPlatform',
        label: 'District Transit Platform',
        description: 'An elevated platform under a buzzing awning, half a block off the main road.',
      },
      {
        id: 'district4-incident-scene',
        position: { x: 5, y: 3 },
        locationId: 'publicIncidentScene',
        label: 'District 4 Public Incident Scene',
        description: 'Tape across the street and a perimeter nobody has explained yet.',
        lockedReason: 'CID hasn’t been called out here yet.',
      },
      {
        id: 'district4-worker-canteen',
        position: { x: 7, y: 5 },
        locationId: 'workerCanteen',
        label: 'Worker Canteen',
        description: 'Steam and shift-change chatter a few doors down from the lab.',
      },
      {
        id: 'district4-aveline-lab',
        position: { x: 10, y: 3 },
        locationId: 'checkpoint',
        label: 'Aveline District 4 Laboratory',
        description: 'The lab everyone on this street is pretending not to watch.',
      },
    ],
  },
  district1: {
    id: 'district1',
    name: 'District 1 — Core',
    blurb: 'Administrative towers and filtered air. A CID bullpen, a records counter, and a lobby that only opens for the right people.',
    backgroundId: null,
    width: 11,
    height: 3,
    // A single T-branch off the main road, plainer than District 4's cross —
    // only three destinations here, so one dead-end (up to SEZAC Records) is
    // enough. Same non-rectangular-via-void convention as District 4/the
    // checkpoint grid: only the road and branch tiles are part of this
    // location's floor plan.
    entryTile: { x: 0, y: 2 },
    layoutRows: ['       #   ', '      #o#  ', '....o.....o'],
    pois: [
      {
        id: 'district1-cid-office',
        position: { x: 4, y: 2 },
        locationId: 'cidOffice',
        label: 'CID Office',
        description: 'Case boards, cold coffee, and a chain of command that would rather this stayed a burglary.',
      },
      {
        id: 'district1-sezac-records',
        position: { x: 7, y: 1 },
        locationId: 'sezacRecords',
        label: 'SEZAC Records / Licensing Office',
        description: 'A counter, a queue number, and a clerk who has perfected telling you nothing politely.',
      },
      {
        id: 'district1-corporate-plaza',
        position: { x: 10, y: 2 },
        locationId: 'corporatePlaza',
        label: 'District 1 Corporate Plaza',
        description: 'A lobby built to remind visitors exactly how far below the top floor they still are.',
        lockedReason: 'Nobody with real authority takes meetings with beat detectives. Not yet.',
      },
    ],
  },
}
