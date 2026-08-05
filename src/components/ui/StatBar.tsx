interface StatBarProps {
  value: number
  max: number
  label?: string
  className?: string
}

export function StatBar({ value, max, label, className = '' }: StatBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  const color = pct > 50 ? 'bg-cyan-400' : pct > 20 ? 'bg-amber-400' : 'bg-fuchsia-500'

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
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-800/80 ring-1 ring-inset ring-neutral-800">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
