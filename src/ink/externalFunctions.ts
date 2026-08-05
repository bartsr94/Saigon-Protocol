import type { Story } from 'inkjs'
import { useCharacterStore } from '../stores/characterStore'
import { resolveSkillCheck } from '../engine/resolution'

export function bindExternalFunctions(story: Story): void {
  story.BindExternalFunction(
    'skillCheck',
    (skillName: string, targetNumber: number) => {
      const character = useCharacterStore.getState().character
      const skillLevel = character?.skills.find((s) => s.name === skillName)?.level ?? -3

      const result = resolveSkillCheck({
        skillLevel,
        attributeModifier: 0,
        targetNumber,
      })

      return result.success
    },
  )
}
