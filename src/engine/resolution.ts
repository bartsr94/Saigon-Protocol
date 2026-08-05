export const CHECK_TIERS = ['critSuccess', 'success', 'failure', 'critFailure'] as const
export type CheckTier = (typeof CHECK_TIERS)[number]

const CRIT_SUCCESS_MARGIN = 5
const CRIT_FAILURE_MARGIN = -5

export function isSuccess(tier: CheckTier): boolean {
  return tier === 'success' || tier === 'critSuccess'
}

function tierFromMargin(margin: number): CheckTier {
  if (margin >= CRIT_SUCCESS_MARGIN) return 'critSuccess'
  if (margin >= 0) return 'success'
  if (margin <= CRIT_FAILURE_MARGIN) return 'critFailure'
  return 'failure'
}

function tierForRoll(natural: number, total: number, targetNumber: number): CheckTier {
  let tier = tierFromMargin(total - targetNumber)
  // A natural 2 is always at least a failure; a natural 12 is always at least a success.
  if (natural === 2 && isSuccess(tier)) tier = 'failure'
  if (natural === 12 && !isSuccess(tier)) tier = 'success'
  return tier
}

export interface SkillCheckParams {
  skillLevel: number
  attributeModifier: number
  targetNumber: number
  situationalModifier?: number
}

export interface SkillCheckResult {
  roll: [number, number]
  total: number
  targetNumber: number
  success: boolean
  effect: number
  tier: CheckTier
}

function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1
}

export function roll2d6(): [number, number] {
  return [rollD6(), rollD6()]
}

export function attributeModifier(value: number): number {
  if (value <= 0) return -3
  if (value <= 2) return -2
  if (value <= 5) return -1
  if (value <= 8) return 0
  if (value <= 11) return 1
  if (value <= 14) return 2
  return 3
}

export function resolveSkillCheck({
  skillLevel,
  attributeModifier,
  targetNumber,
  situationalModifier = 0,
}: SkillCheckParams): SkillCheckResult {
  const roll = roll2d6()
  const natural = roll[0] + roll[1]
  const total = natural + skillLevel + attributeModifier + situationalModifier
  const tier = tierForRoll(natural, total, targetNumber)

  return {
    roll,
    total,
    targetNumber,
    success: isSuccess(tier),
    effect: total - targetNumber,
    tier,
  }
}

/** Pre-roll pass odds for the same modifiers `resolveSkillCheck` would use,
 * enumerated across all 36 fixed 2d6 outcomes so preview odds and the actual
 * roll can never disagree. */
export function passProbability({
  skillLevel,
  attributeModifier,
  targetNumber,
  situationalModifier = 0,
}: SkillCheckParams): number {
  const modifier = skillLevel + attributeModifier + situationalModifier
  let passing = 0

  for (let a = 1; a <= 6; a++) {
    for (let b = 1; b <= 6; b++) {
      const natural = a + b
      const total = natural + modifier
      if (isSuccess(tierForRoll(natural, total, targetNumber))) passing++
    }
  }

  return passing / 36
}
