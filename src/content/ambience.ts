// Layerable environmental sound (docs/GAME_GUIDE.md). Set via the
// content-tagging convention's `# ambience: +<id>` / `-<id>` / `clear` line
// tags, or as a location's baseline mood (content/locations.ts). Multiple
// ambience ids can be active at once — same shape as content/backgrounds.ts,
// no `'none'` sentinel needed since `clear` is an operation, not a content id.

export type AmbienceId =
  | 'engineIdle'
  | 'rain'
  | 'marketChatter'
  | 'greenhouseHum'
  | 'filterStatic'
  | 'rationQueue'
  | 'hazeWind'

export const AMBIENCE_IDS: AmbienceId[] = [
  'engineIdle',
  'rain',
  'marketChatter',
  'greenhouseHum',
  'filterStatic',
  'rationQueue',
  'hazeWind',
]

export interface AmbienceDefinition {
  id: AmbienceId
  /** `/audio/ambience/<id>.mp3` — served from public/, looped. */
  src: string
}

export const AMBIENCE: Record<AmbienceId, AmbienceDefinition> = {
  engineIdle: {
    id: 'engineIdle',
    src: '/audio/ambience/engine-idle.mp3',
  },
  rain: {
    id: 'rain',
    src: '/audio/ambience/rain.mp3',
  },
  marketChatter: {
    id: 'marketChatter',
    src: '/audio/ambience/market-chatter.mp3',
  },
  // PLACEHOLDER (ATMOSPHERE_TIER1_SPEC.md): asset not sourced yet. Silently
  // no-ops until a real /audio/ambience/greenhouse-hum.mp3 lands, same
  // fallback-tolerant pattern as content/voiceClips.ts's meiHongIntro.
  greenhouseHum: {
    id: 'greenhouseHum',
    src: '/audio/ambience/greenhouse-hum.mp3',
  },
  // PLACEHOLDER (ATMOSPHERE_TIER1_SPEC.md): asset not sourced yet.
  filterStatic: {
    id: 'filterStatic',
    src: '/audio/ambience/filter-static.mp3',
  },
  // PLACEHOLDER (ATMOSPHERE_TIER1_SPEC.md): asset not sourced yet.
  rationQueue: {
    id: 'rationQueue',
    src: '/audio/ambience/ration-queue.mp3',
  },
  // PLACEHOLDER (ATMOSPHERE_TIER1_SPEC.md): asset not sourced yet.
  hazeWind: {
    id: 'hazeWind',
    src: '/audio/ambience/haze-wind.mp3',
  },
}
