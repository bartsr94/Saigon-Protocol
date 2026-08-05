import { useCharacterStore } from '../stores/characterStore'
import { attributeForSkill } from '../content/skills'
import { attributeModifier } from './resolution'

export interface CheckModifiers {
  skillLevel: number
  attributeModifier: number
}

export function checkModifiersForSkill(skillName: string): CheckModifiers {
  const character = useCharacterStore.getState().character
  const skillLevel = character?.skills.find((s) => s.name === skillName)?.level ?? -3

  const attribute = attributeForSkill(skillName)
  const modifier = character && attribute ? attributeModifier(character.attributes[attribute]) : 0

  return { skillLevel, attributeModifier: modifier }
}
