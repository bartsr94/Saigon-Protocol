// Scene backdrop art (docs/GAME_GUIDE.md §2.1: "Location establishing art can also
// render here when no character is present"). Set via the content-tagging
// convention's `# background: <id>` line tag (docs/GAME_GUIDE.md),
// same shape as content/npcs.ts.

export type BackgroundId = 'avelineLabExterior' | 'cholonMarket' | 'cholonClinic' | 'district4FloodWall'

export const BACKGROUND_IDS: BackgroundId[] = ['avelineLabExterior', 'cholonMarket', 'cholonClinic', 'district4FloodWall']

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
  },
  cholonClinic: {
    id: 'cholonClinic',
  },
  district4FloodWall: {
    id: 'district4FloodWall',
  },
}
