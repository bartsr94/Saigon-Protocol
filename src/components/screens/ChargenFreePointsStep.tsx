// Character Creation step 2: free-point spend (docs/GAME_GUIDE.md §2.2 step 2).
// Live-updates Insight levels and wellbeing via the real insightStore
// actions. refundFreePoint already refuses to drop a level below its
// archetype baseline — GDD §4's "face the consequences" intent, enforced
// store-side, not re-implemented here.

import { INSIGHT_IDS, INSIGHT_MAX, INSIGHTS } from '../../content/insights'
import { ARCHETYPES } from '../../content/archetypes'
import { useInsightStore } from '../../stores/insightStore'
import { CyberButton, Panel, PipTrack } from '../ui'

export interface ChargenFreePointsStepProps {
  onBack: () => void
  onNext: () => void
}

export function ChargenFreePointsStep({ onBack, onNext }: ChargenFreePointsStepProps) {
  const archetype = useInsightStore((s) => s.archetype)
  const levels = useInsightStore((s) => s.levels)
  const freePointsRemaining = useInsightStore((s) => s.freePointsRemaining)
  const spendFreePoint = useInsightStore((s) => s.spendFreePoint)
  const refundFreePoint = useInsightStore((s) => s.refundFreePoint)

  if (!archetype) return null
  const baseline = ARCHETYPES[archetype].baseline

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="font-body text-sm text-white/60">Distribute free points to personalize your Insights.</span>
        <span className="font-display text-sm font-bold uppercase tracking-widest text-chrome-secondary">{freePointsRemaining} left</span>
      </div>

      <Panel size="sm" className="flex flex-col gap-3 p-5">
        {INSIGHT_IDS.map((id) => {
          const def = INSIGHTS[id]
          const level = levels[id]
          const atBaseline = level <= baseline[id]
          const atCap = level >= INSIGHT_MAX
          return (
            <div key={id} className="flex items-center gap-3">
              <span
                className="w-36 shrink-0 font-display text-xs font-bold uppercase tracking-widest"
                style={{ color: def.color, textShadow: `0 0 5px ${def.color}` }}
              >
                {def.name}
              </span>
              <PipTrack current={level} max={INSIGHT_MAX} color={def.color} className="flex-1" />
              <button
                type="button"
                onClick={() => refundFreePoint(id)}
                disabled={atBaseline}
                className="h-6 w-6 border border-white/20 font-display text-xs text-white/60 outline-none transition-colors hover:border-chrome-secondary hover:text-white disabled:opacity-20"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => spendFreePoint(id)}
                disabled={freePointsRemaining <= 0 || atCap}
                className="h-6 w-6 border border-white/20 font-display text-xs text-white/60 outline-none transition-colors hover:border-chrome-secondary hover:text-white disabled:opacity-20"
              >
                +
              </button>
            </div>
          )
        })}
      </Panel>

      <div className="flex justify-between pt-2">
        <CyberButton onClick={onBack}>Back</CyberButton>
        <CyberButton onClick={onNext}>Next</CyberButton>
      </div>
    </div>
  )
}
