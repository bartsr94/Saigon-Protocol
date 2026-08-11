// Blank-start grid-authoring tool for Location Hub / District Street content
// (Architecture §7's Location Hub Layer, content/locationHubs.ts,
// content/districtStreets.ts). Output is plain JSON, hand-pasted into the
// content files rather than written directly — ids here are free text, not
// validated against the real HubId/LocationId/NpcId string-literal unions.
// The actual editor UI/state lives in MapEditorPanel.tsx, shared with the
// live map editor (docs/LIVE_MAP_EDITOR_SPEC.md) — this wrapper is just the
// blank-seed, copy/paste-export configuration of it.

import { MapEditorPanel } from './MapEditorPanel'

export function MapBuilderTool() {
  return <MapEditorPanel />
}
