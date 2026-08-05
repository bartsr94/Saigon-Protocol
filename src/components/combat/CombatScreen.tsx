import { useEffect, useRef } from 'react'
import { useCombatStore } from '../../stores/combatStore'
import { useStoryStore } from '../../stores/storyStore'

interface CombatScreenProps {
  enemyId: string
}

export function CombatScreen({ enemyId }: CombatScreenProps) {
  const active = useCombatStore((state) => state.active)
  const combatants = useCombatStore((state) => state.combatants)
  const turnOrder = useCombatStore((state) => state.turnOrder)
  const currentTurnIndex = useCombatStore((state) => state.currentTurnIndex)
  const round = useCombatStore((state) => state.round)
  const log = useCombatStore((state) => state.log)
  const result = useCombatStore((state) => state.result)
  const startCombat = useCombatStore((state) => state.startCombat)
  const playerAttack = useCombatStore((state) => state.playerAttack)
  const endCombat = useCombatStore((state) => state.endCombat)
  const resolveCombat = useStoryStore((state) => state.resolveCombat)

  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    startCombat(enemyId)
  }, [enemyId, startCombat])

  const player = combatants.find((c) => c.isPlayer)
  const enemies = combatants.filter((c) => !c.isPlayer)
  const isPlayerTurn = active && turnOrder[currentTurnIndex] === 'player'

  const handleContinue = () => {
    if (!result) return
    endCombat()
    resolveCombat(result)
  }

  return (
    <div className="min-h-svh bg-neutral-950 text-neutral-100 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Combat</h1>
        <p className="mt-1 text-neutral-400">Round {round}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {player && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <div className="font-medium">{player.name}</div>
              <div className="text-sm text-neutral-400">
                HP {player.health} / {player.maxHealth}
              </div>
            </div>
          )}

          {enemies.map((enemy) => (
            <button
              key={enemy.id}
              disabled={!isPlayerTurn || enemy.health <= 0}
              onClick={() => playerAttack(enemy.id)}
              className={`text-left rounded-lg border p-4 transition-colors ${
                enemy.health <= 0
                  ? 'border-neutral-800 bg-neutral-900 opacity-40'
                  : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'
              }`}
            >
              <div className="font-medium">{enemy.name}</div>
              <div className="text-sm text-neutral-400">
                HP {Math.max(0, enemy.health)} / {enemy.maxHealth}
              </div>
              {isPlayerTurn && enemy.health > 0 && (
                <div className="mt-1 text-xs text-neutral-500">Attack</div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 h-40 space-y-1 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-300">
          {log.map((message, index) => (
            <div key={index}>{message}</div>
          ))}
        </div>

        {!isPlayerTurn && !result && <p className="mt-3 text-sm text-neutral-500">Resolving...</p>}

        {result && (
          <div className="mt-4">
            <p className="text-lg font-medium">{result === 'win' ? 'Victory.' : 'You went down.'}</p>
            <button
              onClick={handleContinue}
              className="mt-3 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
