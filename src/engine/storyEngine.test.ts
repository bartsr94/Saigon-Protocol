import { describe, expect, it, vi } from 'vitest'
import { Compiler } from 'inkjs/full'
import type { Story } from 'inkjs'
import { bindCheckFunctions, bindWellbeingFunctions, syncInsightVariables } from './storyEngine'
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
