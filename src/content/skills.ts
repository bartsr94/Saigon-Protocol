import type { Attributes } from '../stores/characterStore'

export interface SkillDefinition {
  name: string
  attribute: keyof Attributes
}

export const SKILLS: SkillDefinition[] = [
  { name: 'Athletics', attribute: 'strength' },
  { name: 'Melee', attribute: 'strength' },
  { name: 'Gun Combat', attribute: 'dexterity' },
  { name: 'Heavy Weapons', attribute: 'dexterity' },
  { name: 'Stealth', attribute: 'dexterity' },
  { name: 'Drive', attribute: 'dexterity' },
  { name: 'Pilot', attribute: 'dexterity' },
  { name: 'Survival', attribute: 'endurance' },
  { name: 'Recon', attribute: 'intellect' },
  { name: 'Streetwise', attribute: 'intellect' },
  { name: 'Deception', attribute: 'intellect' },
  { name: 'Tactics', attribute: 'intellect' },
  { name: 'Investigate', attribute: 'intellect' },
  { name: 'Gambler', attribute: 'intellect' },
  { name: 'Medic', attribute: 'education' },
  { name: 'Mechanic', attribute: 'education' },
  { name: 'Electronics', attribute: 'education' },
  { name: 'Hacking', attribute: 'education' },
  { name: 'Admin', attribute: 'education' },
  { name: 'Persuade', attribute: 'socialStanding' },
  { name: 'Bribery', attribute: 'socialStanding' },
  { name: 'Leadership', attribute: 'socialStanding' },
]

export function attributeForSkill(skillName: string): keyof Attributes | null {
  return SKILLS.find((skill) => skill.name === skillName)?.attribute ?? null
}
