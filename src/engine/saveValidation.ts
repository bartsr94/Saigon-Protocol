import type { Attributes, CareerEntry, CharacterState, EquipmentItem, Skill } from '../stores/characterStore'
import type { SaveBlob } from '../stores/saveStore'

type UnknownRecord = Record<string, unknown>

const ATTRIBUTE_KEYS: (keyof Attributes)[] = [
  'strength',
  'dexterity',
  'endurance',
  'intellect',
  'education',
  'socialStanding',
]

function invalid(path: string, detail = 'is invalid'): never {
  throw new Error(`Not a valid Saigon Protocol save: ${path} ${detail}.`)
}

function record(value: unknown, path: string): UnknownRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) invalid(path, 'must be an object')
  return value as UnknownRecord
}

function string(value: unknown, path: string): string {
  if (typeof value !== 'string') invalid(path, 'must be a string')
  return value
}

function nullableString(value: unknown, path: string): string | null {
  return value === null ? null : string(value, path)
}

function finite(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) invalid(path, 'must be a finite number')
  return value
}

function boolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') invalid(path, 'must be boolean')
  return value
}

function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) invalid(path, 'must be an array')
  return value
}

function stringArray(value: unknown, path: string): string[] {
  return array(value, path).map((item, index) => string(item, `${path}[${index}]`))
}

function validateBooleanRecord(value: unknown, path: string): Record<string, boolean> {
  const obj = record(value, path)
  for (const [key, entry] of Object.entries(obj)) boolean(entry, `${path}.${key}`)
  return obj as Record<string, boolean>
}

function validateAttributes(value: unknown, path: string): Attributes {
  const obj = record(value, path)
  for (const key of ATTRIBUTE_KEYS) finite(obj[key], `${path}.${key}`)
  return obj as unknown as Attributes
}

function validateSkill(value: unknown, path: string): Skill {
  const skill = record(value, path)
  string(skill.name, `${path}.name`)
  finite(skill.level, `${path}.level`)
  return skill as unknown as Skill
}

function validateCareerEntry(value: unknown, path: string): CareerEntry {
  const entry = record(value, path)
  string(entry.career, `${path}.career`)
  finite(entry.term, `${path}.term`)
  stringArray(entry.events, `${path}.events`)
  return entry as unknown as CareerEntry
}

function validateEquipmentItem(value: unknown, path: string): EquipmentItem {
  const item = record(value, path)
  string(item.name, `${path}.name`)
  finite(item.quantity, `${path}.quantity`)
  return item as unknown as EquipmentItem
}

function validateCharacter(value: unknown, path: string): CharacterState {
  const character = record(value, path)
  string(character.name, `${path}.name`)
  validateAttributes(character.attributes, `${path}.attributes`)
  array(character.skills, `${path}.skills`).forEach((skill, index) =>
    validateSkill(skill, `${path}.skills[${index}]`),
  )
  array(character.careerHistory, `${path}.careerHistory`).forEach((entry, index) =>
    validateCareerEntry(entry, `${path}.careerHistory[${index}]`),
  )
  array(character.equipment, `${path}.equipment`).forEach((item, index) =>
    validateEquipmentItem(item, `${path}.equipment[${index}]`),
  )
  finite(character.health, `${path}.health`)
  finite(character.maxHealth, `${path}.maxHealth`)
  return character as unknown as CharacterState
}

/** Validate a save blob loaded from localStorage before it enters the stores. */
export function validateSaveBlob(value: unknown): SaveBlob {
  const state = record(value, 'save')
  if (state.version !== 1) invalid('save.version', 'is not a supported version')

  const character = state.character === null ? null : validateCharacter(state.character, 'save.character')
  const inkState = nullableString(state.inkState, 'save.inkState')
  const unlockedLocationIds = stringArray(state.unlockedLocationIds, 'save.unlockedLocationIds')
  const selectedLocationId = nullableString(state.selectedLocationId, 'save.selectedLocationId')
  const flags = validateBooleanRecord(state.flags, 'save.flags')

  return {
    version: 1,
    character,
    inkState,
    unlockedLocationIds,
    selectedLocationId,
    flags,
  }
}
