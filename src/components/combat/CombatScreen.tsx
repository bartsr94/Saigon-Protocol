import { useEffect, useRef } from 'react'
import { useCombatStore } from '../../stores/combatStore'
import { useStoryStore } from '../../stores/storyStore'
import { GameFrame } from '../ui/GameFrame'
import { Eyebrow, Title } from '../ui/Screen'
import { Button } from '../ui/Button'
import { StatBar } from '../ui/StatBar'

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
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (started.current) return
    started.current = true
    startCombat(enemyId)
  }, [enemyId, startCombat])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: 'end' })
  }, [log])

  const player = combatants.find((c) => c.isPlayer)
  const enemies = combatants.filter((c) => !c.isPlayer)
  const isPlayerTurn = active && turnOrder[currentTurnIndex] === 'player'

  const handleContinue = () => {
    if (!result) return
    endCombat()
    resolveCombat(result)
  }

  return (
    <GameFrame>
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <Eyebrow accent="magenta">Hostile Contact</Eyebrow>
            <Title accent="magenta" className="mt-1">
              Combat
            </Title>
          </div>
          <div className="rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-right">
            <div className="font-display text-[10px] uppercase tracking-wider text-neutral-500">
              Round
            </div>
            <div className="font-display text-lg font-bold text-neutral-100">{round}</div>
          </div>
        </div>

        {turnOrder.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {turnOrder.map((id, index) => {
              const combatant = combatants.find((c) => c.id === id)
              if (!combatant) return null
              const isCurrent = index === currentTurnIndex
              const isDown = combatant.health <= 0
              return (
                <div
                  key={id}
                  className={`rounded-full border px-3 py-1 font-display text-[10px] uppercase tracking-wider transition-all ${
                    isDown
                      ? 'border-neutral-800 text-neutral-700 line-through'
                      : isCurrent
                        ? combatant.isPlayer
                          ? 'border-cyan-400/70 bg-cyan-400/10 text-cyan-300 shadow-[0_0_14px_-4px_rgba(34,211,238,0.7)]'
                          : 'border-fuchsia-400/70 bg-fuchsia-400/10 text-fuchsia-300 shadow-[0_0_14px_-4px_rgba(232,121,249,0.7)]'
                        : 'border-neutral-800 text-neutral-500'
                  }`}
                >
                  {combatant.name}
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {player && (
            <div className="rounded-md border border-cyan-400/30 bg-neutral-900/60 p-4">
              <div className="font-display font-semibold tracking-wide text-neutral-100">
                {player.name}
              </div>
              <StatBar value={player.health} max={player.maxHealth} label="HP" className="mt-2" />
            </div>
          )}

          {enemies.map((enemy) => {
            const isDown = enemy.health <= 0
            const targetable = isPlayerTurn && !isDown
            return (
              <button
                key={enemy.id}
                disabled={!targetable}
                onClick={() => playerAttack(enemy.id)}
                className={`text-left rounded-md border p-4 transition-all duration-150 ${
                  isDown
                    ? 'border-neutral-800 bg-neutral-900/40 opacity-40'
                    : targetable
                      ? 'border-fuchsia-400/40 bg-neutral-900/60 hover:border-fuchsia-400/80 hover:shadow-[0_0_20px_-6px_rgba(232,121,249,0.6)]'
                      : 'border-neutral-800 bg-neutral-900/60'
                }`}
              >
                <div className="font-display font-semibold tracking-wide text-neutral-100">
                  {enemy.name}
                </div>
                <StatBar
                  value={Math.max(0, enemy.health)}
                  max={enemy.maxHealth}
                  label="HP"
                  className="mt-2"
                />
                {targetable && (
                  <div className="mt-2 font-display text-[10px] uppercase tracking-wider text-fuchsia-400">
                    ▸ Attack
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-6 h-40 space-y-1.5 overflow-y-auto rounded-md border border-neutral-800 bg-neutral-950/70 p-4 font-mono text-xs">
          {log.map((message, index) => {
            const tone = message.includes('goes down')
              ? 'text-fuchsia-400'
              : message.includes('misses')
                ? 'text-neutral-600'
                : message.includes('hits')
                  ? player && message.startsWith(player.name)
                    ? 'text-cyan-400'
                    : 'text-fuchsia-500/80'
                  : 'text-neutral-500'
            return (
              <div key={index} className={tone}>
                {'> '}
                {message}
              </div>
            )
          })}
          <div ref={logEndRef} />
        </div>

        {!isPlayerTurn && !result && (
          <p className="mt-3 font-display text-xs uppercase tracking-wider text-neutral-600">
            Resolving...
          </p>
        )}

        {result && (
          <div className="mt-6 rounded-md border border-neutral-800 bg-neutral-900/60 p-5 text-center">
            <p
              className={`font-display text-2xl font-bold uppercase tracking-wide ${
                result === 'win' ? 'text-cyan-300 text-glow-cyan' : 'text-fuchsia-400 text-glow-magenta'
              }`}
            >
              {result === 'win' ? 'Victory' : 'You Went Down'}
            </p>
            <Button onClick={handleContinue} className="mt-4">
              Continue
            </Button>
          </div>
        )}
      </div>
    </GameFrame>
  )
}
