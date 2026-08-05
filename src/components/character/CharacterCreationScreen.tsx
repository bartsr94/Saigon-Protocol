import { useState } from 'react'
import type { Attributes } from '../../stores/characterStore'
import { useCharacterStore } from '../../stores/characterStore'
import { ARCHETYPES } from '../../content/archetypes'
import { rollAttributeSet, buildCharacterFromArchetype } from '../../engine/chargen'
import { GameFrame } from '../ui/GameFrame'
import { Eyebrow, Title } from '../ui/Screen'
import { Button } from '../ui/Button'
import { CardButton } from '../ui/CardButton'

const ATTRIBUTE_LABELS: Record<keyof Attributes, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  endurance: 'END',
  intellect: 'INT',
  education: 'EDU',
  socialStanding: 'SOC',
}

type Step = 'name' | 'attributes' | 'archetype' | 'review'
const STEPS: Step[] = ['name', 'attributes', 'archetype', 'review']
const STEP_LABELS: Record<Step, string> = {
  name: 'Identity',
  attributes: 'Attributes',
  archetype: 'Background',
  review: 'Dossier',
}

function StepProgress({ step }: { step: Step }) {
  const currentIndex = STEPS.indexOf(step)
  return (
    <div className="mt-6 flex items-center gap-2">
      {STEPS.map((s, index) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`flex h-6 items-center rounded-full border px-3 font-display text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              index === currentIndex
                ? 'border-cyan-400/70 bg-cyan-400/10 text-cyan-300 shadow-[0_0_14px_-4px_rgba(34,211,238,0.7)]'
                : index < currentIndex
                  ? 'border-neutral-700 text-neutral-400'
                  : 'border-neutral-800 text-neutral-600'
            }`}
          >
            {STEP_LABELS[s]}
          </div>
          {index < STEPS.length - 1 && <div className="h-px w-4 bg-neutral-800" />}
        </div>
      ))}
    </div>
  )
}

export function CharacterCreationScreen() {
  const setCharacter = useCharacterStore((state) => state.setCharacter)

  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [attributes, setAttributes] = useState<Attributes | null>(null)
  const [archetypeId, setArchetypeId] = useState<string | null>(null)

  const archetype = ARCHETYPES.find((a) => a.id === archetypeId) ?? null

  const confirm = () => {
    if (!attributes || !archetype || !name.trim()) return
    setCharacter(buildCharacterFromArchetype(name.trim(), attributes, archetype))
  }

  return (
    <GameFrame>
      <div className="mx-auto max-w-2xl">
        <Eyebrow>Saigon SEZ // 2226</Eyebrow>
        <Title className="mt-1">New Runner</Title>
        <StepProgress step={step} />

        {step === 'name' && (
          <div className="mt-8">
            <label className="font-display text-xs uppercase tracking-wider text-neutral-500">
              Identify Yourself
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-md border border-neutral-800 bg-neutral-900/60 p-3 font-display text-lg tracking-wide text-neutral-100 outline-none transition-colors focus:border-cyan-400/60 focus:shadow-[0_0_18px_-6px_rgba(34,211,238,0.6)]"
              placeholder="What do people call you?"
            />
            <Button
              disabled={!name.trim()}
              onClick={() => setStep('attributes')}
              className="mt-5"
            >
              Continue
            </Button>
          </div>
        )}

        {step === 'attributes' && (
          <div className="mt-8">
            <p className="text-sm text-neutral-400">2d6 per attribute, rolled cold.</p>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {(Object.keys(ATTRIBUTE_LABELS) as (keyof Attributes)[]).map((key) => (
                <div
                  key={key}
                  className="rounded-md border border-neutral-800 bg-neutral-900/60 p-4 text-center"
                >
                  <div className="font-display text-xs tracking-wider text-neutral-500">
                    {ATTRIBUTE_LABELS[key]}
                  </div>
                  <div className="mt-1 font-display text-3xl font-bold text-cyan-300 text-glow-cyan">
                    {attributes?.[key] ?? '—'}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <Button variant="secondary" onClick={() => setAttributes(rollAttributeSet())}>
                {attributes ? 'Reroll' : 'Roll'}
              </Button>
              <Button disabled={!attributes} onClick={() => setStep('archetype')}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'archetype' && (
          <div className="mt-8">
            <p className="text-sm text-neutral-400">Who were you before this?</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {ARCHETYPES.map((a) => (
                <CardButton
                  key={a.id}
                  selected={archetypeId === a.id}
                  onClick={() => setArchetypeId(a.id)}
                >
                  <div className="font-display font-semibold tracking-wide">{a.name}</div>
                  <div className="mt-0.5 font-display text-[10px] uppercase tracking-wider text-cyan-500/80">
                    {a.career}
                  </div>
                  <div className="mt-2 text-sm leading-relaxed text-neutral-400">{a.blurb}</div>
                </CardButton>
              ))}
            </div>

            <Button disabled={!archetype} onClick={() => setStep('review')} className="mt-5">
              Continue
            </Button>
          </div>
        )}

        {step === 'review' && attributes && archetype && (
          <div className="mt-8">
            <div className="rounded-md border border-cyan-400/30 bg-neutral-900/60 shadow-[0_0_30px_-10px_rgba(34,211,238,0.5)]">
              <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/80 px-4 py-2">
                <span className="font-display text-[10px] uppercase tracking-[0.25em] text-cyan-400">
                  Operator Dossier
                </span>
                <span className="font-display text-[10px] uppercase tracking-wider text-neutral-600">
                  SEZ-PROTOCOL
                </span>
              </div>

              <div className="p-4">
                <div className="font-display text-xl font-semibold tracking-wide">{name}</div>
                <div className="text-sm text-neutral-400">{archetype.name}</div>

                <div className="mt-4 grid grid-cols-6 gap-2 text-center">
                  {(Object.keys(ATTRIBUTE_LABELS) as (keyof Attributes)[]).map((key) => (
                    <div key={key} className="rounded border border-neutral-800 bg-neutral-950/60 py-2">
                      <div className="font-display text-[10px] text-neutral-500">
                        {ATTRIBUTE_LABELS[key]}
                      </div>
                      <div className="font-display font-semibold text-cyan-300">
                        {attributes[key]}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-sm">
                  <div className="font-display text-[10px] uppercase tracking-wider text-neutral-500">
                    Skills
                  </div>
                  <div className="mt-1 text-neutral-300">
                    {archetype.skills.map((s) => `${s.name} ${s.level}`).join(', ')}
                  </div>
                </div>

                <div className="mt-3 text-sm">
                  <div className="font-display text-[10px] uppercase tracking-wider text-neutral-500">
                    Equipment
                  </div>
                  <div className="mt-1 text-neutral-300">
                    {archetype.equipment.map((e) => e.name).join(', ')}
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={confirm} className="mt-5">
              Start
            </Button>
          </div>
        )}
      </div>
    </GameFrame>
  )
}
