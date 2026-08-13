import { describe, expect, it, vi } from 'vitest'
import { Compiler } from 'inkjs/full'
import type { Story } from 'inkjs'
import { bindCasefileFunctions, bindCheckFunctions, bindThoughtFunctions, bindWellbeingFunctions, syncInsightVariables } from './storyEngine'
import type { CheckResult } from './checkResolution'
import { INSIGHT_IDS, type InsightId } from '../content/insights'

function compile(inkSource: string): Story {
  return new Compiler(inkSource).Compile()
}

function runToEnd(story: Story): string {
  let text = ''
  while (story.canContinue) {
    text += story.Continue()
  }
  return text
}

function fakeResult(success: boolean): CheckResult {
  return { dice: [3, 3], diceTotal: 6, modifier: 0, total: 6, targetNumber: 6, doubles: null, success }
}

describe('bindCheckFunctions', () => {
  const CHECK_INK = `
EXTERNAL is_red_check_consumed(checkId)
EXTERNAL roll_check(insight, targetNumber, checkId, risk)

~ temp already = is_red_check_consumed("test-check")
{already: Already consumed.|Not consumed yet.}
~ temp result = roll_check("muscleMemory", 6, "test-check", "white")
{result: Success!|Failure!}
-> END
`

  it('wires is_red_check_consumed and roll_check to the given handlers, exposing the full result via onCheckResult', () => {
    const story = compile(CHECK_INK)
    const rollCheck = vi.fn().mockReturnValue(fakeResult(true))
    const onCheckResult = vi.fn()
    bindCheckFunctions(story, {
      isRedCheckConsumed: vi.fn().mockReturnValue(false),
      rollCheck,
      onCheckResult,
    })

    const text = runToEnd(story)

    expect(text).toContain('Not consumed yet.')
    expect(text).toContain('Success!')
    expect(rollCheck).toHaveBeenCalledWith('muscleMemory', 6, 'test-check', 'white')
    expect(onCheckResult).toHaveBeenCalledWith(fakeResult(true))
  })

  it('returns false to ink and skips onCheckResult when rollCheck returns null (consumed Red check)', () => {
    const story = compile(CHECK_INK)
    const onCheckResult = vi.fn()
    bindCheckFunctions(story, {
      isRedCheckConsumed: vi.fn().mockReturnValue(true),
      rollCheck: vi.fn().mockReturnValue(null),
      onCheckResult,
    })

    const text = runToEnd(story)

    expect(text).toContain('Already consumed.')
    expect(text).toContain('Failure!')
    expect(onCheckResult).not.toHaveBeenCalled()
  })

  it('throws when ink passes an unknown insight name', () => {
    const story = compile(`
EXTERNAL roll_check(insight, targetNumber, checkId, risk)
~ temp result = roll_check("not_a_real_insight", 6, "x", "white")
-> END
`)
    bindCheckFunctions(story, { isRedCheckConsumed: vi.fn(), rollCheck: vi.fn() })

    expect(() => runToEnd(story)).toThrow(/unknown insight/)
  })

  it('throws when ink passes an unknown risk', () => {
    const story = compile(`
EXTERNAL roll_check(insight, targetNumber, checkId, risk)
~ temp result = roll_check("muscleMemory", 6, "x", "purple")
-> END
`)
    bindCheckFunctions(story, { isRedCheckConsumed: vi.fn(), rollCheck: vi.fn() })

    expect(() => runToEnd(story)).toThrow(/unknown risk/)
  })
})

describe('bindWellbeingFunctions', () => {
  it('wires damage/heal externals to the given handlers', () => {
    const story = compile(`
EXTERNAL damage_vitality(amount)
EXTERNAL heal_composure(amount)
~ damage_vitality(2)
~ heal_composure(1)
Done.
-> END
`)
    const damageVitality = vi.fn()
    const healComposure = vi.fn()
    bindWellbeingFunctions(story, {
      damageVitality,
      healVitality: vi.fn(),
      damageComposure: vi.fn(),
      healComposure,
    })

    runToEnd(story)

    expect(damageVitality).toHaveBeenCalledWith(2)
    expect(healComposure).toHaveBeenCalledWith(1)
  })
})

describe('bindCasefileFunctions', () => {
  it('wires gain_evidence, unlock_note, and set_case_flag to the given handlers', () => {
    const story = compile(`
EXTERNAL gain_evidence(id)
EXTERNAL unlock_note(id)
EXTERNAL set_case_flag(flag)
~ gain_evidence("drone-log")
~ unlock_note("note-01")
~ set_case_flag("checkpoint-inner-wing-unlocked")
Done.
-> END
`)
    const gainEvidence = vi.fn()
    const unlockNote = vi.fn()
    const setCaseFlag = vi.fn()
    bindCasefileFunctions(story, { gainEvidence, unlockNote, setCaseFlag })

    runToEnd(story)

    expect(gainEvidence).toHaveBeenCalledWith('drone-log')
    expect(unlockNote).toHaveBeenCalledWith('note-01')
    expect(setCaseFlag).toHaveBeenCalledWith('checkpoint-inner-wing-unlocked')
  })

  it('throws when ink passes an unknown evidence id', () => {
    const story = compile(`
EXTERNAL gain_evidence(id)
~ gain_evidence("not-a-real-item")
-> END
`)
    bindCasefileFunctions(story, { gainEvidence: vi.fn(), unlockNote: vi.fn(), setCaseFlag: vi.fn() })

    expect(() => runToEnd(story)).toThrow(/unknown evidence id/)
  })

  it('throws when ink passes an unknown note id', () => {
    const story = compile(`
EXTERNAL unlock_note(id)
~ unlock_note("not-a-real-note")
-> END
`)
    bindCasefileFunctions(story, { gainEvidence: vi.fn(), unlockNote: vi.fn(), setCaseFlag: vi.fn() })

    expect(() => runToEnd(story)).toThrow(/unknown note id/)
  })

  it('accepts any non-empty flag name, since flags are not a closed content set', () => {
    const story = compile(`
EXTERNAL set_case_flag(flag)
~ set_case_flag("some-brand-new-flag")
-> END
`)
    const setCaseFlag = vi.fn()
    bindCasefileFunctions(story, { gainEvidence: vi.fn(), unlockNote: vi.fn(), setCaseFlag })

    runToEnd(story)

    expect(setCaseFlag).toHaveBeenCalledWith('some-brand-new-flag')
  })
})

describe('bindThoughtFunctions', () => {
  it('wires unlock_thought to the given handler', () => {
    const story = compile(`
EXTERNAL unlock_thought(id)
~ unlock_thought("checkpoint-improviser")
Done.
-> END
`)
    const unlockThought = vi.fn()
    bindThoughtFunctions(story, { unlockThought, isThoughtEnabled: vi.fn() })

    runToEnd(story)

    expect(unlockThought).toHaveBeenCalledWith('checkpoint-improviser')
  })

  it('lets ink query has_thought directly inside a conditional, same pattern as is_red_check_consumed', () => {
    const story = compile(`
EXTERNAL has_thought(id)
{has_thought("company-man-doubt"): Enabled.|Not enabled.}
-> END
`)
    bindThoughtFunctions(story, { unlockThought: vi.fn(), isThoughtEnabled: vi.fn().mockReturnValue(true) })

    expect(runToEnd(story)).toContain('Enabled.')
  })

  it('throws when ink passes an unknown thought id', () => {
    const story = compile(`
EXTERNAL unlock_thought(id)
~ unlock_thought("not-a-real-thought")
-> END
`)
    bindThoughtFunctions(story, { unlockThought: vi.fn(), isThoughtEnabled: vi.fn() })

    expect(() => runToEnd(story)).toThrow(/unknown thought id/)
  })
})

describe('syncInsightVariables', () => {
  const levels = Object.fromEntries(INSIGHT_IDS.map((id) => [id, 0])) as Record<InsightId, number>

  it('does not throw against a story with no declared variables', () => {
    const story = compile(`Hello.\n-> END`)
    expect(() => syncInsightVariables(story, levels, null)).not.toThrow()
  })

  it('pushes declared Insight variables so ink conditionals can read them', () => {
    const story = compile(`
VAR ledger = 0
{ledger >= 3: High ledger.|Low ledger.}
-> END
`)
    syncInsightVariables(story, { ...levels, ledger: 5 }, null)
    expect(runToEnd(story)).toContain('High ledger.')
  })

  it('skips undeclared variables and still writes the ones the story did declare', () => {
    const story = compile(`
VAR muscle_memory = 0
{muscle_memory >= 2: Strong.|Weak.}
-> END
`)
    expect(() => syncInsightVariables(story, { ...levels, muscleMemory: 4 }, null)).not.toThrow()
    expect(runToEnd(story)).toContain('Strong.')
  })

  it('pushes archetype when declared', () => {
    const story = compile(`
VAR archetype = ""
{archetype == "enforcer": Enforcer path.|Other path.}
-> END
`)
    syncInsightVariables(story, levels, 'enforcer')
    expect(runToEnd(story)).toContain('Enforcer path.')
  })
})
