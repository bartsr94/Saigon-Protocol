// Relationship System (SAIGON_PROTOCOL_ARCHITECTURE.md §14): per-NPC affinity
// score, -10 (sworn rival) to +10 (love of your life), defaulting to 0
// (stranger/neutral). Pure module, mirrors thoughtEngine.ts's role.

import { NPC_IDS, type NpcId } from '../content/npcs'

export type SerializedRelationshipState = Record<NpcId, number>

export function clampAffinity(value: number): number {
  return Math.max(-10, Math.min(10, value))
}

export function createInitialRelationshipState(): SerializedRelationshipState {
  return Object.fromEntries(NPC_IDS.map((id) => [id, 0])) as SerializedRelationshipState
}
