// Dev harness only — exercises storyStore + storyEngine (the ink<->TS boundary)
// end to end before any real Story Engine screen gets built on top of them.
// Loading is driven by NavigationHarness (Architecture §2's Overworld->Story
// Engine handoff) — this component only renders the active run and its exits.

import { useInsightStore } from '../../stores/insightStore'
import { useStoryStore } from '../../stores/storyStore'
import { useNavigationStore } from '../../stores/navigationStore'
import demoStoryJson from '../../../content/ink/demo.json'

export function StoryHarness() {
  const archetype = useInsightStore((s) => s.archetype)
  const vitality = useInsightStore((s) => s.vitality)
  const composure = useInsightStore((s) => s.composure)
  const story = useStoryStore()
  const returnToOverworld = useNavigationStore((s) => s.returnToOverworld)

  if (!archetype) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-sm text-neutral-500">
        Pick an archetype above to enable the story demo.
      </div>
    )
  }

  function handleReturnToOverworld() {
    returnToOverworld()
    story.reset()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-200">Story demo (content/ink/demo.ink)</h2>
        <div className="flex gap-2">
          <button
            className="rounded border border-emerald-500 px-3 py-1 text-xs text-emerald-300"
            onClick={() => story.loadStory(demoStoryJson)}
          >
            Restart
          </button>
          <button className="rounded border border-neutral-700 px-3 py-1 text-xs" onClick={handleReturnToOverworld}>
            Return to Overworld
          </button>
        </div>
      </div>

      <p className="text-xs text-neutral-500">
        Vitality {vitality.current}/{vitality.max} · Composure {composure.current}/{composure.max}
      </p>

      {story.story && (
        <div className="space-y-4 rounded border border-neutral-800 p-4">
          <div className="space-y-2 text-sm text-neutral-200">
            {story.currentText.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>

          {story.currentChoices.length > 0 && (
            <div className="flex flex-col gap-2">
              {story.currentChoices.map((choice) => (
                <button
                  key={choice.index}
                  className="rounded border border-neutral-700 p-2 text-left text-sm hover:border-emerald-400"
                  onClick={() => story.choose(choice.index)}
                >
                  {choice.text}
                </button>
              ))}
            </div>
          )}

          {story.ended && <p className="text-xs text-neutral-500">— scene ended —</p>}

          {story.lastCheckResult && (
            <p className="font-mono text-xs text-neutral-400">
              [{story.lastCheckResult.dice[0]}][{story.lastCheckResult.dice[1]}] ={' '}
              {story.lastCheckResult.diceTotal} + {story.lastCheckResult.modifier} mod = {story.lastCheckResult.total}{' '}
              vs TN {story.lastCheckResult.targetNumber} ▸{' '}
              <span className={story.lastCheckResult.success ? 'text-emerald-400' : 'text-red-400'}>
                {story.lastCheckResult.success ? 'SUCCESS' : 'FAILURE'}
              </span>
              {story.lastCheckResult.doubles && <span className="text-yellow-400"> ({story.lastCheckResult.doubles})</span>}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
