// Overworld locations (Architecture §7 Overworld/Navigation Layer). Placeholder,
// flavor-light dev fixtures standing in for real GDD locations — none are named
// in the GDD yet.

import type { MusicId } from './music'
import type { AmbienceId } from './ambience'

export type DistrictId = 'district1' | 'district2' | 'district4' | 'district5'
export type LocationId = 'checkpoint' | 'noodleStall' | 'deltaSquat'

export const LOCATION_IDS: LocationId[] = ['checkpoint', 'noodleStall', 'deltaSquat']

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
    unlocksOnComplete: ['noodleStall'],
    ambienceIds: ['rain'],
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
