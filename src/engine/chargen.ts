import type { Attributes, CharacterState } from '../stores/characterStore'
import type { Archetype } from '../content/archetypes'
import { roll2d6 } from './resolution'

export function rollAttributeSet(): Attributes {
  const roll = () => roll2d6().reduce((a, b) => a + b, 0)

  return {
    strength: roll(),
    dexterity: roll(),
    endurance: roll(),
    intellect: roll(),
    education: roll(),
    socialStanding: roll(),
  }
}

export function buildCharacterFromArchetype(
  name: string,
  attributes: Attributes,
  archetype: Archetype,
): CharacterState {
  const maxHealth = attributes.endurance * 2

  return {
    name,
    attributes,
    skills: archetype.skills,
    careerHistory: [{ career: archetype.career, term: 1, events: [archetype.careerEvent] }],
    equipment: archetype.equipment,
    health: maxHealth,
    maxHealth,
  }
}
