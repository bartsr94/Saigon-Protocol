import barBk from '../../assets/ui/Bars_and_Indicators/Progress_Bar/Progress_Bar_Bk.png'
import barFill from '../../assets/ui/Bars_and_Indicators/Progress_Bar/Progress_Bar_Fill.png'

interface StatBarProps {
  value: number
  max: number
  label?: string
  className?: string
}

// The fill art is a fixed-color image sized to the bar's full width. Rather
// than stretching it to the live percentage (which would squash its chamfered
// end caps), it's rendered at a background-size inversely scaled to the
// wrapper's width so it always renders at "full bar" scale and the wrapper's
// overflow:hidden crops it — the same trick as a sprite-based health bar.
const FILTER_BY_BAND: Record<'high' | 'mid' | 'low', string> = {
  high: 'none',
  mid: 'hue-rotate(-140deg) saturate(1.4)',
  low: 'hue-rotate(120deg) saturate(1.5)',
}

export function StatBar({ value, max, label, className = '' }: StatBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  const band = pct > 50 ? 'high' : pct > 20 ? 'mid' : 'low'

  return (
    <div className={className}>
      {label && (
        <div className="flex items-baseline justify-between font-display text-[11px] uppercase tracking-wider text-neutral-500">
          <span>{label}</span>
          <span className="text-neutral-400">
            {Math.max(0, value)} / {max}
          </span>
        </div>
      )}
      <div
        className="relative mt-1 h-3 w-full overflow-hidden"
        style={{ backgroundImage: `url(${barBk})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' }}
      >
        {pct > 0 && (
          <div
            className="absolute inset-y-0 left-0 h-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              backgroundImage: `url(${barFill})`,
              backgroundSize: `${10000 / pct}% 100%`,
              backgroundPosition: 'left center',
              backgroundRepeat: 'no-repeat',
              filter: FILTER_BY_BAND[band],
            }}
          />
        )}
      </div>
    </div>
  )
}
