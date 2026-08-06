// Overworld locations (Architecture §2 Overworld/Navigation Layer). Placeholder,
// flavor-light dev fixtures standing in for real GDD locations — none are named
// in the GDD yet — mirroring how demo.ink stood in for real narrative content.

export type LocationId = 'checkpoint' | 'noodleStall' | 'deltaSquat'

export const LOCATION_IDS: LocationId[] = ['checkpoint', 'noodleStall', 'deltaSquat']

export interface LocationDefinition {
  id: LocationId
  name: string
  blurb: string
  unlockedByDefault: boolean
}

export const LOCATIONS: Record<LocationId, LocationDefinition> = {
  checkpoint: {
    id: 'checkpoint',
    name: 'SEZ Checkpoint',
    blurb: 'The border crossing into the corporate core. Where every case starts.',
    unlockedByDefault: true,
  },
  noodleStall: {
    id: 'noodleStall',
    name: 'Back-Alley Noodle Stall',
    blurb: 'Off the books, off the grid. Good place to hear what the corpo-govs don’t.',
    unlockedByDefault: false,
  },
  deltaSquat: {
    id: 'deltaSquat',
    name: 'Drowned Delta Squat',
    blurb: 'Reclaimed wetland shanties, half underwater. Salvagers and worse.',
    unlockedByDefault: false,
  },
}
