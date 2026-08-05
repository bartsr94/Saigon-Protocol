import { useState } from 'react'
import { useNavigationStore } from '../../stores/navigationStore'
import { useCharacterStore } from '../../stores/characterStore'
import { saveGame } from '../../stores/saveStore'
import { LOCATIONS } from '../../content/locations'
import { GameFrame } from '../ui/GameFrame'
import { Eyebrow, Title } from '../ui/Screen'
import { Button } from '../ui/Button'
import { CardButton } from '../ui/CardButton'
import { StatBar } from '../ui/StatBar'

export function OverworldScreen() {
  const unlockedLocationIds = useNavigationStore((state) => state.unlockedLocationIds)
  const selectLocation = useNavigationStore((state) => state.selectLocation)
  const character = useCharacterStore((state) => state.character)

  const [justSaved, setJustSaved] = useState(false)

  const unlockedLocations = LOCATIONS.filter((location) =>
    unlockedLocationIds.includes(location.id),
  )

  const handleSave = () => {
    saveGame()
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 1500)
  }

  return (
    <GameFrame>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Eyebrow>District 7 // Free Zone</Eyebrow>
          <Title className="mt-1">Saigon SEZ</Title>
          <p className="mt-1 text-sm text-neutral-400">Choose where to go.</p>
        </div>

        <div className="flex w-full shrink-0 flex-col items-end gap-2 sm:w-56">
          {character && (
            <div className="w-full rounded-md border border-neutral-800 bg-neutral-900/60 p-3">
              <div className="font-display text-sm font-semibold tracking-wide text-neutral-100">
                {character.name}
              </div>
              <StatBar
                value={character.health}
                max={character.maxHealth}
                label="Condition"
                className="mt-2"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            {justSaved && (
              <span className="font-display text-[10px] uppercase tracking-wider text-cyan-400">
                Saved
              </span>
            )}
            <Button variant="secondary" sound="select" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
        {unlockedLocations.map((location, index) => (
          <CardButton key={location.id} onClick={() => selectLocation(location.id)}>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xs text-cyan-500/70">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="font-display font-semibold tracking-wide">{location.name}</span>
            </div>
            <div className="mt-1 text-sm leading-relaxed text-neutral-400">{location.blurb}</div>
          </CardButton>
        ))}
      </div>
    </GameFrame>
  )
}
