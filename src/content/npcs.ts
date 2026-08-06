// NPC identity/portrait content. Minimal on purpose — no named NPCs exist
// in the GDD yet, and there's no ink content-tagging convention to say who's
// actually speaking in a given scene (Architecture §6, still open). Mei Hong
// exists to exercise the NPC-portrait slot in the Dialogue/Scene view with
// real art (DialogueScreen renders her as a hardcoded test, not tied to any
// real speaker) before that convention lands.

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
