import type { Story } from 'inkjs'
import { resolveSkillCheck } from '../engine/resolution'
import { checkModifiersForSkill } from '../engine/characterCheck'

export function bindExternalFunctions(story: Story): void {
  story.BindExternalFunction(
    'skillCheck',
    (skillName: string, targetNumber: number) => {
      const { skillLevel, attributeModifier } = checkModifiersForSkill(skillName)
      const result = resolveSkillCheck({ skillLevel, attributeModifier, targetNumber })
      return result.success
    },
  )
}
