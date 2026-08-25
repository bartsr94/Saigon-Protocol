// Maps each LocationId to its own compiled story JSON (Content Pipeline,
// docs/GAME_GUIDE.md). Kept separate from locations.ts (pure
// flavor metadata) since OverworldScreen is presently the only consumer of
// the compiled JSON.

import cidOfficeJson from '../../content/ink/district1/cidOffice.json'
import sezacRecordsJson from '../../content/ink/district1/sezacRecords.json'
import corporatePlazaJson from '../../content/ink/district1/corporatePlaza.json'
import deltaSquatJson from '../../content/ink/district2/deltaSquat.json'
import turtleLakePlazaJson from '../../content/ink/district3/turtleLakePlaza.json'
import pasteurStreetTaproomJson from '../../content/ink/district3/pasteurStreetTaproom.json'
import tuXuongClinicJson from '../../content/ink/district3/tuXuongClinic.json'
import undercanopyJson from '../../content/ink/district3/undercanopy.json'
import opheliaApartmentJson from '../../content/ink/district3/opheliaApartment.json'
import checkpointJson from '../../content/ink/district4/checkpoint.json'
import publicIncidentSceneJson from '../../content/ink/district4/publicIncidentScene.json'
import workerCanteenJson from '../../content/ink/district4/workerCanteen.json'
import mosqueJson from '../../content/ink/district4/mosque.json'
import transitPlatformJson from '../../content/ink/district4/transitPlatform.json'
import noodleStallJson from '../../content/ink/district5/noodleStall.json'
import yDuocInstituteJson from '../../content/ink/district5/yDuocInstitute.json'
import type { LocationId } from './locations'

export const LOCATION_STORY_JSON: Record<LocationId, Record<string, unknown>> = {
  // district1
  cidOffice: cidOfficeJson,
  sezacRecords: sezacRecordsJson,
  corporatePlaza: corporatePlazaJson,
  // district2
  deltaSquat: deltaSquatJson,
  // district3
  turtleLakePlaza: turtleLakePlazaJson,
  pasteurStreetTaproom: pasteurStreetTaproomJson,
  tuXuongClinic: tuXuongClinicJson,
  undercanopy: undercanopyJson,
  opheliaApartment: opheliaApartmentJson,
  // district4
  checkpoint: checkpointJson,
  publicIncidentScene: publicIncidentSceneJson,
  workerCanteen: workerCanteenJson,
  mosque: mosqueJson,
  transitPlatform: transitPlatformJson,
  // district5
  noodleStall: noodleStallJson,
  yDuocInstitute: yDuocInstituteJson,
}
