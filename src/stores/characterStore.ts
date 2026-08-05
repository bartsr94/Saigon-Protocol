import { create } from 'zustand'

export interface Attributes {
  strength: number
  dexterity: number
  endurance: number
  intellect: number
  education: number
  socialStanding: number
}

export interface Skill {
  name: string
  level: number
}

export interface CareerEntry {
  career: string
  term: number
  events: string[]
}

export interface EquipmentItem {
  name: string
  quantity: number
}

export interface CharacterState {
  name: string
  attributes: Attributes
  skills: Skill[]
  careerHistory: CareerEntry[]
  equipment: EquipmentItem[]
  health: number
  maxHealth: number
}

interface CharacterStore {
  character: CharacterState | null
  setCharacter: (character: CharacterState) => void
  applyDamage: (amount: number) => void
}

export const useCharacterStore = create<CharacterStore>((set) => ({
  character: null,
  setCharacter: (character) => set({ character }),
  applyDamage: (amount) =>
    set((state) =>
      state.character
        ? {
            character: {
              ...state.character,
              health: Math.max(0, state.character.health - amount),
            },
          }
        : state,
    ),
}))
