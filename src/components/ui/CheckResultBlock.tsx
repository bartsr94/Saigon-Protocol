import type { CheckResult } from '../../engine/checkResolution'

export interface CheckResultBlockProps {
  insightName: string
  result: CheckResult
}

/**
 * Transparent check-result readout for the dialogue log (UI_DESIGN §5) —
 * shows the dice, modifier, target, and pass/fail rather than hiding the
 * math, on purpose. Takes the engine's own CheckResult shape directly.
 */
export function CheckResultBlock({ insightName, result }: CheckResultBlockProps) {
  const { dice, diceTotal, modifier, targetNumber, total, success, doubles } = result
  const color = success ? 'var(--color-check-white)' : 'var(--color-check-red)'
  const sign = modifier >= 0 ? '+' : '−'

  return (
    <div
      className="my-2 flex flex-col gap-1 px-3 py-2 font-display text-xs"
      style={{
        clipPath:
          'polygon(var(--cut-sm) 0, 100% 0, 100% calc(100% - var(--cut-sm)), calc(100% - var(--cut-sm)) 100%, 0 100%, 0 var(--cut-sm))',
        border: `1px solid ${color}`,
        boxShadow: `inset 0 0 10px color-mix(in srgb, ${color} 20%, transparent)`,
      }}
    >
      <span className="uppercase tracking-widest" style={{ color }}>
        ● CHECK — {insightName} vs. {targetNumber}
      </span>
      <span className="font-body text-sm text-white/80">
        2d6 [{dice[0]}][{dice[1]}] = {diceTotal} {sign}
        {Math.abs(modifier)} {insightName} = {total} ▸{' '}
        <span className="font-display" style={{ color }}>
          {success ? 'SUCCESS' : 'FAILURE'}
        </span>
        {doubles && <span className="text-yellow-300"> ({doubles})</span>}
      </span>
    </div>
  )
}
