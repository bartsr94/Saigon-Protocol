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

export interface HubDefinition {
  id: HubId
  name: string
  blurb: string
  backgroundId: BackgroundId | null
  characters: HubCharacterPresence[]
  actions: HubActionDefinition[]
}

export const HUB_IDS: HubId[] = ['checkpoint', 'noodleStall', 'deltaSquat']

export const LOCATION_HUBS: Record<HubId, HubDefinition> = {
  checkpoint: {
    id: 'checkpoint',
    name: 'Aveline District 4 Laboratory',
    blurb: 'The front lab is sealed, watched, and pretending to be calmer than it is. Aveline staff and the Constabulary are both trying to control the first impression.',
    backgroundId: 'avelineLabExterior',
    characters: [
      {
        npcId: 'meiHong',
        label: 'Mei Hong',
        description: 'Lab operations lead. Tired, guarded, and already measuring how much truth this room can afford.',
        storyLocationId: 'checkpoint',
        anchor: { x: 0.33, y: 0.72 },
        available: true,
      },
      {
        npcId: 'respondingOfficer',
        label: 'Responding Officer',
        description: 'One of the uniforms first on the call. Unhappy to be here, and not thrilled with what the lab is asking them to ignore.',
        storyLocationId: 'checkpoint',
        anchor: { x: 0.61, y: 0.76 },
        available: true,
      },
      {
        npcId: 'soraBaek',
        label: 'Sora Baek',
        description: 'Aveline security liaison. Not visible yet, but her decisions are already shaping what this room allows.',
        storyLocationId: 'checkpoint',
        anchor: { x: 0.74, y: 0.54 },
        available: false,
        lockedReason: 'Security keeps her off the floor until the case starts pressing in the wrong direction.',
      },
    ],
    actions: [
      {
        id: 'checkpoint-scene',
        type: 'inspect',
        label: 'Review the scene',
        description: 'Walk the controlled perimeter and let the official burglary story unfold for the first time.',
        storyLocationId: 'checkpoint',
        available: true,
      },
      {
        id: 'checkpoint-access-scanner',
        type: 'inspect',
        label: 'Inspect access scanner',
        description: 'Study the front-end access hardware and see whether the story of forced entry survives first contact with the machinery.',
        storyLocationId: 'checkpoint',
        available: true,
      },
      {
        id: 'checkpoint-inner-door',
        type: 'inspect',
        label: 'Approach the sealed inner door',
        description: 'The deeper lab is there, but Aveline is not ready to let the detective see it.',
        storyLocationId: 'checkpoint',
        available: false,
        lockedReason: 'The inner wing stays sealed until you gather enough leverage to force the issue.',
      },
    ],
  },
  noodleStall: {
    id: 'noodleStall',
    name: 'Back-Alley Noodle Stall',
    blurb: 'Steam, neon, and the kind of gossip that only exists because people assume no one important is listening.',
    backgroundId: 'cholonMarket',
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
