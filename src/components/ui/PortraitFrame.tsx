import { useState } from 'react'

export type PortraitSize = 'sm' | 'md' | 'lg'

const OUTER_PX: Record<PortraitSize, number> = { sm: 64, md: 144, lg: 160 }
const OUTER_CUT: Record<PortraitSize, string> = { sm: '10px', md: '21px', lg: '20px' }
const INNER_CUT: Record<PortraitSize, string> = { sm: '6px', md: '14px', lg: '14px' }
const FALLBACK_TEXT_CLASS: Record<PortraitSize, string> = { sm: 'text-[0.6rem]', md: 'text-sm', lg: 'text-base' }

export interface PortraitFrameProps {
  /** `undefined`/missing/failed-to-load all fall through to the initials fallback below — art hasn't landed yet. */
  src?: string
  alt: string
  fallbackText: string
  accent?: string
  size?: PortraitSize
  className?: string
}

/**
 * Angular corner-cut avatar frame (docs/GAME_GUIDE.md §2.1, adopted from
 * the inspo's portrait-frame/portrait-inner). Used for the player's HUD
 * chip, chargen previews, and the Character overlay.
 */
export function PortraitFrame({ src, alt, fallbackText, accent = 'var(--color-chrome-primary)', size = 'md', className = '' }: PortraitFrameProps) {
  const [failed, setFailed] = useState(false)
  const px = OUTER_PX[size]
  const showImage = Boolean(src) && !failed

  return (
    <div
      className={`relative shrink-0 bg-black/60 backdrop-blur-sm ${className}`}
      style={{
        width: px,
        height: px,
        border: `2px solid color-mix(in srgb, ${accent} 60%, transparent)`,
        clipPath: `polygon(${OUTER_CUT[size]} 0, 100% 0, 100% calc(100% - ${OUTER_CUT[size]}), calc(100% - ${OUTER_CUT[size]}) 100%, 0 100%, 0 ${OUTER_CUT[size]})`,
        boxShadow: `0 0 15px color-mix(in srgb, ${accent} 25%, transparent), inset 0 0 20px color-mix(in srgb, ${accent} 15%, transparent)`,
      }}
    >
      <div
        className="absolute inset-1 flex items-center justify-center overflow-hidden"
        style={{
          clipPath: `polygon(${INNER_CUT[size]} 0, 100% 0, 100% calc(100% - ${INNER_CUT[size]}), calc(100% - ${INNER_CUT[size]}) 100%, 0 100%, 0 ${INNER_CUT[size]})`,
          background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 12%, transparent), transparent)`,
        }}
      >
        {showImage ? (
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
