// Location Hub content (Architecture §7, docs/LOCATION_HUB_ENCOUNTER_FLOW_SPEC.md).
// Two presentation shapes coexist on HubDefinition, discriminated by `layout`:
// 'cardList' is the original clickable-card presentation; 'grid' is the
// walkable fog-of-war tile grid (docs/LOCATION_GRID_EXPLORATION_SPEC.md).
// Hubs migrate from cardList to grid as they earn real authored content —
// see that spec's "Rollout scope" decision for why noodleStall/deltaSquat
// stay cardList for now.

import type { BackgroundId } from './backgrounds'
import type { LocationId } from './locations'
import type { NpcId } from './npcs'

export type HubId = LocationId
interface AnchorPoint {
  x: number
  y: number
}

export interface HubCharacterPresence {
  npcId: NpcId
  label: string
  description: string
  storyLocationId: LocationId
  anchor: AnchorPoint
  available: boolean
  lockedReason?: string
}

export interface HubActionDefinition {
  id: string
  type: 'talk' | 'inspect'
  label: string
  description: string
  storyLocationId: LocationId
  available: boolean
  lockedReason?: string
}

interface HubDefinitionBase {
  id: HubId
  name: string
  blurb: string
  backgroundId: BackgroundId | null
}

export interface CardListHubDefinition extends HubDefinitionBase {
  layout: 'cardList'
  characters: HubCharacterPresence[]
  actions: HubActionDefinition[]
}

/** A tile coordinate inside a hub's grid — integer, 0-indexed from the top-left. */
export interface GridPosition {
  x: number
  y: number
}

/**
 * One thing to do at a POI tile. Talk (a person) and inspect (a place/object)
 * share this shape — a single POI tile can list several of these (Location
 * Grid Exploration Spec's "multiple interactions per tile" decision), so this
 * is not assumed to be one-per-tile.
 */
export interface HubInteraction {
  id: string
  type: 'talk' | 'inspect'
  /** Present when type === 'talk'. */
  npcId?: NpcId
  label: string
  description: string
  storyLocationId: LocationId
  available: boolean
  lockedReason?: string
}

/** A walkable tile the player can stand on to see its interaction list. */
export interface HubPoi {
  id: string
  position: GridPosition
  interactions: HubInteraction[]
}

/**
 * `layoutRows` is a quick hand-authoring surface: one string per grid row,
 * one character per column — '#' wall, '.' floor, 'o' POI marker. 'o'
 * markers must line up 1:1 with `pois[].position`, which carries the real
 * interaction data; the ASCII grid only encodes walkability + POI presence.
 */
export type HubLayoutRows = string[]

export interface HubGridDefinition {
  width: number
  height: number
  /** Where the player spawns on entering this hub from the Overworld. */
  entryTile: GridPosition
  layoutRows: HubLayoutRows
  pois: HubPoi[]
  /** Tiles revealed around the player's position on move. Defaults to 1 (a "+" shape) when omitted. */
  visionRadius?: number
}

export interface GridHubDefinition extends HubDefinitionBase {
  layout: 'grid'
  grid: HubGridDefinition
}

export type HubDefinition = CardListHubDefinition | GridHubDefinition

export const HUB_IDS: HubId[] = ['checkpoint', 'noodleStall', 'deltaSquat']

export const LOCATION_HUBS: Record<HubId, HubDefinition> = {
  checkpoint: {
    id: 'checkpoint',
    name: 'Aveline District 4 Laboratory',
    blurb: 'The front lab is sealed, watched, and pretending to be calmer than it is. Aveline staff and the Constabulary are both trying to control the first impression.',
    backgroundId: 'avelineLabExterior',
    layout: 'grid',
    grid: {
      width: 9,
      height: 6,
      entryTile: { x: 4, y: 1 },
      layoutRows: ['#########', '#.......#', '#.o...o.#', '#...o...#', '#.o...o.#', '#########'],
      pois: [
        {
          id: 'checkpoint-mei-hong',
          position: { x: 2, y: 2 },
          interactions: [
            {
              id: 'checkpoint-talk-mei-hong',
              type: 'talk',
              npcId: 'meiHong',
              label: 'Mei Hong',
              description: 'Lab operations lead. Tired, guarded, and already measuring how much truth this room can afford.',
              storyLocationId: 'checkpoint',
              available: true,
            },
          ],
        },
        {
          id: 'checkpoint-responding-officer',
          position: { x: 6, y: 2 },
          interactions: [
            {
              id: 'checkpoint-talk-responding-officer',
              type: 'talk',
              npcId: 'respondingOfficer',
              label: 'Responding Officer',
              description: 'One of the uniforms first on the call. Unhappy to be here, and not thrilled with what the lab is asking them to ignore.',
              storyLocationId: 'checkpoint',
              available: true,
            },
          ],
        },
        {
          id: 'checkpoint-access-scanner',
          position: { x: 4, y: 3 },
          interactions: [
            {
              id: 'checkpoint-inspect-access-scanner',
              type: 'inspect',
              label: 'Inspect access scanner',
              description: 'Study the front-end access hardware and see whether the story of forced entry survives first contact with the machinery.',
              storyLocationId: 'checkpoint',
              available: true,
            },
          ],
        },
        {
          id: 'checkpoint-sora-baek',
          position: { x: 2, y: 4 },
          interactions: [
            {
              id: 'checkpoint-talk-sora-baek',
              type: 'talk',
              npcId: 'soraBaek',
              label: 'Sora Baek',
              description: 'Aveline security liaison. Not visible yet, but her decisions are already shaping what this room allows.',
              storyLocationId: 'checkpoint',
              available: false,
              lockedReason: 'Security keeps her off the floor until the case starts pressing in the wrong direction.',
            },
          ],
        },
        {
          id: 'checkpoint-inner-door',
          position: { x: 6, y: 4 },
          interactions: [
            {
              id: 'checkpoint-inspect-inner-door',
              type: 'inspect',
              label: 'Approach the sealed inner door',
              description: 'The deeper lab is there, but Aveline is not ready to let the detective see it.',
              storyLocationId: 'checkpoint',
              available: false,
              lockedReason: 'The inner wing stays sealed until you gather enough leverage to force the issue.',
            },
          ],
        },
      ],
    },
  },
  noodleStall: {
    id: 'noodleStall',
    name: 'Back-Alley Noodle Stall',
    blurb: 'Steam, neon, and the kind of gossip that only exists because people assume no one important is listening.',
    backgroundId: 'cholonMarket',
    layout: 'cardList',
    characters: [],
    actions: [
      {
        id: 'noodle-stall-scene',
        type: 'inspect',
        label: 'Work the room',
        description: 'Ease into the stall and see what the city is willing to say when corporate ears are absent.',
        storyLocationId: 'noodleStall',
        available: true,
      },
    ],
  },
  deltaSquat: {
    id: 'deltaSquat',
    name: 'Drowned Delta Squat',
    blurb: 'A half-reclaimed edge where the city thins out and the floodwater starts dictating what still counts as shelter.',
    backgroundId: null,
    layout: 'cardList',
    characters: [],
    actions: [
      {
        id: 'delta-squat-scene',
        type: 'inspect',
        label: 'Push deeper',
        description: 'Trace the unstable edge and see what the drowned district is willing to give up.',
        storyLocationId: 'deltaSquat',
        available: true,
      },
    ],
  },
}
