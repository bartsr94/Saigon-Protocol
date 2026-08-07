import { useEffect, useRef, useState } from 'react'

export interface PipTrackProps {
  current: number
  max: number
  /** Track color — var(--color-vitality) or var(--color-composure). */
  color: string
  label?: string
  className?: string
}

/**
 * Discrete pip/segment wellbeing track (Composure/Vitality) — deliberately
 * NOT a smooth bar, per docs/GAME_GUIDE.md §2.1: the player should read exact
 * remaining points and feel each hit. Pips that just changed get a brief
 * one-shot flash (docs/GAME_GUIDE.md §3.4); `motion-safe:` skips it under
 * prefers-reduced-motion.
 */
export function PipTrack({ current, max, color, label, className = '' }: PipTrackProps) {
  const prevCurrent = useRef(current)
  const [flashRange, setFlashRange] = useState<[number, number] | null>(null)

  useEffect(() => {
    if (prevCurrent.current !== current) {
      setFlashRange([Math.min(prevCurrent.current, current), Math.max(prevCurrent.current, current)])
      prevCurrent.current = current
      const timeout = setTimeout(() => setFlashRange(null), 500)
      return () => clearTimeout(timeout)
    }
  }, [current])

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <span className="font-display text-xs font-bold uppercase tracking-widest" style={{ color, textShadow: `0 0 5px ${color}` }}>
          {label}
        </span>
      )}
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => {
          const filled = i < current
          const flashing = flashRange !== null && i >= flashRange[0] && i < flashRange[1]
          return (
            <span
              key={i}
              className={`h-5 w-5 border transition-colors duration-300 ${flashing ? 'motion-safe:animate-pip-flash' : ''}`}
              style={{
                clipPath:
                  'polygon(var(--cut-sm) 0, 100% 0, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0 100%, 0 var(--cut-sm))',
                backgroundColor: filled ? color : 'transparent',
                borderColor: filled ? color : 'color-mix(in srgb, white 25%, transparent)',
                boxShadow: filled ? `0 0 8px ${color}` : 'none',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
