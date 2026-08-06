// Core dice math for GDD §3 "Resolution": 2d6 + Insight modifier vs target number.
// Pure and deterministic given its inputs — the only place dice math lives (Architecture §2).

export type Die = 1 | 2 | 3 | 4 | 5 | 6

export type DoublesResult = 'critSuccess' | 'critFail' | null

export interface CheckResult {
  dice: [Die, Die]
  diceTotal: number
  modifier: number
  total: number
  targetNumber: number
  doubles: DoublesResult
  success: boolean
}

/** Returns a float in [0, 1). Swap in a seeded generator in tests for determinism. */
export type RandomSource = () => number

function rollDie(random: RandomSource): Die {
  return (Math.floor(random() * 6) + 1) as Die
}

/**
 * Resolves a single 2d6 + modifier vs targetNumber check.
 * Doubles are decisive (GDD §3): natural 12 always succeeds, natural 2 always fails,
 * regardless of modifier or target number.
 */
export function resolveCheck(
  modifier: number,
  targetNumber: number,
  random: RandomSource = Math.random,
): CheckResult {
  const dice: [Die, Die] = [rollDie(random), rollDie(random)]
  const diceTotal = dice[0] + dice[1]
  const total = diceTotal + modifier

  const doubles: DoublesResult =
    diceTotal === 12 ? 'critSuccess' : diceTotal === 2 ? 'critFail' : null

  const success =
    doubles === 'critSuccess' ? true : doubles === 'critFail' ? false : total >= targetNumber

  return { dice, diceTotal, modifier, total, targetNumber, doubles, success }
}
