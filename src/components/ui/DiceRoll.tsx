import { useEffect, useState } from 'react'
import type { CheckTier } from '../../engine/resolution'

const TIER_LABEL: Record<CheckTier, string> = {
  critSuccess: 'Critical Success!',
  success: 'Success',
  failure: 'Failure',
  critFailure: 'Critical Failure!',
}

const TIER_CLASS: Record<CheckTier, string> = {
  critSuccess: 'text-cyan-300 text-glow-cyan',
  success: 'text-cyan-400',
  failure: 'text-neutral-500',
  critFailure: 'text-fuchsia-400 text-glow-magenta',
}

interface DiceRollProps {
  dice: [number, number]
  tier: CheckTier
  message: string
  onSettled: () => void
}

/** Tumble-then-settle 2d6 reveal: dice cycle randomly, then lock onto the
 * engine's already-resolved values before the log line and tier appear. */
export function DiceRoll({ dice, tier, message, onSettled }: DiceRollProps) {
  const [rolling, setRolling] = useState(true)
  const [faces, setFaces] = useState<[number, number]>([1, 6])

  useEffect(() => {
    const tumble = setInterval(() => {
      setFaces([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)])
    }, 80)
    const settle = setTimeout(() => {
      clearInterval(tumble)
      setFaces(dice)
      setRolling(false)
    }, 700)
    return () => {
      clearInterval(tumble)
      clearTimeout(settle)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (rolling) return
    const timeout = setTimeout(onSettled, 550)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolling])

  return (
    <div className="flex items-center gap-3 rounded-md border border-neutral-800 bg-neutral-950/70 px-3 py-2 font-mono text-xs">
      <div className="flex gap-1.5">
        {faces.map((face, i) => (
          <div
            key={i}
            className={`flex h-6 w-6 items-center justify-center rounded border font-display text-sm font-bold transition-colors ${
              rolling ? 'border-neutral-700 text-neutral-500' : 'border-cyan-400/50 text-cyan-300'
            }`}
          >
            {face}
          </div>
        ))}
      </div>
      {!rolling && (
        <div className="flex-1">
          <div className={`font-display text-[10px] uppercase tracking-wider ${TIER_CLASS[tier]}`}>
            {TIER_LABEL[tier]}
          </div>
          <div className="text-neutral-400">{message}</div>
        </div>
      )}
    </div>
  )
}
