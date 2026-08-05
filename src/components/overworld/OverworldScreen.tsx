import { useNavigationStore } from '../../stores/navigationStore'
import { LOCATIONS } from '../../content/locations'

export function OverworldScreen() {
  const unlockedLocationIds = useNavigationStore((state) => state.unlockedLocationIds)
  const selectLocation = useNavigationStore((state) => state.selectLocation)

  const unlockedLocations = LOCATIONS.filter((location) =>
    unlockedLocationIds.includes(location.id),
  )

  return (
    <div className="min-h-svh bg-neutral-950 text-neutral-100 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Saigon SEZ</h1>
      <p className="mt-1 text-neutral-400">Choose where to go.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {unlockedLocations.map((location) => (
          <button
            key={location.id}
            onClick={() => selectLocation(location.id)}
            className="text-left rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600 hover:bg-neutral-800 transition-colors"
          >
            <div className="font-medium">{location.name}</div>
            <div className="mt-1 text-sm text-neutral-400">{location.blurb}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
