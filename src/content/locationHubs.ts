// Location Hub content (Architecture §7's Location Hub Layer, GAME_GUIDE.md §6.2).
// Two presentation shapes coexist on HubDefinition, discriminated by `layout`:
// 'cardList' is the original clickable-card presentation; 'grid' is the
// walkable fog-of-war tile grid. Hubs migrate from cardList to grid as they
// earn real authored content — see GAME_GUIDE.md §6.2 for why
// noodleStall/deltaSquat stay cardList for now.

import type { BackgroundId } from './backgrounds'
import type { LocationId } from './locations'
import type { NpcId } from './npcs'

export type HubId = LocationId

export interface HubCharacterPresence {
  npcId: NpcId
  label: string
  description: string
  storyLocationId: LocationId
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
 * share this shape — a single POI tile can list several of these, so this
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
  /**
   * Talk-only, and optional even then (UI_PASS_SPEC.md §4). The ink path
   * to this NPC's topic-loop knot inside `storyLocationId`'s compiled file
   * — once `npcId` is met (Conversation View's conversationStore), Talk
   * jumps here (fresh) or resumes their saved state (repeat visit) instead
   * of replaying the first-encounter scene. Absent `topicsKnot` means this
   * NPC has no Conversation View content yet — Talk always replays the
   * scene, same as before this feature existed.
   */
  topicsKnot?: string
  /**
   * The ink path this interaction's scene should start at, when it's *not*
   * routing to Conversation View — covers an inspect interaction's own
   * content, and (talk-only) a not-yet-met NPC's first-encounter scene
   * before `topicsKnot` takes over on repeat visits. Absent means this
   * interaction just runs `storyLocationId`'s compiled file from the top,
   * same as before this field existed (LocationHubScreen.tsx's
   * `enterHubInteraction`).
   */
  sceneKnot?: string
}

/** A walkable tile the player can stand on to see its interaction list. */
export interface HubPoi {
  id: string
  position: GridPosition
  interactions: HubInteraction[]
}

/**
 * A gate blocking off part of a hub's floor plan until `unlockFlag` is set
 * on casefileStore (`docs/LOCATION_GRID_EXPLORATION_SPEC.md`'s locked-door
 * mechanic) — e.g. the Aveline Lab's inner containment wing, only reachable
 * once the investigation has earned enough leverage. Walkability is resolved
 * at the component layer (HubGridView reads `casefileStore.hasFlag`), not
 * here — this is just the authored data, same separation `HubPoi`'s
 * `available`/`lockedReason` already draws for interactions.
 */
export interface HubDoor {
  id: string
  position: GridPosition
  unlockFlag: string
  label: string
  /** Shown while locked, e.g. as a tile tooltip. */
  lockedReason: string
}

/**
 * `layoutRows` is a quick hand-authoring surface: one string per grid row,
 * one character per column — '#' wall, '.' floor, 'o' POI marker, 'd' door
 * marker, ' ' void (not part of this location at all — not walkable, never
 * rendered, not even as fog; lets a hub's walkable footprint be a
 * non-rectangular shape, e.g. a loop around a blank core, rather than always
 * a filled rectangle). 'o'/'d' markers must line up 1:1 with
 * `pois[].position`/`doors[].position`, which carry the real data; the
 * ASCII grid only encodes walkability + marker presence.
 */
export type HubLayoutRows = string[]

export interface HubGridDefinition {
  width: number
  height: number
  /** Where the player spawns on entering this hub from the Overworld. */
  entryTile: GridPosition
  layoutRows: HubLayoutRows
  pois: HubPoi[]
  /** Locked doors gating parts of this hub's floor plan. Defaults to none. */
  doors?: HubDoor[]
  /** Tiles revealed around the player's position on move. Defaults to 1 (a "+" shape) when omitted. */
  visionRadius?: number
}

export interface GridHubDefinition extends HubDefinitionBase {
  layout: 'grid'
  grid: HubGridDefinition
}

export type HubDefinition = CardListHubDefinition | GridHubDefinition

export const HUB_IDS: HubId[] = [
  'checkpoint',
  'noodleStall',
  'yDuocInstitute',
  'deltaSquat',
  'publicIncidentScene',
  'workerCanteen',
  'mosque',
  'transitPlatform',
  'cidOffice',
  'sezacRecords',
  'corporatePlaza',
  'turtleLakePlaza',
  'pasteurStreetTaproom',
  'tuXuongClinic',
  'undercanopy',
]

export const LOCATION_HUBS: Record<HubId, HubDefinition> = {
  checkpoint: {
    id: 'checkpoint',
    name: 'Aveline District 4 Laboratory',
    blurb: 'The front lab is sealed, watched, and pretending to be calmer than it is — mask seals checked at the door same as the street outside, modification papers checked just as carefully for anyone without an Aveline badge. Aveline staff and the Constabulary are both trying to control the first impression.',
    backgroundId: 'avelineLabExterior',
    layout: 'grid',
    grid: {
      width: 13,
      height: 9,
      entryTile: { x: 4, y: 1 },
      // A loop around a blank core rather than a filled rectangle: the four
      // corners and the 5x2 center of the *outer* ring (rows 0-5) are void,
      // not wall — "outside what the detective's AR scan renders." Rows 6-8
      // are a small containment room behind the locked door in row 5 (see
      // `doors` below) — CASE_1_LOCATION_MATRIX.md's "Inner Containment
      // Wing," gated on leverage/public heat rather than free to wander
      // into. Only a placeholder room (one generic inspect POI) until that
      // scene gets real content — proving the door mechanism works, not
      // authoring the reveal itself.
      //
      // Columns 9-12 are the Aveline Faculty Lounge (CASE_1_LOCATION_MATRIX.md),
      // a small room hanging off the ring's east side — freely walkable, no
      // door/flag gate, unlike the inner wing. Row 2's east wall is opened
      // (was '#', now '.') to connect it; the lounge's own walls (rows 0/4,
      // cols 9-12) cap it off from the rest of the void.
      layoutRows: [
        ' ####### ####',
        '#.o...o.#.o..',
        '#o     o.....',
        '#.     .#..o.',
        '#.......#####',
        ' ###d### '.padEnd(13, ' '),
        '  #...#  '.padEnd(13, ' '),
        '  #.o.#  '.padEnd(13, ' '),
        '  #####  '.padEnd(13, ' '),
      ],
      doors: [
        {
          id: 'checkpoint-inner-door',
          position: { x: 4, y: 5 },
          unlockFlag: 'checkpoint-inner-wing-unlocked',
          label: 'Sealed Inner Door',
          lockedReason: 'The inner wing stays sealed until you gather enough leverage to force the issue.',
        },
      ],
      pois: [
        {
          id: 'checkpoint-mei-hong',
          position: { x: 2, y: 1 },
          interactions: [
            {
              id: 'checkpoint-talk-mei-hong',
              type: 'talk',
              npcId: 'meiHong',
              label: 'Mei Hong',
              description: 'Lab operations lead. Tired, guarded, and already measuring how much truth this room can afford.',
              storyLocationId: 'checkpoint',
              available: true,
              topicsKnot: 'mei_hong_topics',
            },
          ],
        },
        {
          id: 'checkpoint-responding-officer',
          position: { x: 6, y: 1 },
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
          position: { x: 1, y: 2 },
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
          position: { x: 7, y: 2 },
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
          id: 'checkpoint-lakshmi-avani',
          position: { x: 10, y: 1 },
          interactions: [
            {
              id: 'checkpoint-talk-lakshmi-avani',
              type: 'talk',
              npcId: 'lakshmiAvani',
              label: 'Lakshmi Avani',
              description: "A bio-engineer waiting out CID's forensics pass with the rest of the on-duty staff. Easier to talk to than anyone on the main floor.",
              storyLocationId: 'checkpoint',
              available: true,
              sceneKnot: 'lakshmi_avani_intro',
              topicsKnot: 'lakshmi_avani_topics',
            },
          ],
        },
        {
          id: 'checkpoint-lounge-roster-wall',
          position: { x: 11, y: 3 },
          interactions: [
            {
              id: 'checkpoint-inspect-lounge-roster-wall',
              type: 'inspect',
              label: 'Shift roster',
              description: "A curling shift roster taped to the wall — worth a look at who was actually on the clock.",
              storyLocationId: 'checkpoint',
              available: true,
              sceneKnot: 'checkpoint_lounge_roster_wall',
            },
          ],
        },
        {
          id: 'checkpoint-inner-wing-chamber',
          position: { x: 4, y: 7 },
          interactions: [
            {
              id: 'checkpoint-inspect-inner-wing-chamber',
              type: 'inspect',
              label: 'Containment Chamber',
              description: 'The deeper lab, finally open. Whatever happened here left the room worse for it.',
              storyLocationId: 'checkpoint',
              available: true,
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
  yDuocInstitute: {
    id: 'yDuocInstitute',
    name: 'Y Duoc - Cholon Medical Institute',
    blurb:
      'A public-facing teaching hospital with enough legitimate traffic to hide a quieter current underneath: unofficial follow-up care, referral slips without signatures, and patients trying not to say where they came from.',
    backgroundId: 'cholonClinic',
    layout: 'grid',
    grid: {
      width: 5,
      height: 5,
      // A short intake hall with a records desk up one branch and Sarah
      // Mulligan working the other — same non-rectangular-via-void,
      // decorative-wall-cap convention as District 1/4's street maps.
      entryTile: { x: 0, y: 2 },
      layoutRows: ['  #  ', '  o  ', '.....', '  o  ', '  #  '],
      pois: [
        {
          id: 'y-duoc-referral-desk',
          position: { x: 2, y: 1 },
          interactions: [
            {
              id: 'y-duoc-talk-referral-desk',
              type: 'inspect',
              label: 'Intake & Referral Desk',
              description:
                'The counter where paperwork trails go quiet — and where every off-book referral slip in Cholon eventually starts.',
              storyLocationId: 'yDuocInstitute',
              available: true,
              sceneKnot: 'y_duoc_referral_desk',
            },
          ],
        },
        {
          id: 'y-duoc-sarah-mulligan',
          position: { x: 2, y: 3 },
          interactions: [
            {
              id: 'y-duoc-talk-sarah-mulligan',
              type: 'talk',
              npcId: 'sarahMulligan',
              label: 'Sarah Mulligan',
              description: 'An Erasmus exchange student working the intake floor like she already runs the place.',
              storyLocationId: 'yDuocInstitute',
              available: true,
              sceneKnot: 'sarah_mulligan_intro',
              topicsKnot: 'sarah_mulligan_topics',
            },
          ],
        },
      ],
    },
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
  publicIncidentScene: {
    id: 'publicIncidentScene',
    name: 'District 4 Public Incident Scene',
    blurb: 'Tape across the street, uniforms holding a perimeter, and a story about what happened here that nobody has settled on yet.',
    backgroundId: null,
    layout: 'cardList',
    characters: [],
    actions: [
      {
        id: 'public-incident-scene-scene',
        type: 'inspect',
        label: 'Duck under the tape',
        description: 'Get past the perimeter and see what actually happened before the official version sets.',
        storyLocationId: 'publicIncidentScene',
        available: true,
      },
    ],
  },
  workerCanteen: {
    id: 'workerCanteen',
    name: 'Quán Bà Châu',
    blurb: 'Bà Châu\'s counter — steam, tray clatter, and a room that\'s been Xóm Chàm\'s longer than the platform above it has existed.',
    backgroundId: null,
    layout: 'cardList',
    characters: [],
    actions: [
      {
        id: 'worker-canteen-scene',
        type: 'inspect',
        label: 'Sit at the counter',
        description: 'Take a seat at Bà Châu\'s counter and see what the lab looks like from a district that\'s never had much reason to trust it.',
        storyLocationId: 'workerCanteen',
        available: true,
      },
    ],
  },
  mosque: {
    id: 'mosque',
    name: 'Musholla Al-Falah',
    blurb: 'Mats on the floor, a tape-marked qibla on the wall — a room the Kampung built out of a converted platform unit, and made theirs anyway.',
    backgroundId: null,
    layout: 'cardList',
    characters: [],
    actions: [
      {
        id: 'mosque-scene',
        type: 'inspect',
        label: 'Step inside',
        description: 'See what a newer, poorer, more watched community has built for itself two doors down from everyone who\'d rather not think about it.',
        storyLocationId: 'mosque',
        available: true,
      },
    ],
  },
  transitPlatform: {
    id: 'transitPlatform',
    name: 'District Transit Platform',
    blurb: 'A rain-slicked platform where District 4 commuters wait out a line that’s always running behind.',
    backgroundId: null,
    layout: 'cardList',
    characters: [],
    actions: [
      {
        id: 'transit-platform-scene',
        type: 'inspect',
        label: 'Wait for the next car',
        description: 'Work the platform crowd while the line runs late, same as always.',
        storyLocationId: 'transitPlatform',
        available: true,
      },
    ],
  },
  cidOffice: {
    id: 'cidOffice',
    name: 'CID Office',
    blurb: 'Case boards, cold coffee, and a chain of command that would rather this stayed a burglary.',
    backgroundId: null,
    layout: 'cardList',
    characters: [],
    actions: [
      {
        id: 'cid-office-scene',
        type: 'inspect',
        label: 'Check in',
        description: 'File in, catch up on the board, and see what the department already thinks it knows.',
        storyLocationId: 'cidOffice',
        available: true,
      },
    ],
  },
  sezacRecords: {
    id: 'sezacRecords',
    name: 'SEZAC Records / Licensing Office',
    blurb: 'Queue numbers, sun-bleached forms — water permits, ration renewals, modification licensing — and clerks who have perfected the art of telling you nothing politely.',
    backgroundId: null,
    layout: 'cardList',
    characters: [],
    actions: [
      {
        id: 'sezac-records-scene',
        type: 'inspect',
        label: 'File a records request',
        description: 'Wade into the paper trail and see how much of Aveline’s license survives a closer read.',
        storyLocationId: 'sezacRecords',
        available: true,
      },
    ],
  },
  corporatePlaza: {
    id: 'corporatePlaza',
    name: 'District 1 Corporate Plaza',
    blurb: 'A lobby built to remind visitors exactly how far below the top floor they still are.',
    backgroundId: null,
    layout: 'cardList',
    characters: [],
    actions: [
      {
        id: 'corporate-plaza-scene',
        type: 'inspect',
        label: 'Wait for someone to notice you',
        description: 'Stand in the lobby and see whether anyone with real authority is willing to be seen with this case.',
        storyLocationId: 'corporatePlaza',
        available: true,
      },
    ],
  },
  turtleLakePlaza: {
    id: 'turtleLakePlaza',
    name: 'Turtle Lake Plaza',
    blurb: 'Fountain, food stalls, and whoever\'s playing acoustic tonight — the one square in the SEZ nobody\'s ever managed to keep official.',
    backgroundId: 'turtleLakePlaza',
    layout: 'cardList',
    characters: [],
    actions: [
      {
        id: 'turtle-lake-plaza-scene',
        type: 'inspect',
        label: 'Sit by the water',
        description: 'Take a seat at the fountain\'s edge and see what a district with nothing anyone upstairs wants is actually like after dark.',
        storyLocationId: 'turtleLakePlaza',
        available: true,
      },
    ],
  },
  pasteurStreetTaproom: {
    id: 'pasteurStreetTaproom',
    name: 'Pasteur Street Taproom',
    blurb: 'A converted villa ground floor doing hand-brewed beer and live sets — the kind of authenticity a district with no trade wealth has to make an identity out of.',
    backgroundId: 'pasteurStreetTaproom',
    layout: 'grid',
    grid: {
      width: 5,
      height: 5,
      // Same short-hall convention as Y Duoc's grid — a family photo wall
      // up one branch, Diễm behind the bar on the other.
      entryTile: { x: 0, y: 2 },
      layoutRows: ['  #  ', '  o  ', '.....', '  o  ', '  #  '],
      pois: [
        {
          id: 'pasteur-street-family-wall',
          position: { x: 2, y: 1 },
          interactions: [
            {
              id: 'pasteur-street-inspect-family-wall',
              type: 'inspect',
              label: 'Family Photo Wall',
              description: 'Framed portraits going back further than the SEZ itself, thinning out noticeably somewhere around the last two generations.',
              storyLocationId: 'pasteurStreetTaproom',
              available: true,
              sceneKnot: 'pasteur_street_family_wall',
            },
          ],
        },
        {
          id: 'pasteur-street-diem-khuong',
          position: { x: 2, y: 3 },
          interactions: [
            {
              id: 'pasteur-street-talk-diem-khuong',
              type: 'talk',
              npcId: 'diemKhuong',
              label: 'Diễm Khương',
              description: 'Runs the taps out of her own family\'s ground floor, and doesn\'t especially want to talk about who still owns the floors above it.',
              storyLocationId: 'pasteurStreetTaproom',
              available: true,
              sceneKnot: 'diem_khuong_intro',
              topicsKnot: 'diem_khuong_topics',
            },
          ],
        },
      ],
    },
  },
  tuXuongClinic: {
    id: 'tuXuongClinic',
    name: 'Tú Xương Clinic',
    blurb: 'A villa basement doing unlicensed graft work by loupe-light — no waiting list, no license, no questions past the ones the price depends on.',
    backgroundId: 'tuXuongClinic',
    layout: 'grid',
    grid: {
      width: 5,
      height: 5,
      // Same short-hall convention as Pasteur Street's grid — the waiver
      // wall up one branch, Yến at her table on the other.
      entryTile: { x: 0, y: 2 },
      layoutRows: ['  #  ', '  o  ', '.....', '  o  ', '  #  '],
      pois: [
        {
          id: 'tu-xuong-waiver-wall',
          position: { x: 2, y: 1 },
          interactions: [
            {
              id: 'tu-xuong-inspect-waiver-wall',
              type: 'inspect',
              label: 'Waiver Wall',
              description: 'A pinboard of hand-signed waivers, sun-yellowed, none of them anything a licensed clinic would still be printing.',
              storyLocationId: 'tuXuongClinic',
              available: true,
              sceneKnot: 'tu_xuong_waiver_wall',
            },
          ],
        },
        {
          id: 'tu-xuong-yen-loc',
          position: { x: 2, y: 3 },
          interactions: [
            {
              id: 'tu-xuong-talk-yen-loc',
              type: 'talk',
              npcId: 'yenLoc',
              label: 'Yến Lộc',
              description: 'Works a soldering iron by loupe-light over someone\'s open arm, and clearly isn\'t interested in stopping to talk about her license.',
              storyLocationId: 'tuXuongClinic',
              available: true,
              sceneKnot: 'yen_loc_intro',
              topicsKnot: 'yen_loc_topics',
            },
          ],
        },
      ],
    },
  },
  undercanopy: {
    id: 'undercanopy',
    name: 'The Undercanopy',
    blurb: 'A door in the alley wall, no sign — a bar that\'s a front as often as it\'s actually a bar, where the district\'s informal economy runs out of a back booth.',
    backgroundId: 'undercanopy',
    layout: 'grid',
    grid: {
      width: 5,
      height: 5,
      // Same short-hall convention as the other two District 3 venues —
      // the courier cubbies up one branch, Cò's booth on the other.
      entryTile: { x: 0, y: 2 },
      layoutRows: ['  #  ', '  o  ', '.....', '  o  ', '  #  '],
      pois: [
        {
          id: 'undercanopy-courier-cubbies',
          position: { x: 2, y: 1 },
          interactions: [
            {
              id: 'undercanopy-inspect-courier-cubbies',
              type: 'inspect',
              label: 'Courier Cubbies',
              description: 'A wall of unlabeled numbered lockboxes, changing hands all night without a word passing at the bar.',
              storyLocationId: 'undercanopy',
              available: true,
              sceneKnot: 'undercanopy_courier_cubbies',
            },
          ],
        },
        {
          id: 'undercanopy-co-fixer',
          position: { x: 2, y: 3 },
          interactions: [
            {
              id: 'undercanopy-talk-co-fixer',
              type: 'talk',
              npcId: 'coFixer',
              label: 'Cò',
              description: 'Runs the district\'s actual business from a corner booth, and already knows you\'re not paying for information for free.',
              storyLocationId: 'undercanopy',
              available: true,
              sceneKnot: 'co_fixer_intro',
              topicsKnot: 'co_fixer_topics',
            },
          ],
        },
      ],
    },
  },
}
