// District Street routing (Architecture §7's District Street Layer):
// resolves the current district's street map and renders
// DistrictStreetView. Sits between OverworldScreen and LocationHubScreen in
// App.tsx's routing — "Map" from here leaves the district entirely, back to
// the Overworld (leaving a Hub entered from within this street instead pops
// back to here — see LocationHubScreen.handleReturnToMap).

import { BACKGROUNDS } from '../../content/backgrounds'
import { DISTRICT_STREETS } from '../../content/districtStreets'
import { useAudioStore } from '../../stores/audioStore'
import { useGameplayStore } from '../../stores/gameplayStore'
import { useNavigationStore } from '../../stores/navigationStore'
import { useSaveStore } from '../../stores/saveStore'
import { useUiStore } from '../../stores/uiStore'
import { DistrictStreetView } from './DistrictStreetView'
import { NavRail } from './NavRail'

export function DistrictStreetScreen() {
  const currentDistrictId = useGameplayStore((s) => s.currentDistrictId)
  const districtPlayerPosition = useGameplayStore((s) => s.districtPlayerPosition)
  const leaveDistrictStreet = useGameplayStore((s) => s.leaveDistrictStreet)
  const openOverlay = useUiStore((s) => s.openOverlay)
  const returnToOverworld = useNavigationStore((s) => s.returnToOverworld)

  const street = currentDistrictId ? DISTRICT_STREETS[currentDistrictId] : null
  const background = street?.backgroundId ? BACKGROUNDS[street.backgroundId] : null

  const position = districtPlayerPosition ?? street?.entryTile ?? null
  const atEntry = !street || (position?.x === street.entryTile.x && position?.y === street.entryTile.y)

  function handleReturnToMap() {
    leaveDistrictStreet()
    returnToOverworld()
    useAudioStore.getState().enterOverworld()
    useSaveStore.getState().autosave()
  }

  if (!street) return null

  return (
    <div className="flex h-svh w-full">
      <NavRail
        className="shrink-0 p-4"
        onChar={() => openOverlay('character')}
        onMap={handleReturnToMap}
        onCase={() => openOverlay('casefile')}
        onMenu={() => openOverlay('settings')}
        mapDisabled={!atEntry}
        mapTitle="Return to the entrance to leave."
      />

      <DistrictStreetView street={street} background={background} onReturnToMap={handleReturnToMap} atEntry={atEntry} />
    </div>
  )
}
