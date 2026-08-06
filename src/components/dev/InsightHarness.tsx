// Dev harness only — exercises insightStore + the Check Resolution Engine end to end
// before any real screen (Dialogue/Scene, Character Creation) gets built on top of them.

import { useState } from 'react'
import { useInsightStore } from '../../stores/insightStore'
import { ARCHETYPE_IDS, ARCHETYPES } from '../../content/archetypes'
import { INSIGHT_IDS, INSIGHT_MAX, INSIGHTS } from '../../content/insights'
import { type CheckResult } from '../../engine/checkResolution'
import { CheckResultBlock, CyberButton, GlitchText, InsightChip, Panel, PipTrack } from '../ui'

export function InsightHarness() {
  const state = useInsightStore()
  const [targetNumber, setTargetNumber] = useState(7)
  const [checkId, setCheckId] = useState('test-check')
  const [risk, setRisk] = useState<'white' | 'red'>('white')
  const [rollingInsight, setRollingInsight] = useState(INSIGHT_IDS[0])
  const [lastResult, setLastResult] = useState<CheckResult | null | 'consumed'>(null)

  if (!state.archetype) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="mb-4 font-display text-lg font-bold uppercase tracking-widest text-chrome-primary">
          <GlitchText text="Pick an archetype" />
        </h1>
        <div className="grid grid-cols-2 gap-3">
          {ARCHETYPE_IDS.map((id) => {
            const def = ARCHETYPES[id]
            return (
              <button key={id} type="button" onClick={() => state.selectArchetype(id)} className="text-left">
                <Panel size="sm" className="h-full p-4 transition-colors hover:!border-chrome-secondary">
                  <div className="font-display text-sm font-bold uppercase tracking-wide text-white">{def.name}</div>
                  <div className="mt-1 font-body text-xs text-white/60">{def.backstory}</div>
                </Panel>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  function handleRoll() {
    const result = state.rollCheck(rollingInsight, targetNumber, checkId, risk)
    setLastResult(result === null ? 'consumed' : result)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="font-display text-lg font-bold uppercase tracking-widest text-chrome-primary">
          {ARCHETYPES[state.archetype].name}
        </h1>
        <p className="mt-1 font-body text-xs text-white/50">Free points remaining: {state.freePointsRemaining}</p>
      </div>

      {state.failState && (
        <Panel size="sm" accent="var(--color-check-red)" className="p-3">
          <p className="font-body text-sm" style={{ color: 'var(--color-check-red)' }}>
            Fail state reached: {state.failState}
          </p>
        </Panel>
      )}

      <div className="space-y-3">
        <PipTrack label="VITALITY" current={state.vitality.current} max={state.vitality.max} color="var(--color-vitality)" />
        <PipTrack label="COMPOSURE" current={state.composure.current} max={state.composure.max} color="var(--color-composure)" />
        <div className="flex flex-wrap gap-2 pt-1">
          <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={() => state.damageVitality(1)}>
            -1 Vitality
          </CyberButton>
          <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={() => state.healVitality(1)}>
            +1 Vitality
          </CyberButton>
          <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={() => state.damageComposure(1)}>
            -1 Composure
          </CyberButton>
          <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={() => state.healComposure(1)}>
            +1 Composure
          </CyberButton>
        </div>
      </div>

      <div className="space-y-1">
        {INSIGHT_IDS.map((id) => (
          <div key={id} className="flex items-center gap-2">
            <InsightChip name={INSIGHTS[id].name} color={INSIGHTS[id].color} className="w-40" />
            <span className="w-6 text-center font-body text-sm text-white/80">{state.levels[id]}</span>
            <button
              className="border border-white/20 px-2 font-display text-xs text-white/80 transition-colors hover:border-chrome-secondary hover:text-chrome-secondary disabled:opacity-30"
              disabled={state.freePointsRemaining <= 0 || state.levels[id] >= INSIGHT_MAX}
              onClick={() => state.spendFreePoint(id)}
            >
              +
            </button>
            <button
              className="border border-white/20 px-2 font-display text-xs text-white/80 transition-colors hover:border-chrome-secondary hover:text-chrome-secondary disabled:opacity-30"
              disabled={state.levels[id] <= ARCHETYPES[state.archetype!].baseline[id]}
              onClick={() => state.refundFreePoint(id)}
            >
              -
            </button>
          </div>
        ))}
      </div>

      <Panel size="md" className="space-y-2 p-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-chrome-primary">Check tester</h2>
        <div className="flex flex-wrap items-center gap-2 font-body text-xs">
          <select
            className="border border-white/20 bg-black/60 px-2 py-1"
            value={rollingInsight}
            onChange={(e) => setRollingInsight(e.target.value as typeof rollingInsight)}
          >
            {INSIGHT_IDS.map((id) => (
              <option key={id} value={id}>
                {INSIGHTS[id].name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1">
            TN
            <input
              type="number"
              className="w-14 border border-white/20 bg-black/60 px-1 py-1"
              value={targetNumber}
              onChange={(e) => setTargetNumber(Number(e.target.value))}
            />
          </label>
          <input
            className="w-32 border border-white/20 bg-black/60 px-1 py-1"
            value={checkId}
            onChange={(e) => setCheckId(e.target.value)}
            placeholder="check id"
          />
          <select
            className="border border-white/20 bg-black/60 px-2 py-1"
            value={risk}
            onChange={(e) => setRisk(e.target.value as typeof risk)}
          >
            <option value="white">White (retriable)</option>
            <option value="red">Red (one-shot)</option>
          </select>
          <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={handleRoll}>
            Roll
          </CyberButton>
        </div>

        {lastResult === 'consumed' && (
          <p className="font-body text-xs" style={{ color: 'var(--color-check-red)' }}>
            This Red check id has already been spent.
          </p>
        )}
        {lastResult && lastResult !== 'consumed' && (
          <CheckResultBlock insightName={INSIGHTS[rollingInsight].name} result={lastResult} />
        )}
      </Panel>
    </div>
  )
}
