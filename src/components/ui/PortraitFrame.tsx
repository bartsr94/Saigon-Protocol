import { useState } from 'react'
import { Icon } from './Icon'

export type PortraitSize = 'sm' | 'md' | 'lg'

const OUTER_PX: Record<PortraitSize, number> = { sm: 64, md: 144, lg: 160 }
const OUTER_CUT: Record<PortraitSize, string> = { sm: '10px', md: '21px', lg: '20px' }
const INNER_CUT: Record<PortraitSize, string> = { sm: '6px', md: '14px', lg: '14px' }
const FALLBACK_TEXT_CLASS: Record<PortraitSize, string> = { sm: 'text-[0.6rem]', md: 'text-sm', lg: 'text-base' }
const SILHOUETTE_ICON_PX: Record<PortraitSize, number> = { sm: 36, md: 78, lg: 86 }

export interface PortraitFrameProps {
  /** `undefined`/missing/failed-to-load all fall through to the initials fallback below — art hasn't landed yet. */
  src?: string
  alt: string
  fallbackText: string
  accent?: string
  size?: PortraitSize
  className?: string
  /**
   * Explicit pixel footprint overriding `size`'s square default — for a
   * non-square frame that preserves portrait art's native ~2:3 aspect
   * instead of `object-cover`-cropping it to a square. `size` still drives
   * the corner-cut scale and fallback glyph/text sizing either way.
   */
  width?: number
  height?: number
  /**
   * True forces the generic "unidentified person" glyph (the same
   * `character` icon the map uses for an un-stepped-on talk POI) regardless
   * of `src` — for a not-yet-met NPC, so their real portrait never leaks
   * through early (docs/GAME_GUIDE.md §6.2's "Talk portraits").
   */
  silhouette?: boolean
  /**
   * Drops the accent border/glow, the dark backdrop-blur backing, and the
   * inner gradient wash — just the corner-cut image, for placements (e.g.
   * `HubGridView`'s floating talk portrait) that sit directly over the
   * scene rather than inside their own HUD chrome.
   */
  frameless?: boolean
}

/**
 * Angular corner-cut avatar frame (docs/GAME_GUIDE.md §2.1, adopted from
 * the inspo's portrait-frame/portrait-inner). Used for the player's HUD
 * chip, chargen previews, and the Character overlay.
 */
export function PortraitFrame({
  src,
  alt,
  fallbackText,
  accent = 'var(--color-chrome-primary)',
  size = 'md',
  width,
  height,
  className = '',
  silhouette = false,
  frameless = false,
}: PortraitFrameProps) {
  const [failed, setFailed] = useState(false)
  const px = OUTER_PX[size]
  const showImage = !silhouette && Boolean(src) && !failed

  return (
    <div
      className={`relative shrink-0 ${frameless ? '' : 'bg-black/60 backdrop-blur-sm'} ${className}`}
      style={{
        width: width ?? px,
        height: height ?? px,
        border: frameless ? undefined : `2px solid color-mix(in srgb, ${accent} 60%, transparent)`,
        clipPath: `polygon(${OUTER_CUT[size]} 0, 100% 0, 100% calc(100% - ${OUTER_CUT[size]}), calc(100% - ${OUTER_CUT[size]}) 100%, 0 100%, 0 ${OUTER_CUT[size]})`,
        boxShadow: frameless ? undefined : `0 0 15px color-mix(in srgb, ${accent} 25%, transparent), inset 0 0 20px color-mix(in srgb, ${accent} 15%, transparent)`,
      }}
    >
      <div
        className="absolute inset-1 flex items-center justify-center overflow-hidden"
        style={{
          clipPath: `polygon(${INNER_CUT[size]} 0, 100% 0, 100% calc(100% - ${INNER_CUT[size]}), calc(100% - ${INNER_CUT[size]}) 100%, 0 100%, 0 ${INNER_CUT[size]})`,
          background: frameless ? undefined : `linear-gradient(135deg, color-mix(in srgb, ${accent} 12%, transparent), transparent)`,
        }}
      >
        {silhouette ? (
          // Fixed black, not `accent` — an unmet NPC should read as a plain
          // unknown-person silhouette, not a chrome-tinted icon.
          <Icon id="character" size={SILHOUETTE_ICON_PX[size]} color="#000000" />
        ) : showImage ? (
          <img src={src} alt={alt} className="h-full w-full object-cover" onError={() => setFailed(true)} />
        ) : (
          <span
            className={`font-display font-bold uppercase tracking-widest ${FALLBACK_TEXT_CLASS[size]}`}
            style={{ color: accent, textShadow: `0 0 6px ${accent}` }}
          >
            {fallbackText}
          </span>
        )}
      </div>
    </div>
  )
}
