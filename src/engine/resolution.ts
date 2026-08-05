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
  const total = roll[0] + roll[1] + skillLevel + attributeModifier + situationalModifier

  return {
    roll,
    total,
    targetNumber,
    success: total >= targetNumber,
    effect: total - targetNumber,
  }
}
