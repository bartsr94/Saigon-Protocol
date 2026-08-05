import { useAudioStore } from '../stores/audioStore'
import cursor1 from '../assets/sounds/ui/cursor-1.mp3'
import cursor2 from '../assets/sounds/ui/cursor-2.mp3'
import cursor3 from '../assets/sounds/ui/cursor-3.mp3'
import cursor4 from '../assets/sounds/ui/cursor-4.mp3'
import select1 from '../assets/sounds/ui/select-1.mp3'
import select2 from '../assets/sounds/ui/select-2.mp3'
import cancel1 from '../assets/sounds/ui/cancel-1.mp3'
import cancel2 from '../assets/sounds/ui/cancel-2.mp3'
import error1 from '../assets/sounds/ui/error-1.mp3'
import error2 from '../assets/sounds/ui/error-2.mp3'
import swipe1 from '../assets/sounds/ui/swipe-1.mp3'
import swipe2 from '../assets/sounds/ui/swipe-2.mp3'
import popupOpen from '../assets/sounds/ui/popup-open.mp3'
import popupClose from '../assets/sounds/ui/popup-close.mp3'
import glitchLoop from '../assets/sounds/ui/glitch-loop.mp3'

export type SfxName =
  | 'cursor'
  | 'select'
  | 'cancel'
  | 'error'
  | 'swipe'
  | 'popup-open'
  | 'popup-close'
  | 'glitch'

const VARIANTS: Record<SfxName, string[]> = {
  cursor: [cursor1, cursor2, cursor3, cursor4],
  select: [select1, select2],
  cancel: [cancel1, cancel2],
  error: [error1, error2],
  swipe: [swipe1, swipe2],
  'popup-open': [popupOpen],
  'popup-close': [popupClose],
  glitch: [glitchLoop],
}

const DEFAULT_VOLUME = 0.5
const FADE_OUT_MS = 150

export interface PlaySfxOptions {
  volume?: number
  // glitch-loop.mp3 is an 18s ambient loop, not a short stinger — cap
  // playback so using it as a one-off hit doesn't run for 18 seconds.
  maxDurationMs?: number
}

// A fresh Audio() per call (rather than one shared/reused element) so
// overlapping triggers — e.g. hovering across cards quickly — don't cut
// each other off.
export function playSfx(name: SfxName, options?: PlaySfxOptions): void {
  if (useAudioStore.getState().muted) return

  const variants = VARIANTS[name]
  const src = variants[Math.floor(Math.random() * variants.length)]
  const audio = new Audio(src)
  const volume = options?.volume ?? DEFAULT_VOLUME
  audio.volume = volume
  void audio.play().catch(() => {})

  const maxDurationMs = options?.maxDurationMs
  if (!maxDurationMs) return

  const fadeTimer = setTimeout(() => {
    const fadeStepMs = 20
    const steps = Math.max(1, Math.round(FADE_OUT_MS / fadeStepMs))
    let step = 0
    const fade = setInterval(() => {
      step += 1
      audio.volume = Math.max(0, volume * (1 - step / steps))
      if (step >= steps) {
        clearInterval(fade)
        audio.pause()
      }
    }, fadeStepMs)
  }, Math.max(0, maxDurationMs - FADE_OUT_MS))

  audio.addEventListener('ended', () => clearTimeout(fadeTimer), { once: true })
}
