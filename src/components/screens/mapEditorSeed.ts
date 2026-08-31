// Reverse of MapEditorPanel.tsx's buildExport() — turns a real hub/street
// record into the seed shape MapEditorPanel needs to open pre-loaded with
// live data (docs/LIVE_MAP_EDITOR_SPEC.md). POIs/doors are copied through
// with their real ids and content intact; only the underlying tile grid is
// reconstructed from `layoutRows`, since its 'o'/'d' markers don't carry
// their own TileKind — a POI/door tile is always floor underneath.

import type { DistrictStreetDefinition, DistrictStreetPoi } from '../../content/districtStreets'
import type { GridHubDefinition, HubDoor, HubPoi } from '../../content/locationHubs'
import type { BuilderDoor, BuilderPoi, BuilderSeed, TileKind } from './MapEditorPanel'

function charToTileKind(ch: string): TileKind {
  if (ch === '#') return 'wall'
  if (ch === ' ') return 'void'
  return 'floor' // '.', 'o', 'd' all sit on floor underneath their marker
}

function layoutRowsToGrid(layoutRows: string[]): TileKind[][] {
  return layoutRows.map((row) => [...row].map(charToTileKind))
}

function doorToBuilderDoor(door: HubDoor): BuilderDoor {
  return {
    id: door.id,
    x: door.position.x,
    y: door.position.y,
    unlockFlag: door.unlockFlag,
    label: door.label,
    lockedReason: door.lockedReason,
    backgroundId: door.backgroundId ?? '',
  }
}

function hubPoiToBuilderPoi(poi: HubPoi): BuilderPoi {
  return {
    id: poi.id,
    x: poi.position.x,
    y: poi.position.y,
    backgroundId: poi.backgroundId ?? '',
    interactions: poi.interactions.map((i) => ({
      id: i.id,
      type: i.type,
      npcId: i.npcId ?? '',
      label: i.label,
      description: i.description,
      storyLocationId: i.storyLocationId,
      available: i.available,
      lockedReason: i.lockedReason ?? '',
    })),
    locationId: '',
    label: '',
    description: '',
    lockedReason: '',
  }
}

function streetPoiToBuilderPoi(poi: DistrictStreetPoi): BuilderPoi {
  return {
    id: poi.id,
    x: poi.position.x,
    y: poi.position.y,
    backgroundId: '',
    interactions: [],
    locationId: poi.locationId,
    label: poi.label,
    description: poi.description,
    lockedReason: poi.lockedReason ?? '',
  }
}

export function hubToBuilderState(hub: GridHubDefinition): BuilderSeed {
  return {
    id: hub.id,
    name: hub.name,
    blurb: hub.blurb,
    backgroundId: hub.backgroundId ?? '',
    visionRadius: hub.grid.visionRadius === undefined ? '' : String(hub.grid.visionRadius),
    grid: layoutRowsToGrid(hub.grid.layoutRows),
    pois: hub.grid.pois.map(hubPoiToBuilderPoi),
    doors: (hub.grid.doors ?? []).map(doorToBuilderDoor),
    entryTile: hub.grid.entryTile,
  }
}

export function streetToBuilderState(street: DistrictStreetDefinition): BuilderSeed {
  return {
    id: street.id,
    name: street.name,
    blurb: street.blurb,
    backgroundId: street.backgroundId ?? '',
    visionRadius: street.visionRadius === undefined ? '' : String(street.visionRadius),
    grid: layoutRowsToGrid(street.layoutRows),
    pois: street.pois.map(streetPoiToBuilderPoi),
    doors: (street.doors ?? []).map(doorToBuilderDoor),
    entryTile: street.entryTile,
  }
}
