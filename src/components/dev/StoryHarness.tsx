// Dev harness only — exercises storyStore + storyEngine (the ink<->TS boundary)
// end to end before any real Story Engine screen gets built on top of them.
// Loading is driven by NavigationHarness (Architecture §2's Overworld->Story
// Engine handoff) — this component only renders the active run and its exits.

import { useInsightStore } from '../../stores/insightStore'
import { useStoryStore } from '../../stores/storyStore'
import { useNavigationStore } from '../../stores/navigationStore'
import demoStoryJson from '../../../content/ink/demo.json'
import { CheckResultBlock, ChoiceRow, CyberButton, Panel, PipTrack } from '../ui'

export function StoryHarness() {
  const archetype = useInsightStore((s) => s.archetype)
  const vitality = useInsightStore((s) => s.vitality)
  const composure = useInsightStore((s) => s.composure)
  const story = useStoryStore()
  const returnToOverworld = useNavigationStore((s) => s.returnToOverworld)

  if (!archetype) {
    return <div className="mx-auto max-w-2xl p-8 font-body text-sm text-white/50">Pick an archetype above to enable the story demo.</div>
  }

  function handleReturnToOverworld() {
    returnToOverworld()
    story.reset()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-chrome-primary">
          Story demo (content/ink/demo.ink)
        </h2>
        <div className="flex gap-2">
          <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={() => story.loadStory(demoStoryJson)}>
            Restart
          </CyberButton>
          <CyberButton className="!px-3 !py-1.5 !text-xs" onClick={handleReturnToOverworld}>
            Return to Overworld
          </CyberButton>
        </div>
      </div>

      <div className="flex gap-6">
        <PipTrack label="VITALITY" current={vitality.current} max={vitality.max} color="var(--color-vitality)" />
        <PipTrack label="COMPOSURE" current={composure.current} max={composure.max} color="var(--color-composure)" />
      </div>

      {story.story && (
        <Panel size="lg" className="space-y-4 p-4">
          <div className="space-y-2 font-body text-base text-white">
            {story.currentText.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>

          {story.currentChoices.length > 0 && (
            <div className="flex flex-col divide-y divide-white/10 border-t border-white/10">
              {story.currentChoices.map((choice) => (
                <ChoiceRow key={choice.index} onClick={() => story.choose(choice.index)}>
                  {choice.text}
                </ChoiceRow>
              ))}
            </div>
          )}

          {story.ended && <p className="font-body text-xs text-white/50">— scene ended —</p>}

          {story.lastCheckResult && <CheckResultBlock insightName="CHECK" result={story.lastCheckResult} />}
        </Panel>
      )}
    </div>
  )
}
