// Scene backdrop art (UI_DESIGN §3: "Location establishing art can also
// render here when no character is present"). Set via the content-tagging
// convention's `# background: <id>` line tag (docs/INK_CONTENT_TAGGING_SPEC.md),
// same shape as content/npcs.ts.

export type BackgroundId = 'avelineLabExterior'

export const BACKGROUND_IDS: BackgroundId[] = ['avelineLabExterior']

export interface BackgroundDefinition {
  id: BackgroundId
  /** `/backgrounds/<id>.png` — served from public/. */
  imageSrc: string
}

export const BACKGROUNDS: Record<BackgroundId, BackgroundDefinition> = {
  avelineLabExterior: {
    id: 'avelineLabExterior',
    imageSrc: '/backgrounds/aveline-lab-exterior.png',
  },
}
