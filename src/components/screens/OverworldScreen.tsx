// Overworld/Navigation (docs/GAME_GUIDE.md §6). Uses a temporary modern-day
// Saigon map as the interaction surface while the real 2226 art pass is still
// pending: district polygons live in content/mapRegions.ts so the background
// image can be swapped later without rewriting the navigation model.

import { useMemo, useState } from 'react'
import { useNavigationStore } from '../../stores/navigationStore'
import { useStoryStore } from '../../stores/storyStore'
import { useSaveStore } from '../../stores/saveStore'
import { useAudioStore } from '../../stores/audioStore'
import { useUiStore } from '../../stores/uiStore'
import { DISTRICT_IDS, DISTRICT_REGIONS, type DistrictRegionDefinition } from '../../content/mapRegions'
import { LOCATIONS, LOCATION_IDS, type DistrictId, type LocationId } from '../../content/locations'
import { LOCATION_STORY_JSON } from '../../content/locationStories'
import { CyberButton, GlitchText, Panel } from '../ui'
import { NavRail } from './NavRail'

const saigonMapSrc = new URL('../../../saigon_map.jpg', import.meta.url).href

function polygonPoints(region: DistrictRegionDefinition): string {
  return region.polygon.map((point) => `${point.x * 100},${point.y * 100}`).join(' ')
}

export function OverworldScreen() {
  const unlockedLocationIds = useNavigationStore((s) => s.unlockedLocationIds)
  const selectedLocationId = useNavigationStore((s) => s.selectedLocationId)
  const selectLocation = useNavigationStore((s) => s.selectLocation)
  const loadStory = useStoryStore((s) => s.loadStory)
  const openOverlay = useUiStore((s) => s.openOverlay)
  const [selectedDistrictId, setSelectedDistrictId] = useState<DistrictId>('district4')
  const [hoveredDistrictId, setHoveredDistrictId] = useState<DistrictId | null>(null)

  const locationIdsByDistrict = useMemo(() => {
    const grouped = {
      district1: [] as LocationId[],
      district2: [] as LocationId[],
      district4: [] as LocationId[],
      district5: [] as LocationId[],
    }
    for (const id of LOCATION_IDS) {
      grouped[LOCATIONS[id].districtId].push(id)
    }
    return grouped
  }, [])

  const selectedDistrict = DISTRICT_REGIONS[selectedDistrictId]
  const selectedDistrictLocationIds = locationIdsByDistrict[selectedDistrictId]

  function handleSelect(id: LocationId) {
    selectLocation(id)
    loadStory(LOCATION_STORY_JSON[id], undefined, id)
    // Location's baseline mood (docs/GAME_GUIDE.md), instant on
    // selection, before the ink content's own first-line tags (if any) take over.
    useAudioStore.getState().enterLocation(LOCATIONS[id])
    // Autosave checkpoint (Save/Persistence Layer): capture the fresh
    // scene's opening state right after handing off to the Story Engine.
    useSaveStore.getState().autosave()
  }

  return (
    <div className="flex h-svh w-full">
      <NavRail
        className="shrink-0 p-4"
        onChar={() => openOverlay('character')}
        onCase={() => openOverlay('casefile')}
        onMenu={() => openOverlay('settings')}
      />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-xl font-bold uppercase tracking-widest text-chrome-primary">
              <GlitchText text="Saigon Grid" />
            </h1>
            <p className="font-body text-sm text-white/55">Temporary overworld map based on a modern Saigon reference until the 2226 art pass lands.</p>
          </div>
          <p className="max-w-xl font-body text-sm text-white/45">
            Select a district on the map or from the fallback list to review active leads and enter that part of the city.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_24rem]">
          <Panel size="lg" className="overflow-hidden p-3">
            <div className="relative mx-auto aspect-[2048/1280] w-full overflow-hidden bg-black">
              <img src={saigonMapSrc} alt="Temporary district map of Saigon used for overworld navigation" className="absolute inset-0 h-full w-full object-cover opacity-70" />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--color-chrome-primary) 12%, transparent), transparent 30%), linear-gradient(180deg, rgba(4, 8, 12, 0.18), rgba(3, 6, 9, 0.44))',
                }}
              />

              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-label="Clickable district map of Saigon">
                {DISTRICT_IDS.map((districtId) => {
                  const region = DISTRICT_REGIONS[districtId]
                  const districtLocationIds = locationIdsByDistrict[districtId]
                  const hasUnlockedLead = districtLocationIds.some((id) => unlockedLocationIds.has(id))
                  const hasLocations = districtLocationIds.length > 0
                  const isSelected = selectedDistrictId === districtId
                  const isHovered = hoveredDistrictId === districtId
                  const isActive = isSelected || isHovered
                  const isCurrentStoryDistrict = selectedLocationId ? LOCATIONS[selectedLocationId].districtId === districtId : false
                  const fillOpacity = isCurrentStoryDistrict ? 0.3 : isActive ? 0.24 : hasUnlockedLead ? 0.14 : hasLocations ? 0.08 : 0.04
                  const strokeWidth = isActive ? 0.42 : hasUnlockedLead ? 0.28 : 0.2

                  return (
                    <g
                      key={districtId}
                      role="button"
                      tabIndex={0}
                      aria-label={`${region.name}. ${hasUnlockedLead ? 'Active leads available.' : hasLocations ? 'No active leads unlocked yet.' : 'No destinations wired yet.'}`}
                      onClick={() => setSelectedDistrictId(districtId)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedDistrictId(districtId)
                        }
                      }}
                      onMouseEnter={() => setHoveredDistrictId(districtId)}
                      onMouseLeave={() => setHoveredDistrictId((current) => (current === districtId ? null : current))}
                      className="cursor-pointer outline-none"
                    >
                      <polygon
                        points={polygonPoints(region)}
                        fill={region.accent}
                        fillOpacity={fillOpacity}
                        stroke={isActive ? '#ffffff' : region.accent}
                        strokeOpacity={hasUnlockedLead || isActive ? 0.95 : 0.5}
                        strokeWidth={strokeWidth}
                        style={{ transition: 'fill-opacity 180ms ease, stroke-width 180ms ease, stroke-opacity 180ms ease' }}
                      />
                    </g>
                  )
                })}
              </svg>

              {DISTRICT_IDS.map((districtId) => {
                const region = DISTRICT_REGIONS[districtId]
                const districtLocationIds = locationIdsByDistrict[districtId]
                const hasUnlockedLead = districtLocationIds.some((id) => unlockedLocationIds.has(id))
                const hasLocations = districtLocationIds.length > 0
                const isSelected = selectedDistrictId === districtId

                return (
                  <button
                    key={districtId}
                    type="button"
                    onClick={() => setSelectedDistrictId(districtId)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 border px-2 py-1 text-left font-display text-[10px] uppercase tracking-[0.25em] transition-colors ${
                      isSelected
                        ? 'border-white bg-black/85 text-white shadow-[0_0_18px_rgba(255,255,255,0.18)]'
                        : hasUnlockedLead
                          ? 'border-chrome-primary/80 bg-black/72 text-chrome-primary hover:border-chrome-secondary hover:text-white'
                          : hasLocations
                            ? 'border-white/25 bg-black/65 text-white/65 hover:border-white/45 hover:text-white'
                            : 'border-white/15 bg-black/55 text-white/35 hover:border-white/25 hover:text-white/60'
                    }`}
                    style={{
                      left: `${region.labelAnchor.x * 100}%`,
                      top: `${region.labelAnchor.y * 100}%`,
                      clipPath:
                        'polygon(0 0, calc(100% - var(--cut-sm)) 0, 100% var(--cut-sm), 100% 100%, var(--cut-sm) 100%, 0 calc(100% - var(--cut-sm)))',
                    }}
                  >
                    <span className="block">{region.name}</span>
                    <span className="block text-[9px] tracking-[0.15em] opacity-70">{region.shortName}</span>
                  </button>
                )
              })}

              <Panel
                size="sm"
                className="absolute top-3 left-3 max-w-xs p-3"
                accent={hoveredDistrictId ? DISTRICT_REGIONS[hoveredDistrictId].accent : DISTRICT_REGIONS[selectedDistrictId].accent}
              >
                <p className="font-display text-[11px] uppercase tracking-[0.3em] text-white/80">Map Layer</p>
                <p className="mt-1 font-body text-sm text-white/60">The modern district map is a temporary stand-in for the future 2226 overworld illustration.</p>
              </Panel>
            </div>
          </Panel>

          <div className="flex flex-col gap-4">
            <Panel size="md" accent={selectedDistrict.accent} className="p-5">
              <p className="font-display text-[11px] uppercase tracking-[0.3em] text-white/65">{selectedDistrict.shortName}</p>
              <h2 className="mt-1 font-display text-lg font-bold uppercase tracking-widest text-white">{selectedDistrict.name}</h2>
              <p className="mt-2 font-body text-sm leading-5 text-white/65">{selectedDistrict.blurb}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="border border-white/15 px-2 py-1 font-display text-[10px] uppercase tracking-[0.25em] text-white/55">
                  {selectedDistrictLocationIds.filter((id) => unlockedLocationIds.has(id)).length} active lead
                  {selectedDistrictLocationIds.filter((id) => unlockedLocationIds.has(id)).length === 1 ? '' : 's'}
                </span>
                <span className="border border-white/15 px-2 py-1 font-display text-[10px] uppercase tracking-[0.25em] text-white/55">
                  {selectedDistrictLocationIds.length} node{selectedDistrictLocationIds.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {selectedDistrictLocationIds.length === 0 && (
                  <p className="font-body text-sm text-white/45">No playable destinations are wired into this district yet. The map model is ready for future Case 1 locations here.</p>
                )}

                {selectedDistrictLocationIds.map((id) => {
                  const def = LOCATIONS[id]
                  const unlocked = unlockedLocationIds.has(id)

                  return (
                    <Panel
                      key={id}
                      size="sm"
                      accent={unlocked ? selectedDistrict.accent : 'rgba(255,255,255,0.22)'}
                      className={`p-4 ${unlocked ? '' : 'opacity-65'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white">
                            {def.name}
                            {!unlocked && <span className="text-white/45"> (locked)</span>}
                          </h3>
                          <p className="mt-1 font-body text-sm text-white/60">{def.blurb}</p>
                        </div>
                        <CyberButton className="shrink-0 !px-3 !py-2 !text-xs" disabled={!unlocked} onClick={() => handleSelect(id)}>
                          Enter
                        </CyberButton>
                      </div>
                    </Panel>
                  )
                })}
              </div>
            </Panel>

            <Panel size="md" className="p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-chrome-secondary">District Access</h2>
              <p className="mt-2 font-body text-sm text-white/55">Text fallback for keyboard, precision, and future district expansion.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {DISTRICT_IDS.map((districtId) => {
                  const region = DISTRICT_REGIONS[districtId]
                  const districtLocationIds = locationIdsByDistrict[districtId]
                  const unlockedCount = districtLocationIds.filter((id) => unlockedLocationIds.has(id)).length

                  return (
                    <CyberButton
                      key={districtId}
                      className={selectedDistrictId === districtId ? '!border-chrome-secondary !bg-chrome-secondary/15 !text-white' : ''}
                      tag={unlockedCount > 0 ? `${unlockedCount} lead${unlockedCount === 1 ? '' : 's'}` : districtLocationIds.length > 0 ? 'No leads' : 'Future'}
                      onClick={() => setSelectedDistrictId(districtId)}
                    >
                      {region.name}
                    </CyberButton>
                  )
                })}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
