import { useStoryStore } from '../../stores/storyStore'
import { useNavigationStore } from '../../stores/navigationStore'
import { GameFrame } from '../ui/GameFrame'

export function StoryScreen() {
  const currentText = useStoryStore((state) => state.currentText)
  const currentChoices = useStoryStore((state) => state.currentChoices)
  const choose = useStoryStore((state) => state.choose)
  const selectLocation = useNavigationStore((state) => state.selectLocation)

  return (
    <GameFrame>
      <div className="mx-auto flex max-w-2xl flex-col">
        <button
          onClick={() => selectLocation(null)}
          className="font-display self-start text-xs uppercase tracking-wider text-neutral-500 transition-colors hover:text-cyan-300"
        >
          ◄ Back
        </button>

        <div className="mt-6 space-y-4 border-l-2 border-cyan-400/20 pl-5">
          {currentText.map((paragraph, index) => (
            <p key={index} className="leading-relaxed text-neutral-200">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-8 space-y-2">
          {currentChoices.map((choice) => (
            <button
              key={choice.index}
              onClick={() => choose(choice.index)}
              className="group flex w-full items-center gap-3 rounded-md border border-neutral-800 bg-neutral-900/60 p-3 text-left transition-all duration-150 hover:border-cyan-400/50 hover:bg-neutral-900 hover:shadow-[0_0_18px_-8px_rgba(34,211,238,0.5)]"
            >
              <span className="font-display text-cyan-500/70 transition-colors group-hover:text-cyan-300">
                ▸
              </span>
              <span className="text-neutral-200">{choice.text}</span>
            </button>
          ))}
        </div>
      </div>
    </GameFrame>
  )
}
