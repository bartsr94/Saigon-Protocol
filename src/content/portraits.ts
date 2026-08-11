// Player-chosen character portraits. Decoupled from archetype on purpose —
// the player's picture and their archetype are two separate chargen choices
// (docs/GAME_GUIDE.md §2.2 step 1). Placeholder gallery: no art has shipped
// yet, so each entry falls back to its numbered label via PortraitFrame.

export type PortraitId = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7' | 'p8'

export interface PortraitDefinition {
  id: PortraitId
  /** `/portraits/player/<id>.png` — served from public/ once art lands; absent falls back to `label` (PortraitFrame). */
  src: string
  label: string
}

export const PORTRAITS: Record<PortraitId, PortraitDefinition> = {
  p1: { id: 'p1', src: '/portraits/player/p1.png', label: '1' },
  p2: { id: 'p2', src: '/portraits/player/p2.png', label: '2' },
  p3: { id: 'p3', src: '/portraits/player/p3.png', label: '3' },
  p4: { id: 'p4', src: '/portraits/player/p4.png', label: '4' },
  p5: { id: 'p5', src: '/portraits/player/p5.png', label: '5' },
  p6: { id: 'p6', src: '/portraits/player/p6.png', label: '6' },
  p7: { id: 'p7', src: '/portraits/player/p7.png', label: '7' },
  p8: { id: 'p8', src: '/portraits/player/p8.png', label: '8' },
}

export const PORTRAIT_IDS: PortraitId[] = Object.keys(PORTRAITS) as PortraitId[]
