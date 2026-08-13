// Overworld locations (Architecture §7 Overworld/Navigation Layer). Placeholder,
// flavor-light dev fixtures standing in for real GDD locations — none are named
// in the GDD yet.

import type { MusicId } from './music'
import type { AmbienceId } from './ambience'

export type DistrictId = 'district1' | 'district2' | 'district4' | 'district5'
export type LocationId =
  | 'checkpoint'
  | 'noodleStall'
  | 'yDuocInstitute'
  | 'deltaSquat'
  | 'publicIncidentScene'
  | 'workerCanteen'
  | 'mosque'
  | 'transitPlatform'
  | 'cidOffice'
  | 'sezacRecords'
  | 'corporatePlaza'

export const LOCATION_IDS: LocationId[] = [
  'checkpoint',
  'noodleStall',
  'yDuocInstitute',
  'deltaSquat',
  'publicIncidentScene',
  'workerCanteen',
  'mosque',
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
    blurb: 'The border crossing into the corporate core — mask seal checked, ration chit scanned, badge last, all under a recruitment screen looping lunar wage figures at the queue. Where every case starts.',
    unlockedByDefault: true,
    unlocksOnComplete: ['noodleStall', 'publicIncidentScene'],
    ambienceIds: ['rain', 'filterStatic', 'rationQueue'],
  },
  publicIncidentScene: {
    id: 'publicIncidentScene',
    districtId: 'district4',
    name: 'District 4 Public Incident Scene',
    blurb: 'A cordoned-off block, tape sagging in the wet-season damp, where the case stopped being a quiet corporate matter.',
    unlockedByDefault: false,
    ambienceIds: ['rain'],
  },
  workerCanteen: {
    id: 'workerCanteen',
    districtId: 'district4',
    name: 'Quán Bà Châu',
    blurb: 'Bà Châu\'s counter, a few doors down from Aveline — Xóm Chàm\'s canteen, halal by default, run by an old stevedore who traded the wharf for a ladle and still feeds half the district\'s hands and hardware.',
    unlockedByDefault: true,
    ambienceIds: ['marketChatter'],
  },
  mosque: {
    id: 'mosque',
    districtId: 'district4',
    name: 'Musholla Al-Falah',
    blurb: 'A converted platform-level room, mats and a tape-marked qibla — the Kampung\'s prayer house, newer and poorer than Xóm Chàm\'s counter, and just as watched, if you know who\'s counting heads.',
    unlockedByDefault: true,
  },
  transitPlatform: {
    id: 'transitPlatform',
    districtId: 'district4',
    name: 'District Transit Platform',
    blurb: 'A rain-slicked platform where District 4 waits out the haze for a line that never quite runs on time, under a wall ad cycling the same green Martian horizon on loop.',
    unlockedByDefault: true,
    ambienceIds: ['engineIdle', 'filterStatic', 'hazeWind'],
  },
  cidOffice: {
    id: 'cidOffice',
    districtId: 'district1',
    name: 'CID Office',
    blurb: 'Home base. Filtered air, cold coffee, and a chain of command that would rather this stayed a burglary — the one room in the district where nobody bothers checking their mask seal.',
    unlockedByDefault: true,
  },
  sezacRecords: {
    id: 'sezacRecords',
    districtId: 'district1',
    name: 'SEZAC Records / Licensing Office',
    blurb: 'Where paperwork does the covering-up official statements can’t — ration schedules, water permits, modification consent forms, licensing renewals, filed and forgotten.',
    unlockedByDefault: true,
    ambienceIds: ['rationQueue'],
  },
  corporatePlaza: {
    id: 'corporatePlaza',
    districtId: 'district1',
    name: 'District 1 Corporate Plaza',
    blurb: 'Polished stone, filtered air, and a fruit bowl in the lobby that isn’t synthesized — like everyone waiting on it, bred rather than merely afforded. A recruitment screen near the elevators pitches Mars acreage like a vacation brochure, aimed at people who’ll never need the wage. The public face of the people who actually run District 1.',
    unlockedByDefault: false,
  },
  noodleStall: {
    id: 'noodleStall',
    districtId: 'district5',
    name: 'Back-Alley Noodle Stall',
    blurb: 'Off the books, off the grid — real garlic, real fish sauce, nothing here came through a licensed import lane. Good place to hear what the corpo-govs don’t.',
    unlockedByDefault: false,
    unlocksOnComplete: ['yDuocInstitute', 'deltaSquat'],
    ambienceIds: ['marketChatter'],
  },
  yDuocInstitute: {
    id: 'yDuocInstitute',
    districtId: 'district5',
    name: 'Y Duoc - Cholon Medical Institute',
    blurb:
      'A teaching hospital whose public face still looks legitimate enough to trust. Behind intake, the referrals get quieter: tolerance graft follow-up, adaptation drugs, and the kind of aftercare nobody wants tied back to a payroll system.',
    unlockedByDefault: false,
    ambienceIds: ['marketChatter', 'filterStatic'],
  },
  deltaSquat: {
    id: 'deltaSquat',
    districtId: 'district2',
    name: 'Drowned Delta Squat',
    blurb: 'Reclaimed wetland shanties, half underwater, close enough to hear the greenhouse platforms humming out past the flood line. Salvagers and worse.',
    unlockedByDefault: false,
    ambienceIds: ['rain', 'greenhouseHum', 'hazeWind'],
  },
}
