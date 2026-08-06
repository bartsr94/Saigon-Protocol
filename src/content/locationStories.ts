// Maps each LocationId to its own compiled story JSON (Content Pipeline,
// docs/CONTENT_PIPELINE_SPEC.md) — replaces every location sharing the
// throwaway content/ink/demo.json fixture. Kept separate from locations.ts
// (pure flavor metadata) since OverworldScreen is presently the only
// consumer of the compiled JSON.

import checkpointJson from '../../content/ink/checkpoint.json'
import noodleStallJson from '../../content/ink/noodleStall.json'
import deltaSquatJson from '../../content/ink/deltaSquat.json'
import type { LocationId } from './locations'

export const LOCATION_STORY_JSON: Record<LocationId, Record<string, unknown>> = {
  checkpoint: checkpointJson,
  noodleStall: noodleStallJson,
  deltaSquat: deltaSquatJson,
}
