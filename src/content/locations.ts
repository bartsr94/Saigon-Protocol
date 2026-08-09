// Overworld locations (Architecture §7 Overworld/Navigation Layer). Placeholder,
// flavor-light dev fixtures standing in for real GDD locations — none are named
// in the GDD yet.

import type { MusicId } from './music'
import type { AmbienceId } from './ambience'

export type DistrictId = 'district1' | 'district2' | 'district4' | 'district5'
export type LocationId =
  | 'checkpoint'
  | 'noodleStall'
  | 'deltaSquat'
  | 'publicIncidentScene'
  | 'workerCanteen'
  | 'transitPlatform'
  | 'cidOffice'
  | 'sezacRecords'
  | 'corporatePlaza'

export const LOCATION_IDS: LocationId[] = [
  'checkpoint',
  'noodleStall',
  'deltaSquat',
  'publicIncidentScene',
  'workerCanteen',
  'transitPlatform',
  'cidOffice',
  'sezacRecords',
  'corporatePlaza',
]

export interface LocationDefinition {
  id: LocationId
  districtId: DistrictId
  name: string
  blurb: string
  unlockedByDefault: boolean
  /** Locations unlocked once this location's scene is completed and the player leaves it. */
  unlocksOnComplete?: LocationId[]
  /** Baseline mood applied on entering the location (docs/GAME_GUIDE.md), independent of whatever its .ink content tags afterward. Absent means "leave whatever's playing alone." */
  musicId?: MusicId
  ambienceIds?: AmbienceId[]
}

export const LOCATIONS: Record<LocationId, LocationDefinition> = {
  checkpoint: {
    id: 'checkpoint',
    districtId: 'district4',
    name: 'SEZ Checkpoint',
    blurb: 'The border crossing into the corporate core. Where every case starts.',
    unlockedByDefault: true,
    unlocksOnComplete: ['noodleStall', 'publicIncidentScene'],
    ambienceIds: ['rain'],
  },
  publicIncidentScene: {
    id: 'publicIncidentScene',
    districtId: 'district4',
    name: 'District 4 Public Incident Scene',
    blurb: 'A cordoned-off block where the case stopped being a quiet corporate matter.',
    unlockedByDefault: false,
    ambienceIds: ['rain'],
  },
  workerCanteen: {
    id: 'workerCanteen',
    districtId: 'district4',
    name: 'Worker Canteen',
    blurb: 'A late-shift canteen a few doors down from Aveline, thick with steam and shop talk.',
    unlockedByDefault: true,
    ambienceIds: ['marketChatter'],
  },
  transitPlatform: {
    id: 'transitPlatform',
    districtId: 'district4',
    name: 'District Transit Platform',
    blurb: 'A rain-slicked platform where District 4 waits for a line that never quite runs on time.',
    unlockedByDefault: true,
    ambienceIds: ['engineIdle'],
  },
  cidOffice: {
    id: 'cidOffice',
    districtId: 'district1',
    name: 'CID Office',
    blurb: 'Home base. Fluorescent lights, case boards, and a chain of command that would rather this stayed a burglary.',
    unlockedByDefault: true,
  },
  sezacRecords: {
    id: 'sezacRecords',
    districtId: 'district1',
    name: 'SEZAC Records / Licensing Office',
    blurb: 'Where paperwork does the covering-up official statements can’t.',
    unlockedByDefault: true,
  },
  corporatePlaza: {
    id: 'corporatePlaza',
    districtId: 'district1',
    name: 'District 1 Corporate Plaza',
    blurb: 'Polished stone and private security. The public face of the people who actually run District 1.',
    unlockedByDefault: false,
  },
  noodleStall: {
    id: 'noodleStall',
    districtId: 'district5',
    name: 'Back-Alley Noodle Stall',
    blurb: 'Off the books, off the grid. Good place to hear what the corpo-govs don’t.',
    unlockedByDefault: false,
    unlocksOnComplete: ['deltaSquat'],
    ambienceIds: ['marketChatter'],
  },
  deltaSquat: {
    id: 'deltaSquat',
    districtId: 'district2',
    name: 'Drowned Delta Squat',
    blurb: 'Reclaimed wetland shanties, half underwater. Salvagers and worse.',
    unlockedByDefault: false,
    ambienceIds: ['rain'],
  },
}
