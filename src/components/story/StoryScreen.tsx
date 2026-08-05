import { useStoryStore } from '../../stores/storyStore'
import { useNavigationStore } from '../../stores/navigationStore'

export function StoryScreen() {
  const currentText = useStoryStore((state) => state.currentText)
  const currentChoices = useStoryStore((state) => state.currentChoices)
  const choose = useStoryStore((state) => state.choose)
  const selectLocation = useNavigationStore((state) => state.selectLocation)

  return (
    <div className="min-h-svh bg-neutral-950 text-neutral-100 p-8 flex flex-col">
      <div className="mx-auto max-w-2xl w-full flex-1">
        <button
          onClick={() => selectLocation(null)}
          className="text-sm text-neutral-500 hover:text-neutral-300"
        >
          ← Back
        </button>

        <div className="mt-6 space-y-4">
          {currentText.map((paragraph, index) => (
            <p key={index} className="text-neutral-200 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-8 space-y-2">
          {currentChoices.map((choice) => (
            <button
              key={choice.index}
              onClick={() => choose(choice.index)}
              className="block w-full text-left rounded-lg border border-neutral-800 bg-neutral-900 p-3 hover:border-neutral-600 hover:bg-neutral-800 transition-colors"
            >
              {choice.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
