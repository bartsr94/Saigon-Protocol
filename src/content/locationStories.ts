// Maps each LocationId to its own compiled story JSON (Content Pipeline,
// docs/GAME_GUIDE.md). Kept separate from locations.ts (pure
// flavor metadata) since OverworldScreen is presently the only consumer of
// the compiled JSON.

import checkpointJson from '../../content/ink/checkpoint.json'
import noodleStallJson from '../../content/ink/noodleStall.json'
import yDuocInstituteJson from '../../content/ink/yDuocInstitute.json'
import deltaSquatJson from '../../content/ink/deltaSquat.json'
import publicIncidentSceneJson from '../../content/ink/publicIncidentScene.json'
import workerCanteenJson from '../../content/ink/workerCanteen.json'
import mosqueJson from '../../content/ink/mosque.json'
import transitPlatformJson from '../../content/ink/transitPlatform.json'
import cidOfficeJson from '../../content/ink/cidOffice.json'
import sezacRecordsJson from '../../content/ink/sezacRecords.json'
import corporatePlazaJson from '../../content/ink/corporatePlaza.json'
import turtleLakePlazaJson from '../../content/ink/turtleLakePlaza.json'
import pasteurStreetTaproomJson from '../../content/ink/pasteurStreetTaproom.json'
import type { LocationId } from './locations'

export const LOCATION_STORY_JSON: Record<LocationId, Record<string, unknown>> = {
  checkpoint: checkpointJson,
  noodleStall: noodleStallJson,
  yDuocInstitute: yDuocInstituteJson,
  deltaSquat: deltaSquatJson,
  publicIncidentScene: publicIncidentSceneJson,
  workerCanteen: workerCanteenJson,
  mosque: mosqueJson,
  transitPlatform: transitPlatformJson,
  cidOffice: cidOfficeJson,
  sezacRecords: sezacRecordsJson,
  corporatePlaza: corporatePlazaJson,
  turtleLakePlaza: turtleLakePlazaJson,
  pasteurStreetTaproom: pasteurStreetTaproomJson,
}
