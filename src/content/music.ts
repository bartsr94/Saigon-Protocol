// Scene music cues (docs/GAME_GUIDE.md). Set via the content-tagging
// convention's `# music: <id>` line tag, or as a location's baseline mood
// (content/locations.ts). Same shape as content/backgrounds.ts, with one
// addition: `'none'` is a reserved sentinel id (no `src`) that explicitly
// silences music through the same lookup path as any real track, rather
// than needing a special-cased nullable type.

export type MusicId = 'none' | 'titleTheme' | 'introTheme'

export const MUSIC_IDS: MusicId[] = ['none', 'titleTheme', 'introTheme']

export interface MusicDefinition {
  id: MusicId
  /** `/audio/music/<id>.mp3` — served from public/. `null` for the `'none'` sentinel. */
  src: string | null
}

export const MUSIC: Record<MusicId, MusicDefinition> = {
  none: {
    id: 'none',
    src: null,
  },
  /** Title/Boot and Character Creation — "Saigon Protocol - Homepage" (audioStore.playTitleMusic()). */
  titleTheme: {
    id: 'titleTheme',
    src: '/audio/music/title-theme.mp3',
  },
  /** The intro scene's squad-car drive through arrival at Aveline Labs — one continuous track across both beats. */
  introTheme: {
    id: 'introTheme',
    src: '/audio/music/intro-theme.mp3',
  },
}
