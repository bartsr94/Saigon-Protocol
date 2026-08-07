// Layerable environmental sound (docs/AUDIO_VOICEOVER_SPEC.md). Set via the
// content-tagging convention's `# ambience: +<id>` / `-<id>` / `clear` line
// tags, or as a location's baseline mood (content/locations.ts). Multiple
// ambience ids can be active at once — same shape as content/backgrounds.ts,
// no `'none'` sentinel needed since `clear` is an operation, not a content id.

export type AmbienceId = 'engineIdle' | 'rain' | 'marketChatter'

export const AMBIENCE_IDS: AmbienceId[] = ['engineIdle', 'rain', 'marketChatter']

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
}
