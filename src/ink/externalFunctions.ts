import type { Story } from 'inkjs'
import { useCharacterStore } from '../stores/characterStore'
import { resolveSkillCheck, attributeModifier } from '../engine/resolution'
import { attributeForSkill } from '../content/skills'

export function bindExternalFunctions(story: Story): void {
  story.BindExternalFunction(
    'skillCheck',
    (skillName: string, targetNumber: number) => {
      const character = useCharacterStore.getState().character
      const skillLevel = character?.skills.find((s) => s.name === skillName)?.level ?? -3

      const attribute = attributeForSkill(skillName)
      const modifier =
        character && attribute ? attributeModifier(character.attributes[attribute]) : 0

      const result = resolveSkillCheck({
        skillLevel,
        attributeModifier: modifier,
        targetNumber,
      })

      return result.success
    },
  )
}
