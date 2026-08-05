import { create } from 'zustand'

export interface Combatant {
  id: string
  name: string
  health: number
  maxHealth: number
  isPlayer: boolean
}

interface CombatStore {
  active: boolean
  combatants: Combatant[]
  round: number
  turnOrder: string[]
  startCombat: (combatants: Combatant[]) => void
  endCombat: () => void
  advanceRound: () => void
}

export const useCombatStore = create<CombatStore>((set) => ({
  active: false,
  combatants: [],
  round: 0,
  turnOrder: [],

  startCombat: (combatants) =>
    set({
      active: true,
      combatants,
      round: 1,
      turnOrder: combatants.map((c) => c.id),
    }),

  endCombat: () => set({ active: false, combatants: [], round: 0, turnOrder: [] }),

  advanceRound: () => set((state) => ({ round: state.round + 1 })),
}))
