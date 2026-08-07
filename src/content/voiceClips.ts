// Pre-generated ElevenLabs voice clips for curated lines only — intros and
// greetings, not full dialogue (Architecture §7, UI_DESIGN §7). Set via the
// content-tagging convention's `# voice: <id>` line tag. Same shape as
// content/backgrounds.ts.

export type VoiceClipId = 'meiHongIntro'

export const VOICE_CLIP_IDS: VoiceClipId[] = ['meiHongIntro']

export interface VoiceClipDefinition {
  id: VoiceClipId
  /** `/audio/voice/<id>.mp3` — served from public/. */
  src: string
}

export const VOICE_CLIPS: Record<VoiceClipId, VoiceClipDefinition> = {
  meiHongIntro: {
    id: 'meiHongIntro',
    src: '/audio/voice/mei-hong-intro.mp3',
  },
}
