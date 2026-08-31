// Scene backdrop art (docs/GAME_GUIDE.md §2.1: "Location establishing art can also
// render here when no character is present"). Set via the content-tagging
// convention's `# background: <id>` line tag (docs/GAME_GUIDE.md),
// same shape as content/npcs.ts.

export type BackgroundId =
  | 'avelineLabExterior'
  | 'avelineLabInterior'
  | 'avelineEmployeeLounge'
  | 'avelineLabHallway'
  | 'avelineLabInnerDoor'
  | 'cholonMarket'
  | 'cholonClinic'
  | 'district4FloodWall'
  | 'turtleLakePlaza'
  | 'pasteurStreetTaproom'
  | 'tuXuongClinic'
  | 'undercanopy'
  | 'opheliaApartment'

export const BACKGROUND_IDS: BackgroundId[] = [
  'avelineLabExterior',
  'avelineLabInterior',
  'avelineEmployeeLounge',
  'avelineLabHallway',
  'avelineLabInnerDoor',
  'cholonMarket',
  'cholonClinic',
  'district4FloodWall',
  'turtleLakePlaza',
  'pasteurStreetTaproom',
  'tuXuongClinic',
  'undercanopy',
  'opheliaApartment',
]

export interface BackgroundDefinition {
  id: BackgroundId
  /** `/backgrounds/<id>.png` — served from public/ when art exists. */
  imageSrc?: string
}

export const BACKGROUNDS: Record<BackgroundId, BackgroundDefinition> = {
  avelineLabExterior: {
    id: 'avelineLabExterior',
    imageSrc: '/backgrounds/aveline-lab-exterior.png',
  },
  avelineLabInterior: {
    id: 'avelineLabInterior',
    imageSrc: '/backgrounds/aveline-lab-interior.png',
  },
  avelineEmployeeLounge: {
    id: 'avelineEmployeeLounge',
    imageSrc: '/backgrounds/aveline-employee-lounge.png',
  },
  avelineLabHallway: {
    id: 'avelineLabHallway',
    imageSrc: '/backgrounds/aveline-lab-hallway.png',
  },
  avelineLabInnerDoor: {
    id: 'avelineLabInnerDoor',
    imageSrc: '/backgrounds/aveline-lab-inner-door.png',
  },
  cholonMarket: {
    id: 'cholonMarket',
    imageSrc: '/backgrounds/cholon-market.png',
  },
  cholonClinic: {
    id: 'cholonClinic',
    imageSrc: '/backgrounds/cholon-clinic.png',
  },
  district4FloodWall: {
    id: 'district4FloodWall',
    imageSrc: '/backgrounds/district4-flood-wall.png',
  },
  turtleLakePlaza: {
    id: 'turtleLakePlaza',
    imageSrc: '/backgrounds/turtle-lake-plaza.png',
  },
  pasteurStreetTaproom: {
    id: 'pasteurStreetTaproom',
    imageSrc: '/backgrounds/pasteur-street-taproom.png',
  },
  tuXuongClinic: {
    id: 'tuXuongClinic',
    imageSrc: '/backgrounds/tu-xuong-clinic.png',
  },
  undercanopy: {
    id: 'undercanopy',
    imageSrc: '/backgrounds/undercanopy.png',
  },
  opheliaApartment: {
    id: 'opheliaApartment',
    imageSrc: '/backgrounds/ophelia-apartment.png',
  },
}
