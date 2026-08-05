import { useState } from 'react'
import { useStoryStore } from '../../stores/storyStore'
import { useNavigationStore } from '../../stores/navigationStore'
import { saveGame } from '../../stores/saveStore'
import { voiceForKey } from '../../content/attributeVoices'
import { GameFrame } from '../ui/GameFrame'
import { Button } from '../ui/Button'
import { DiceRoll } from '../ui/DiceRoll'
import { playSfx } from '../../audio/sfx'

const STAKES_CLASS: Record<'white' | 'red', string> = {
  white: 'border-neutral-700 text-neutral-300',
  red: 'border-fuchsia-400/60 text-fuchsia-300',
}

export function StoryScreen() {
  const currentText = useStoryStore((state) => state.currentText)
  const currentChoices = useStoryStore((state) => state.currentChoices)
  const pendingCheck = useStoryStore((state) => state.pendingCheck)
  const choose = useStoryStore((state) => state.choose)
  const resolveCheck = useStoryStore((state) => state.resolveCheck)
  const resetStory = useStoryStore((state) => state.resetStory)
  const selectLocation = useNavigationStore((state) => state.selectLocation)

  const [justSaved, setJustSaved] = useState(false)

  const handleBack = () => {
    playSfx('cancel')
    resetStory()
    selectLocation(null)
  }

  const handleChoose = (index: number) => {
    playSfx('select')
    choose(index)
  }

  const handleSave = () => {
    saveGame()
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 1500)
  }

  return (
    <GameFrame>
      <div className="mx-auto flex max-w-2xl flex-col">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="font-display self-start text-xs uppercase tracking-wider text-neutral-500 transition-colors hover:text-cyan-300"
          >
            ◄ Back
          </button>

          <div className="flex items-center gap-2">
            {justSaved && (
              <span className="font-display text-[10px] uppercase tracking-wider text-cyan-400">
                Saved
              </span>
            )}
            <Button variant="secondary" sound="select" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-4 border-l-2 border-cyan-400/20 pl-5">
          {currentText.map((line, index) => {
            const voice = voiceForKey(line.voice)
            if (voice) {
              return (
                <div key={index} className={`border-l-2 pl-3 ${voice.borderClass}`}>
                  <div
                    className={`font-display text-[10px] uppercase tracking-wider ${voice.textClass}`}
                  >
                    {voice.label}
                  </div>
                  <p className="italic leading-relaxed text-neutral-300">{line.text}</p>
                </div>
              )
            }
            return (
              <p key={index} className="leading-relaxed text-neutral-200">
                {line.text}
              </p>
            )
          })}
        </div>

        <div className="mt-8 space-y-2">
          {pendingCheck && (
            <DiceRoll
              dice={pendingCheck.dice}
              tier={pendingCheck.tier}
              message={pendingCheck.message}
              onSettled={resolveCheck}
            />
          )}

          {!pendingCheck &&
            currentChoices.map((choice) => (
              <button
                key={choice.index}
                onClick={() => handleChoose(choice.index)}
                className="group flex w-full items-center gap-3 rounded-md border border-neutral-800 bg-neutral-900/60 p-3 text-left transition-all duration-150 hover:border-cyan-400/50 hover:bg-neutral-900 hover:shadow-[0_0_18px_-8px_rgba(34,211,238,0.5)]"
              >
                <span className="font-display text-cyan-500/70 transition-colors group-hover:text-cyan-300">
                  ▸
                </span>
                <span className="flex-1 text-neutral-200">{choice.text}</span>
                {choice.check && (
                  <span
                    className={`font-display rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${STAKES_CLASS[choice.check.stakes]}`}
                  >
                    {choice.check.skill} {Math.round(choice.check.probability * 100)}%
                  </span>
                )}
              </button>
            ))}
        </div>
      </div>
    </GameFrame>
  )
}
