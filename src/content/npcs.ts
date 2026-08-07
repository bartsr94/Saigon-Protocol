// NPC identity/portrait content. Minimal on purpose — the GDD doesn't name
// NPCs beyond the case-by-case cast. Mei Hong is the Aveline Biogenetics lab
// technician met in the intro scene (content/ink/intro.ink,
// docs/GAME_GUIDE.md), tagged as the speaker via the content-tagging
// convention (docs/GAME_GUIDE.md), not a hardcoded test render.

export type NpcId = 'meiHong'

export interface NpcDefinition {
  id: NpcId
  name: string
  /** `/portraits/npcs/<id>.png` — served from public/. */
  portraitSrc: string
}

export const NPCS: Record<NpcId, NpcDefinition> = {
  meiHong: {
    id: 'meiHong',
    name: 'Mei Hong',
    portraitSrc: '/portraits/npcs/mei-hong.png',
  },
}

export const NPC_IDS: NpcId[] = Object.keys(NPCS) as NpcId[]
