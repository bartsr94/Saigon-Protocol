import { assertUniqueIds } from './uniqueId'

export interface EnemyTemplate {
  id: string
  name: string
  maxHealth: number
  attackSkillLevel: number
  attackAttributeModifier: number
  damage: number
  initiativeModifier: number
}

export const ENEMIES: Record<string, EnemyTemplate> = {
  'corpo-enforcer': {
    id: 'corpo-enforcer',
    name: 'Corpo Enforcer',
    maxHealth: 10,
    attackSkillLevel: 1,
    attackAttributeModifier: 1,
    damage: 3,
    initiativeModifier: 1,
  },
}

assertUniqueIds('enemy', Object.values(ENEMIES), (e) => e.id)
