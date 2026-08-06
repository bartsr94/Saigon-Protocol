// Dev harness only — exercises insightStore + the Check Resolution Engine end to end
// before any real screen (Dialogue/Scene, Character Creation) gets built on top of them.

import { useState } from 'react'
import { useInsightStore } from '../../stores/insightStore'
import { ARCHETYPE_IDS, ARCHETYPES } from '../../content/archetypes'
import { INSIGHT_IDS, INSIGHT_MAX, INSIGHTS } from '../../content/insights'
import { type CheckResult } from '../../engine/checkResolution'

function WellbeingPips({ label, current, max }: { label: string; current: number; max: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-xs text-neutral-400">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-sm border border-neutral-600 ${i < current ? 'bg-emerald-400' : 'bg-neutral-800'}`}
          />
        ))}
      </div>
      <span className="text-xs text-neutral-500">
        {current}/{max}
      </span>
    </div>
  )
}

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
        <h1 className="mb-4 text-lg font-semibold text-neutral-100">Pick an archetype</h1>
        <div className="grid grid-cols-2 gap-3">
          {ARCHETYPE_IDS.map((id) => {
            const def = ARCHETYPES[id]
            return (
              <button
                key={id}
                type="button"
                onClick={() => state.selectArchetype(id)}
                className="rounded border border-neutral-700 p-4 text-left hover:border-emerald-400"
              >
                <div className="font-medium text-neutral-100">{def.name}</div>
                <div className="mt-1 text-xs text-neutral-400">{def.backstory}</div>
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
        <h1 className="text-lg font-semibold text-neutral-100">{ARCHETYPES[state.archetype].name}</h1>
        <p className="text-xs text-neutral-500">Free points remaining: {state.freePointsRemaining}</p>
      </div>

      {state.failState && (
        <div className="rounded border border-red-500 bg-red-950/50 p-3 text-sm text-red-300">
          Fail state reached: {state.failState}
        </div>
      )}

      <div className="space-y-2">
        <WellbeingPips label="Vitality" current={state.vitality.current} max={state.vitality.max} />
        <WellbeingPips label="Composure" current={state.composure.current} max={state.composure.max} />
        <div className="flex gap-2 pt-1">
          <button className="rounded border border-neutral-700 px-2 py-1 text-xs" onClick={() => state.damageVitality(1)}>
            -1 Vitality
          </button>
          <button className="rounded border border-neutral-700 px-2 py-1 text-xs" onClick={() => state.healVitality(1)}>
            +1 Vitality
          </button>
          <button className="rounded border border-neutral-700 px-2 py-1 text-xs" onClick={() => state.damageComposure(1)}>
            -1 Composure
          </button>
          <button className="rounded border border-neutral-700 px-2 py-1 text-xs" onClick={() => state.healComposure(1)}>
            +1 Composure
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {INSIGHT_IDS.map((id) => (
          <div key={id} className="flex items-center gap-2">
            <span className="w-32 shrink-0 text-sm" style={{ color: INSIGHTS[id].color }}>
              {INSIGHTS[id].name}
            </span>
            <span className="w-6 text-center text-sm text-neutral-200">{state.levels[id]}</span>
            <button
              className="rounded border border-neutral-700 px-2 text-xs disabled:opacity-30"
              disabled={state.freePointsRemaining <= 0 || state.levels[id] >= INSIGHT_MAX}
              onClick={() => state.spendFreePoint(id)}
            >
              +
            </button>
            <button
              className="rounded border border-neutral-700 px-2 text-xs disabled:opacity-30"
              disabled={state.levels[id] <= ARCHETYPES[state.archetype!].baseline[id]}
              onClick={() => state.refundFreePoint(id)}
            >
              -
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded border border-neutral-800 p-4">
        <h2 className="text-sm font-medium text-neutral-200">Check tester</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1"
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
              className="w-14 rounded border border-neutral-700 bg-neutral-900 px-1 py-1"
              value={targetNumber}
              onChange={(e) => setTargetNumber(Number(e.target.value))}
            />
          </label>
          <input
            className="w-32 rounded border border-neutral-700 bg-neutral-900 px-1 py-1"
            value={checkId}
            onChange={(e) => setCheckId(e.target.value)}
            placeholder="check id"
          />
          <select
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1"
            value={risk}
            onChange={(e) => setRisk(e.target.value as typeof risk)}
          >
            <option value="white">White (retriable)</option>
            <option value="red">Red (one-shot)</option>
          </select>
          <button className="rounded border border-emerald-500 px-3 py-1 text-emerald-300" onClick={handleRoll}>
            Roll
          </button>
        </div>

        {lastResult === 'consumed' && (
          <p className="text-xs text-red-400">This Red check id has already been spent.</p>
        )}
        {lastResult && lastResult !== 'consumed' && (
          <p className="font-mono text-xs text-neutral-300">
            [{lastResult.dice[0]}][{lastResult.dice[1]}] = {lastResult.diceTotal} + {lastResult.modifier} mod ={' '}
            {lastResult.total} vs TN {lastResult.targetNumber} ▸{' '}
            <span className={lastResult.success ? 'text-emerald-400' : 'text-red-400'}>
              {lastResult.success ? 'SUCCESS' : 'FAILURE'}
            </span>
            {lastResult.doubles && <span className="text-yellow-400"> ({lastResult.doubles})</span>}
          </p>
        )}
      </div>
    </div>
  )
}
