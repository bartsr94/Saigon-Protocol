import { create } from 'zustand'
import { useCharacterStore } from './characterStore'
import { ENEMIES } from '../content/enemies'
import type { CheckTier } from '../engine/resolution'
import { attributeModifier } from '../engine/resolution'
import { getPlayerCombatProfile, resolveAttack, rollInitiativeOrder } from '../engine/combat'
import type { AttackOutcome } from '../engine/combat'

export interface Combatant {
  id: string
  name: string
  health: number
  maxHealth: number
  isPlayer: boolean
  attackSkillLevel: number
  attackAttributeModifier: number
  damage: number
  initiativeModifier: number
}

export type CombatResult = 'win' | 'loss' | null

export interface LogEntry {
  id: number
  message: string
  tier?: CheckTier
  dice?: [number, number]
}

interface CombatStore {
  active: boolean
  combatants: Combatant[]
  round: number
  turnOrder: string[]
  currentTurnIndex: number
  log: LogEntry[]
  result: CombatResult
  startCombat: (enemyId: string) => void
  playerAttack: (targetId: string) => void
  endCombat: () => void
}

let nextLogId = 0

function attackMessage(attackerName: string, targetName: string, outcome: AttackOutcome): string {
  if (outcome.tier === 'critSuccess') {
    return `${attackerName} lands a critical hit on ${targetName} for ${outcome.damage}!`
  }
  if (outcome.tier === 'critFailure') {
    return `${attackerName} fumbles the attack on ${targetName}.`
  }
  return outcome.hit
    ? `${attackerName} hits ${targetName} for ${outcome.damage} (rolled ${outcome.total} vs ${outcome.targetNumber}).`
    : `${attackerName} misses ${targetName} (rolled ${outcome.total} vs ${outcome.targetNumber}).`
}

export const useCombatStore = create<CombatStore>((set, get) => {
  const pushLog = (message: string, meta?: { tier?: CheckTier; dice?: [number, number] }) =>
    set((state) => ({ log: [...state.log, { id: nextLogId++, message, ...meta }] }))

  const applyDamage = (id: string, amount: number) => {
    if (amount <= 0) return
    set((state) => ({
      combatants: state.combatants.map((c) =>
        c.id === id ? { ...c, health: Math.max(0, c.health - amount) } : c,
      ),
    }))
    if (id === 'player') useCharacterStore.getState().applyDamage(amount)
  }

  const checkOutcome = (): CombatResult => {
    const state = get()
    const player = state.combatants.find((c) => c.isPlayer)
    const enemiesAlive = state.combatants.some((c) => !c.isPlayer && c.health > 0)

    if (player && player.health <= 0) {
      set({ result: 'loss', active: false })
      pushLog(`${player.name} goes down.`)
      return 'loss'
    }
    if (!enemiesAlive) {
      set({ result: 'win', active: false })
      pushLog('The enemy is down.')
      return 'win'
    }
    return null
  }

  const advanceTurn = () => {
    set((state) => {
      let nextIndex = state.currentTurnIndex
      let round = state.round
      do {
        nextIndex = (nextIndex + 1) % state.turnOrder.length
        if (nextIndex === 0) round += 1
      } while (state.combatants.find((c) => c.id === state.turnOrder[nextIndex])?.health === 0)
      return { currentTurnIndex: nextIndex, round }
    })
  }

  const runEnemyTurns = () => {
    while (true) {
      const state = get()
      if (!state.active || state.result) return

      const currentId = state.turnOrder[state.currentTurnIndex]
      if (currentId === 'player') return

      const enemy = state.combatants.find((c) => c.id === currentId)
      const player = state.combatants.find((c) => c.isPlayer)
      if (!enemy || !player) return

      const outcome = resolveAttack(enemy)
      applyDamage('player', outcome.damage)
      pushLog(attackMessage(enemy.name, player.name, outcome), {
        tier: outcome.tier,
        dice: outcome.dice,
      })

      if (checkOutcome()) return
      advanceTurn()
    }
  }

  return {
    active: false,
    combatants: [],
    round: 0,
    turnOrder: [],
    currentTurnIndex: 0,
    log: [],
    result: null,

    startCombat: (enemyId) => {
      const character = useCharacterStore.getState().character
      const enemyTemplate = ENEMIES[enemyId]
      if (!character || !enemyTemplate) return

      const playerProfile = getPlayerCombatProfile(character)

      const player: Combatant = {
        id: 'player',
        name: character.name,
        health: character.health,
        maxHealth: character.maxHealth,
        isPlayer: true,
        initiativeModifier: attributeModifier(character.attributes.dexterity),
        ...playerProfile,
      }

      const enemy: Combatant = {
        id: enemyTemplate.id,
        name: enemyTemplate.name,
        health: enemyTemplate.maxHealth,
        maxHealth: enemyTemplate.maxHealth,
        isPlayer: false,
        initiativeModifier: enemyTemplate.initiativeModifier,
        attackSkillLevel: enemyTemplate.attackSkillLevel,
        attackAttributeModifier: enemyTemplate.attackAttributeModifier,
        damage: enemyTemplate.damage,
      }

      const combatants = [player, enemy]
      const turnOrder = rollInitiativeOrder(combatants)
      const first = combatants.find((c) => c.id === turnOrder[0])

      set({
        active: true,
        combatants,
        round: 1,
        turnOrder,
        currentTurnIndex: 0,
        log: [{ id: nextLogId++, message: `${first?.name ?? 'Combat'} acts first.` }],
        result: null,
      })

      runEnemyTurns()
    },

    playerAttack: (targetId) => {
      const state = get()
      if (!state.active || state.result) return
      if (state.turnOrder[state.currentTurnIndex] !== 'player') return

      const attacker = state.combatants.find((c) => c.isPlayer)
      const target = state.combatants.find((c) => c.id === targetId)
      if (!attacker || !target || target.health <= 0) return

      const outcome = resolveAttack(attacker)
      applyDamage(targetId, outcome.damage)
      pushLog(attackMessage(attacker.name, target.name, outcome), {
        tier: outcome.tier,
        dice: outcome.dice,
      })

      if (checkOutcome()) return
      advanceTurn()
      runEnemyTurns()
    },

    endCombat: () =>
      set({
        active: false,
        combatants: [],
        round: 0,
        turnOrder: [],
        currentTurnIndex: 0,
        log: [],
        result: null,
      }),
  }
})
