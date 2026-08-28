// Scene backdrop art (docs/GAME_GUIDE.md §2.1: "Location establishing art can also
// render here when no character is present"). Set via the content-tagging
// convention's `# background: <id>` line tag (docs/GAME_GUIDE.md),
// same shape as content/npcs.ts.

export type BackgroundId = 'avelineLabExterior' | 'cholonMarket' | 'cholonClinic' | 'district4FloodWall' | 'turtleLakePlaza' | 'pasteurStreetTaproom' | 'tuXuongClinic' | 'undercanopy' | 'opheliaApartment'

export const BACKGROUND_IDS: BackgroundId[] = [
  'avelineLabExterior',
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
  cholonMarket: {
    id: 'cholonMarket',
    imageSrc: '/backgrounds/cholon-market.png',
  },
  cholonClinic: {
    id: 'cholonClinic',
  },
  district4FloodWall: {
    id: 'district4FloodWall',
    imageSrc: '/backgrounds/district4-flood-wall.png',
  },
  turtleLakePlaza: {
    id: 'turtleLakePlaza',
  },
  pasteurStreetTaproom: {
    id: 'pasteurStreetTaproom',
  },
  tuXuongClinic: {
    id: 'tuXuongClinic',
  },
  undercanopy: {
    id: 'undercanopy',
  },
  opheliaApartment: {
    id: 'opheliaApartment',
  },
}
