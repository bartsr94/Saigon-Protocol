import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Compiler } from 'inkjs/full'
import { useStoryStore } from './storyStore'
import { useInsightStore } from './insightStore'
import demoStoryJson from '../../content/ink/demo.json'

function compileToJson(inkSource: string): Record<string, unknown> {
  const story = new Compiler(inkSource).Compile()
  return JSON.parse(story.ToJson() as string)
}

const DEMO_INK = `
EXTERNAL is_red_check_consumed(checkId)
EXTERNAL roll_check(insight, targetNumber, checkId, risk)
EXTERNAL damage_composure(amount)

VAR ledger = 0

You approach the checkpoint.
{ledger >= 3: The Ledger hums with leverage.|Nothing useful comes to mind.}

* [Try to talk your way through]
    ~ temp result = roll_check("hustle", 4, "checkpoint-talk", "red")
    { result:
        You bluff your way past.
    - else:
        They see through it.
        ~ damage_composure(1)
    }
    -> done

== done ==
The scene ends.
-> END
`

describe('storyStore', () => {
  beforeEach(() => {
    useInsightStore.setState(useInsightStore.getInitialState(), true)
    useStoryStore.getState().reset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads a story, syncs Insight variables, and surfaces opening text plus the choice', () => {
    useInsightStore.getState().selectArchetype('hustler')
    useInsightStore.getState().spendFreePoint('ledger') // baseline 2 -> 3, crosses the ink conditional's threshold

    useStoryStore.getState().loadStory(compileToJson(DEMO_INK))

    const state = useStoryStore.getState()
    expect(state.currentLines.map((l) => l.text).join(' ')).toContain('You approach the checkpoint.')
    expect(state.currentLines.map((l) => l.text).join(' ')).toContain('The Ledger hums with leverage.')
    expect(state.currentChoices).toHaveLength(1)
    expect(state.ended).toBe(false)
  })

  it('a successful check advances past the branch with no composure damage, and consumes the Red check in insightStore', () => {
    useInsightStore.getState().selectArchetype('hustler') // hustle is the strength insight, baseline 4
    // non-double dice roll (3, 4) so the doubles rule can't override a comfortable success
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.34).mockReturnValueOnce(0.5)

    useStoryStore.getState().loadStory(compileToJson(DEMO_INK))
    useStoryStore.getState().choose(0)

    const composureBefore = useInsightStore.getState().composure.current
    const state = useStoryStore.getState()
    expect(state.currentLines.map((l) => l.text).join(' ')).toContain('You bluff your way past.')
    expect(state.currentLines.map((l) => l.text).join(' ')).toContain('The scene ends.')
    expect(state.lastCheckResult?.success).toBe(true)
    expect(useInsightStore.getState().composure.current).toBe(composureBefore)
    expect(useInsightStore.getState().isRedCheckConsumed('checkpoint-talk')).toBe(true)
  })

  it('a critical failure (natural 2) damages Composure through the wellbeing EXTERNAL, regardless of modifier', () => {
    useInsightStore.getState().selectArchetype('hustler')
    const maxComposure = useInsightStore.getState().composure.max
    // both dice show 1 -> doubles critFail, overriding the +4 hustle modifier
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0)

    useStoryStore.getState().loadStory(compileToJson(DEMO_INK))
    useStoryStore.getState().choose(0)

    const state = useStoryStore.getState()
    expect(state.currentLines.map((l) => l.text).join(' ')).toContain('They see through it.')
    expect(state.lastCheckResult?.doubles).toBe('critFail')
    expect(state.lastCheckResult?.success).toBe(false)
    expect(useInsightStore.getState().composure.current).toBe(maxComposure - 1)
  })

  it('clears lastCheckResult on a later turn that rolls no check, instead of showing a stale result', () => {
    const TWO_TURN_INK = `
EXTERNAL is_red_check_consumed(checkId)
EXTERNAL roll_check(insight, targetNumber, checkId, risk)
EXTERNAL damage_composure(amount)

VAR ledger = 0

Turn one.
* [Roll a check]
    ~ temp result = roll_check("hustle", 4, "turn-one-check", "white")
    Rolled.
    -> next
== next ==
Turn two, no check here.
* [Just continue]
    -> done
== done ==
The end.
-> END
`
    useInsightStore.getState().selectArchetype('hustler')
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.34).mockReturnValueOnce(0.5) // comfortable success, non-double

    useStoryStore.getState().loadStory(compileToJson(TWO_TURN_INK))
    useStoryStore.getState().choose(0) // rolls the check
    expect(useStoryStore.getState().lastCheckResult).not.toBeNull()

    useStoryStore.getState().choose(0) // "Just continue" — no check this turn
    expect(useStoryStore.getState().lastCheckResult).toBeNull()
  })

  it('runs the real compiled demo content end-to-end', () => {
    useInsightStore.getState().selectArchetype('enforcer') // strength: muscleMemory, matching the demo's check
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.34).mockReturnValueOnce(0.5) // non-double, comfortable success

    useStoryStore.getState().loadStory(demoStoryJson)
    const openingState = useStoryStore.getState()
    const opening = openingState.currentLines.map((l) => l.text).join(' ')
    expect(opening).toContain('Rain on corrugated steel.')
    expect(opening).toContain("Muscle Memory clocks the drone's blind spot")
    expect(openingState.currentChoices).toHaveLength(1)

    useStoryStore.getState().choose(0)
    const state = useStoryStore.getState()
    expect(state.currentLines.map((l) => l.text).join(' ')).toContain('The drone hesitates')
    expect(state.currentLines.map((l) => l.text).join(' ')).toContain('The moment passes, one way or another.')
    expect(state.ended).toBe(true)
    expect(useInsightStore.getState().isRedCheckConsumed('checkpoint-stare-down')).toBe(true)
  })

  it('tags an Insight interjection and an NPC line with their respective speakers, per line', () => {
    useInsightStore.getState().selectArchetype('enforcer')
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.34).mockReturnValueOnce(0.5) // non-double, comfortable success

    useStoryStore.getState().loadStory(demoStoryJson)
    const opening = useStoryStore.getState().currentLines

    const insightLine = opening.find((l) => l.text.includes("clocks the drone's blind spot"))
    expect(insightLine?.speaker).toEqual({ type: 'insight', insightId: 'muscleMemory' })

    useStoryStore.getState().choose(0)
    const afterChoice = useStoryStore.getState().currentLines
    const npcLine = afterChoice.find((l) => l.text.includes('steam curling off her collar'))
    expect(npcLine?.speaker).toEqual({ type: 'npc', npcId: 'meiHong' })
  })
})
