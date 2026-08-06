// Character Creation (UI_DESIGN §6.2 / GDD §4): three-step wizard —
// archetype select, free-point spend, confirm/name — before dropping into
// the Overworld. Step state is local; the actual character data lives in
// insightStore via the store actions each step already wired to.

import { useState } from 'react'
import { useInsightStore } from '../../stores/insightStore'
import { useUiStore } from '../../stores/uiStore'
import { GlitchText } from '../ui'
import { ChargenArchetypeStep } from './ChargenArchetypeStep'
import { ChargenFreePointsStep } from './ChargenFreePointsStep'
import { ChargenConfirmStep } from './ChargenConfirmStep'

type Step = 'archetype' | 'freePoints' | 'confirm'

const STEPS: Step[] = ['archetype', 'freePoints', 'confirm']
const STEP_LABELS: Record<Step, string> = {
  archetype: 'Archetype',
  freePoints: 'Free Points',
  confirm: 'Confirm',
}

export function CharacterCreationScreen() {
  const archetype = useInsightStore((s) => s.archetype)
  const goToGame = useUiStore((s) => s.goToGame)
  const [step, setStep] = useState<Step>('archetype')

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-6 p-8">
      <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-chrome-primary">
        <GlitchText text="Character Creation" />
      </h1>

      <div className="flex gap-6 border-b border-white/10 pb-3 font-display text-xs font-bold uppercase tracking-widest">
        {STEPS.map((s, i) => (
          <span key={s} className={s === step ? 'text-white' : 'text-white/30'}>
            {i + 1}. {STEP_LABELS[s]}
          </span>
        ))}
      </div>

      {step === 'archetype' && <ChargenArchetypeStep onNext={() => setStep('freePoints')} />}
      {step === 'freePoints' && archetype && (
        <ChargenFreePointsStep onBack={() => setStep('archetype')} onNext={() => setStep('confirm')} />
      )}
      {step === 'confirm' && archetype && <ChargenConfirmStep onBack={() => setStep('freePoints')} onConfirm={goToGame} />}
    </div>
  )
}
