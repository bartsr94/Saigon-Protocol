import { useEffect } from 'react'
import { GlitchText } from './GlitchText'
import { useAudioStore } from '../../stores/audioStore'

export interface InsightChipProps {
  name: string
  /** The Insight's own `color` from src/content/insights.ts. */
  color: string
  /** One-shot flicker on first appearance in the log (UI_VISUAL_STYLE_SPEC §5.4). */
  glitchOnMount?: boolean
  className?: string
}

/**
 * The small icon-swatch + name tag that marks an Insight interjection in
 * the dialogue log, and the Insight-gated choice tag (UI_DESIGN §4/§5).
 * `glitchOnMount` also fires a one-shot sting (docs/AUDIO_VOICEOVER_SPEC.md)
 * — each log-entry instance genuinely mounts once, so this doesn't repeat
 * the way it would if it were tied to GlitchText's own repeating loop
 * variant (used elsewhere, e.g. the title screen).
 */
export function InsightChip({ name, color, glitchOnMount = false, className = '' }: InsightChipProps) {
  useEffect(() => {
    if (glitchOnMount) useAudioStore.getState().playSfx('insightInterject')
    // Fire once on this instance's mount only — glitchOnMount is a per-instance constant, not something that should re-trigger the sting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="h-4 w-4 shrink-0"
        style={{
          clipPath:
            'polygon(var(--cut-sm) 0, 100% 0, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0 100%, 0 var(--cut-sm))',
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      <span className="font-display text-xs font-bold uppercase tracking-widest" style={{ color, textShadow: `0 0 6px ${color}` }}>
        {glitchOnMount ? <GlitchText text={name} /> : name}
      </span>
    </span>
  )
}
