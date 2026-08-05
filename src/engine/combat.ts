import type { CharacterState } from '../stores/characterStore'
import { attributeForSkill } from '../content/skills'
import type { CheckTier } from './resolution'
import { attributeModifier, resolveSkillCheck, roll2d6 } from './resolution'

const ATTACK_TARGET_NUMBER = 8

const COMBAT_SKILLS = [
  { name: 'Heavy Weapons', damage: 4 },
  { name: 'Gun Combat', damage: 3 },
  { name: 'Melee', damage: 2 },
]

export interface CombatProfile {
  attackSkillLevel: number
  attackAttributeModifier: number
  damage: number
}

export function getPlayerCombatProfile(character: CharacterState): CombatProfile {
  for (const combatSkill of COMBAT_SKILLS) {
    const skill = character.skills.find((s) => s.name === combatSkill.name)
    if (!skill) continue

    const attribute = attributeForSkill(combatSkill.name) ?? 'dexterity'

    return {
      attackSkillLevel: skill.level,
      attackAttributeModifier: attributeModifier(character.attributes[attribute]),
      damage: combatSkill.damage,
    }
  }

  return {
    attackSkillLevel: -3,
    attackAttributeModifier: attributeModifier(character.attributes.strength),
    damage: 1,
  }
}

export function rollInitiativeOrder(
  combatants: { id: string; initiativeModifier: number }[],
): string[] {
  return combatants
    .map((c) => ({
      id: c.id,
      roll: roll2d6().reduce((a, b) => a + b, 0) + c.initiativeModifier,
    }))
    .sort((a, b) => b.roll - a.roll)
    .map((c) => c.id)
}

export interface AttackOutcome {
  hit: boolean
  damage: number
  total: number
  targetNumber: number
  tier: CheckTier
  dice: [number, number]
}

export function resolveAttack(attacker: CombatProfile): AttackOutcome {
  const result = resolveSkillCheck({
    skillLevel: attacker.attackSkillLevel,
    attributeModifier: attacker.attackAttributeModifier,
    targetNumber: ATTACK_TARGET_NUMBER,
  })

  return {
    hit: result.success,
    damage: result.success ? attacker.damage : 0,
    total: result.total,
    targetNumber: result.targetNumber,
    tier: result.tier,
    dice: result.roll,
  }
}
