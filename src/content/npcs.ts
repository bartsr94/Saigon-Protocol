// NPC identity/portrait content. Minimal on purpose — the GDD doesn't name
// NPCs beyond the case-by-case cast. Mei Hong is the Aveline Biogenetics lab
// technician met in the intro scene (content/ink/intro.ink,
// docs/GAME_GUIDE.md), tagged as the speaker via the content-tagging
// convention (docs/GAME_GUIDE.md), not a hardcoded test render.

export type NpcId = 'meiHong' | 'soraBaek' | 'respondingOfficer' | 'baChau' | 'pakRahman' | 'lakshmiAvani' | 'sarahMulligan' | 'diemKhuong'

export interface NpcDefinition {
  id: NpcId
  name: string
  /**
   * Keyed by variant id, free-form per NPC (docs/NPC_PORTRAIT_VARIANTS_SPEC.md
   * — no shared vocabulary across NPCs). `neutral` is required whenever this
   * is present: the default shown until an ink line's `# portrait: <id>` tag
   * says otherwise, and the fallback when a requested variant id isn't one
   * of this NPC's keys. Served from `/portraits/npcs/...png` in public/.
   * Absent entirely = no portrait art configured yet (name-label-only
   * fallback, NpcStagePortrait's existing tolerance).
   */
  portraits?: {
    neutral: string
    [variantId: string]: string
  }
}

export const NPCS: Record<NpcId, NpcDefinition> = {
  meiHong: {
    id: 'meiHong',
    name: 'Mei Hong',
    portraits: { neutral: '/portraits/npcs/mei-hong.png' },
  },
  soraBaek: {
    id: 'soraBaek',
    name: 'Sora Baek',
  },
  respondingOfficer: {
    id: 'respondingOfficer',
    name: 'Responding Officer',
  },
  baChau: {
    id: 'baChau',
    name: 'Bà Châu',
  },
  pakRahman: {
    id: 'pakRahman',
    name: 'Pak Rahman',
  },
  lakshmiAvani: {
    id: 'lakshmiAvani',
    name: 'Lakshmi Avani',
    portraits: {
      neutral: '/portraits/npcs/lakshmi-avani.png',
      guarded: '/portraits/npcs/lakshmi-avani-guarded.png',
      warm: '/portraits/npcs/lakshmi-avani-warm.png',
      bright: '/portraits/npcs/lakshmi-avani-bright.png',
      blush: '/portraits/npcs/lakshmi-avani-blush.png',
      vulnerable: '/portraits/npcs/lakshmi-avani-vulnerable.png',
      // Top affinity tier only (affinity_lakshmi_avani >= 10) — the
      // "You actually came back" greeting, CASE_1_CAST_SPEC.md's warmth arc's
      // ceiling.
      love: '/portraits/npcs/lakshmi-avani-love.png',
    },
  },
  sarahMulligan: {
    id: 'sarahMulligan',
    name: 'Sarah Mulligan',
    portraits: {
      neutral: '/portraits/npcs/sarah-mulligan.png',
    },
  },
  diemKhuong: {
    id: 'diemKhuong',
    name: 'Diễm Khương',
  },
}

export const NPC_IDS: NpcId[] = Object.keys(NPCS) as NpcId[]
