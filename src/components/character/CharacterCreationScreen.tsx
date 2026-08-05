import { useState } from 'react'
import type { Attributes } from '../../stores/characterStore'
import { useCharacterStore } from '../../stores/characterStore'
import { ARCHETYPES } from '../../content/archetypes'
import { rollAttributeSet, buildCharacterFromArchetype } from '../../engine/chargen'

const ATTRIBUTE_LABELS: Record<keyof Attributes, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  endurance: 'END',
  intellect: 'INT',
  education: 'EDU',
  socialStanding: 'SOC',
}

type Step = 'name' | 'attributes' | 'archetype' | 'review'

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
    <div className="min-h-svh bg-neutral-950 text-neutral-100 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">New Runner</h1>
        <p className="mt-1 text-neutral-400">Saigon SEZ, 2226.</p>

        {step === 'name' && (
          <div className="mt-6">
            <label className="block text-sm text-neutral-400">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-neutral-100 outline-none focus:border-neutral-600"
              placeholder="What do people call you?"
            />
            <button
              disabled={!name.trim()}
              onClick={() => setStep('attributes')}
              className="mt-4 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}

        {step === 'attributes' && (
          <div className="mt-6">
            <p className="text-neutral-400 text-sm">2d6 per attribute, rolled cold.</p>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {(Object.keys(ATTRIBUTE_LABELS) as (keyof Attributes)[]).map((key) => (
                <div
                  key={key}
                  className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-center"
                >
                  <div className="text-xs text-neutral-500">{ATTRIBUTE_LABELS[key]}</div>
                  <div className="mt-1 text-2xl font-semibold">{attributes?.[key] ?? '—'}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setAttributes(rollAttributeSet())}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-500"
              >
                {attributes ? 'Reroll' : 'Roll'}
              </button>
              <button
                disabled={!attributes}
                onClick={() => setStep('archetype')}
                className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'archetype' && (
          <div className="mt-6">
            <p className="text-neutral-400 text-sm">Who were you before this?</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {ARCHETYPES.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setArchetypeId(a.id)}
                  className={`text-left rounded-lg border p-4 transition-colors ${
                    archetypeId === a.id
                      ? 'border-neutral-400 bg-neutral-800'
                      : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'
                  }`}
                >
                  <div className="font-medium">{a.name}</div>
                  <div className="mt-1 text-sm text-neutral-400">{a.blurb}</div>
                </button>
              ))}
            </div>

            <button
              disabled={!archetype}
              onClick={() => setStep('review')}
              className="mt-4 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}

        {step === 'review' && attributes && archetype && (
          <div className="mt-6">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <div className="text-lg font-medium">{name}</div>
              <div className="text-sm text-neutral-400">{archetype.name}</div>

              <div className="mt-3 grid grid-cols-6 gap-2 text-center">
                {(Object.keys(ATTRIBUTE_LABELS) as (keyof Attributes)[]).map((key) => (
                  <div key={key}>
                    <div className="text-xs text-neutral-500">{ATTRIBUTE_LABELS[key]}</div>
                    <div className="font-semibold">{attributes[key]}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-sm">
                <div className="text-neutral-500">Skills</div>
                <div className="mt-1 text-neutral-300">
                  {archetype.skills.map((s) => `${s.name} ${s.level}`).join(', ')}
                </div>
              </div>

              <div className="mt-3 text-sm">
                <div className="text-neutral-500">Equipment</div>
                <div className="mt-1 text-neutral-300">
                  {archetype.equipment.map((e) => e.name).join(', ')}
                </div>
              </div>
            </div>

            <button
              onClick={confirm}
              className="mt-4 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950"
            >
              Start
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
