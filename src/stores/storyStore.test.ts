import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Compiler } from 'inkjs/full'
import { useStoryStore } from './storyStore'
import { useInsightStore } from './insightStore'
import introStoryJson from '../../content/ink/intro.json'

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

const TEST_FIXTURE_INK = `
EXTERNAL is_red_check_consumed(checkId)
EXTERNAL roll_check(insight, targetNumber, checkId, risk)
EXTERNAL damage_vitality(amount)
EXTERNAL heal_vitality(amount)
EXTERNAL damage_composure(amount)
EXTERNAL heal_composure(amount)

VAR ledger = 0
VAR graft = 0
VAR muscle_memory = 0
VAR root = 0
VAR static = 0
VAR hustle = 0
VAR mask = 0
VAR archetype = ""

Rain on corrugated steel. A checkpoint drone hovers at eye level, its lens hunting your face against a watchlist you're pretty sure you're on.
{ muscle_memory >= 3:
    Muscle Memory clocks the drone's blind spot before you've finished the thought. # speaker: insight:muscleMemory
- else:
    You don't know this model. You don't like that.
}

{ is_red_check_consumed("checkpoint-stare-down"):
    The drone's already made its decision about you. No talking your way past it twice.
    -> done
- else:
    * [Hold still and stare it down. # insight: muscleMemory # check: red]
        ~ temp result = roll_check("muscleMemory", 7, "checkpoint-stare-down", "red")
        { result:
            The drone hesitates, logs you as low-priority, and drifts off down the alley.
        - else:
            It doesn't blink. A second drone drops in behind you, and your pulse spikes hard enough to feel it in your teeth.
            ~ damage_composure(1)
        }
        -> done
}

== done ==
Mei Hong steps out of a noodle stall's steam, steam curling off her collar. "You made it past the checkpoint, detective. Rare, these days." # speaker: npc:meiHong
The moment passes, one way or another.
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

  it('records activeTopicsKnot for a conversation-mode session, and clears it in scene mode or on reset', () => {
    useStoryStore.getState().loadStory(compileToJson(DEMO_INK), undefined, 'checkpoint', {
      mode: 'conversation',
      topicsKnot: 'done',
      entryKnot: 'done',
    })
    expect(useStoryStore.getState().activeTopicsKnot).toBe('done')

    useStoryStore.getState().loadStory(compileToJson(DEMO_INK), undefined, 'checkpoint', { mode: 'scene' })
    expect(useStoryStore.getState().activeTopicsKnot).toBeNull()

    useStoryStore.getState().loadStory(compileToJson(DEMO_INK), undefined, 'checkpoint', {
      mode: 'conversation',
      topicsKnot: 'done',
      entryKnot: 'done',
    })
    useStoryStore.getState().reset()
    expect(useStoryStore.getState().activeTopicsKnot).toBeNull()
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

  it('runs the full story-engine wiring fixture end-to-end', () => {
    useInsightStore.getState().selectArchetype('enforcer') // strength: muscleMemory, matching the demo's check
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.34).mockReturnValueOnce(0.5) // non-double, comfortable success

    useStoryStore.getState().loadStory(compileToJson(TEST_FIXTURE_INK))
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

  it('loadStory with a saved ink state restores choices and mechanical state without re-running past it', () => {
    useInsightStore.getState().selectArchetype('hustler')
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.34).mockReturnValueOnce(0.5) // comfortable success, non-double

    useStoryStore.getState().loadStory(compileToJson(DEMO_INK))
    const savedStateJson = useStoryStore.getState().story!.state.ToJson()

    useStoryStore.getState().reset()
    useInsightStore.setState(useInsightStore.getInitialState(), true) // simulate a fresh session before restoring

    useStoryStore.getState().loadStory(compileToJson(DEMO_INK), savedStateJson)
    const restored = useStoryStore.getState()
    expect(restored.currentChoices).toHaveLength(1)
    expect(restored.ended).toBe(false)
    expect(restored.canContinue).toBe(false)

    // The restored batch collapses to a single block rather than the original
    // per-line speaker breakdown — the documented save/restore simplification.
    expect(restored.currentLines).toHaveLength(1)
  })

  it('tags an Insight interjection and an NPC line with their respective speakers, per line', () => {
    useInsightStore.getState().selectArchetype('enforcer')
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.34).mockReturnValueOnce(0.5) // non-double, comfortable success

    useStoryStore.getState().loadStory(compileToJson(TEST_FIXTURE_INK))
    const opening = useStoryStore.getState().currentLines

    const insightLine = opening.find((l) => l.text.includes("clocks the drone's blind spot"))
    expect(insightLine?.speaker).toEqual({ type: 'insight', insightId: 'muscleMemory' })

    useStoryStore.getState().choose(0)
    const afterChoice = useStoryStore.getState().currentLines
    const npcLine = afterChoice.find((l) => l.text.includes('steam curling off her collar'))
    expect(npcLine?.speaker).toEqual({ type: 'npc', npcId: 'meiHong' })
  })

  it('runs the real compiled intro scene end-to-end, gating Insight interjections by level', () => {
    useInsightStore.getState().selectArchetype('companyMan') // strength: ledger (4), weakness: root (1), static/hustle default (2)

    useStoryStore.getState().loadStory(introStoryJson)
    const opening = useStoryStore.getState().currentLines.map((l) => l.text).join(' ')

    expect(opening).toContain("The squad car pulls out of Cholon's press")
    expect(opening).toContain("That's the whole briefing")
    expect(opening).not.toContain('Cantonese call-and-response')
    expect(opening).not.toContain("That's not a briefing, that's a dare")
    expect(useStoryStore.getState().currentChoices.map((c) => c.text)).toEqual(['Keep driving.'])

    useStoryStore.getState().choose(0)
    const afterDriving = useStoryStore.getState()
    const drivingText = afterDriving.currentLines.map((l) => l.text).join(' ')
    expect(drivingText).toContain('The Ledger has an opinion')
    expect(drivingText).not.toContain('how much water sits on the other side of that wall')
    expect(drivingText).toContain('Two uniforms are posted at the entrance')
    expect(afterDriving.currentChoices.map((c) => c.text)).toEqual(['Head in.'])

    const backgroundLine = afterDriving.currentLines.find((l) => l.text.includes('The lab itself is nothing to look at'))
    expect(backgroundLine?.background).toBe('avelineLabExterior')

    useStoryStore.getState().choose(0)
    const afterHeadIn = useStoryStore.getState()
    const sceneText = afterHeadIn.currentLines.map((l) => l.text).join(' ')
    expect(sceneText).toContain('The Ledger clocks it immediately')
    // The backdrop set before "Head in." isn't re-tagged inside Mei Hong's
    // lines — DialogueScreen is the one that keeps it showing across batches.
    expect(afterHeadIn.currentLines.every((l) => l.background === null)).toBe(true)

    const npcLine = afterHeadIn.currentLines.find((l) => l.text.includes("You're the detective"))
    expect(npcLine?.speaker).toEqual({ type: 'npc', npcId: 'meiHong' })

    expect(afterHeadIn.currentChoices.map((c) => c.text)).toEqual(['Get to work.'])
    useStoryStore.getState().choose(0)
    expect(useStoryStore.getState().ended).toBe(true)
  })

  it('the real intro content carries its music/ambience tags through the same beats as the backdrop', () => {
    useInsightStore.getState().selectArchetype('companyMan')

    useStoryStore.getState().loadStory(introStoryJson)
    const opening = useStoryStore.getState().currentLines
    const openingLine = opening.find((l) => l.text.includes("The squad car pulls out of Cholon's press"))
    expect(openingLine?.music).toBe('introTheme')
    expect(openingLine?.ambienceOps).toEqual({ add: ['engineIdle', 'marketChatter'], remove: [], clear: false })

    useStoryStore.getState().choose(0) // Keep driving.
    const driving = useStoryStore.getState().currentLines
    const floodWallLine = driving.find((l) => l.text.includes('District 4 flood wall rises out of the haze'))
    expect(floodWallLine?.ambienceOps).toEqual({ add: ['rain'], remove: ['marketChatter'], clear: false })
    const arrivalLine = driving.find((l) => l.text.includes('The lab itself is nothing to look at'))
    // No new music tag here — introTheme carries through the drive and
    // arrival as one continuous track (docs/GAME_GUIDE.md).
    expect(arrivalLine?.music).toBeNull()
    expect(arrivalLine?.ambienceOps).toEqual({ add: [], remove: ['engineIdle'], clear: false })

    useStoryStore.getState().choose(0) // Head in.
    const scene = useStoryStore.getState().currentLines
    expect(scene.every((l) => l.voice === null)).toBe(true)
  })

  it('the intro surfaces the Root interjection for a high-Root archetype instead of the Ledger one', () => {
    useInsightStore.getState().selectArchetype('oldSaigon') // strength: root (4), weakness: ledger (1)

    useStoryStore.getState().loadStory(introStoryJson)
    const opening = useStoryStore.getState().currentLines.map((l) => l.text).join(' ')
    expect(opening).toContain('Cantonese call-and-response')

    useStoryStore.getState().choose(0) // Keep driving.
    const drivingText = useStoryStore.getState().currentLines.map((l) => l.text).join(' ')
    expect(drivingText).not.toContain('The Ledger has an opinion')
  })

  it('the intro surfaces the Hustle interjection for a high-Hustle archetype', () => {
    useInsightStore.getState().selectArchetype('hustler') // strength: hustle (4)

    useStoryStore.getState().loadStory(introStoryJson)
    const opening = useStoryStore.getState().currentLines.map((l) => l.text).join(' ')
    expect(opening).toContain("That's not a briefing, that's a dare")
  })

  it('tags per-line music/ambience/voice cues, both on advance() and on restore', () => {
    const AUDIO_INK = `
Squad car pulls out. # music: introTheme # ambience: +engineIdle # ambience: +marketChatter
Flood wall ahead. # ambience: -marketChatter # ambience: +rain
"You're the detective." # voice: meiHongIntro
* [Continue]
    -> END
`
    useInsightStore.getState().selectArchetype('hustler')
    useStoryStore.getState().loadStory(compileToJson(AUDIO_INK))

    const lines = useStoryStore.getState().currentLines
    const opening = lines.find((l) => l.text.includes('Squad car pulls out'))
    expect(opening?.music).toBe('introTheme')
    expect(opening?.ambienceOps).toEqual({ add: ['engineIdle', 'marketChatter'], remove: [], clear: false })

    const floodWall = lines.find((l) => l.text.includes('Flood wall ahead'))
    expect(floodWall?.music).toBeNull()
    expect(floodWall?.ambienceOps).toEqual({ add: ['rain'], remove: ['marketChatter'], clear: false })

    const voicedLine = lines.find((l) => l.text.includes("You're the detective"))
    expect(voicedLine?.voice).toBe('meiHongIntro')
    expect(opening?.voice).toBeNull()

    // Restore path: the batch collapses to one block (documented save/restore
    // simplification), tagged from whatever currentTags the story holds at
    // that flattened point — same dual-parse requirement as background/speaker.
    const savedStateJson = useStoryStore.getState().story!.state.ToJson()
    useStoryStore.getState().reset()
    useStoryStore.getState().loadStory(compileToJson(AUDIO_INK), savedStateJson)
    const restored = useStoryStore.getState().currentLines
    expect(restored).toHaveLength(1)
    expect(restored[0].voice).toBe('meiHongIntro')
  })

  it('the intro surfaces the Static interjection once free points push it past the threshold', () => {
    useInsightStore.getState().selectArchetype('hustler') // ledger/root/static all default (2)
    useInsightStore.getState().spendFreePoint('static') // 2 -> 3, crosses the ink conditional's threshold

    useStoryStore.getState().loadStory(introStoryJson)
    useStoryStore.getState().choose(0) // Keep driving.
    const drivingText = useStoryStore.getState().currentLines.map((l) => l.text).join(' ')

    expect(drivingText).toContain('how much water sits on the other side of that wall')
  })
})
