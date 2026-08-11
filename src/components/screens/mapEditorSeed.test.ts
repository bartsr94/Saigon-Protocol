import { describe, expect, it } from 'vitest'
import { hubToBuilderState, streetToBuilderState } from './mapEditorSeed'
import { LOCATION_HUBS, type GridHubDefinition } from '../../content/locationHubs'
import { DISTRICT_STREETS } from '../../content/districtStreets'

function requireGridHub(id: keyof typeof LOCATION_HUBS): GridHubDefinition {
  const hub = LOCATION_HUBS[id]
  if (hub.layout !== 'grid') throw new Error(`expected a grid hub, got '${hub.layout}'`)
  return hub
}

describe('hubToBuilderState', () => {
  const hub = requireGridHub('checkpoint')
  const seed = hubToBuilderState(hub)

  it('carries id/name/blurb/backgroundId through unchanged', () => {
    expect(seed.id).toBe(hub.id)
    expect(seed.name).toBe(hub.name)
    expect(seed.blurb).toBe(hub.blurb)
    expect(seed.backgroundId).toBe(hub.backgroundId)
  })

  it('reconstructs a same-sized grid from layoutRows', () => {
    expect(seed.grid.length).toBe(hub.grid.height)
    expect(seed.grid[0].length).toBe(hub.grid.width)
  })

  it('resolves wall/floor/void correctly, and treats POI/door marker tiles as floor', () => {
    hub.grid.layoutRows.forEach((row, y) => {
      ;[...row].forEach((ch, x) => {
        const expected = ch === '#' ? 'wall' : ch === ' ' ? 'void' : 'floor'
        expect(seed.grid[y][x]).toBe(expected)
      })
    })
  })

  it('carries every POI through with its real id, position, and interactions intact', () => {
    expect(seed.pois).toHaveLength(hub.grid.pois.length)
    const meiHong = seed.pois.find((p) => p.id === 'checkpoint-mei-hong')
    const sourceMeiHong = hub.grid.pois.find((p) => p.id === 'checkpoint-mei-hong')!
    expect(meiHong).toBeDefined()
    expect(meiHong!.x).toBe(sourceMeiHong.position.x)
    expect(meiHong!.y).toBe(sourceMeiHong.position.y)
    expect(meiHong!.interactions).toHaveLength(1)
    expect(meiHong!.interactions[0].npcId).toBe('meiHong')
    expect(meiHong!.interactions[0].storyLocationId).toBe('checkpoint')
  })

  it('defaults a missing npcId/lockedReason to empty string rather than undefined (form inputs need a string)', () => {
    const scanner = seed.pois.find((p) => p.id === 'checkpoint-access-scanner')!
    expect(scanner.interactions[0].npcId).toBe('')
    expect(scanner.interactions[0].lockedReason).toBe('')
  })

  it('carries every door through with its real id, position, and lock data intact', () => {
    expect(seed.doors).toHaveLength(hub.grid.doors!.length)
    const innerDoor = seed.doors.find((d) => d.id === 'checkpoint-inner-door')!
    expect(innerDoor.x).toBe(4)
    expect(innerDoor.y).toBe(5)
    expect(innerDoor.unlockFlag).toBe('checkpoint-inner-wing-unlocked')
  })

  it('carries the entry tile through unchanged', () => {
    expect(seed.entryTile).toEqual(hub.grid.entryTile)
  })
})

describe('streetToBuilderState', () => {
  const street = DISTRICT_STREETS.district4!
  const seed = streetToBuilderState(street)

  it('carries id/name/blurb through unchanged', () => {
    expect(seed.id).toBe(street.id)
    expect(seed.name).toBe(street.name)
    expect(seed.blurb).toBe(street.blurb)
  })

  it('reconstructs a same-sized grid from layoutRows', () => {
    expect(seed.grid.length).toBe(street.height)
    expect(seed.grid[0].length).toBe(street.width)
  })

  it('carries every POI through with its real id, position, and locationId/label/description intact', () => {
    expect(seed.pois).toHaveLength(street.pois.length)
    const canteen = seed.pois.find((p) => p.id === 'district4-worker-canteen')!
    const sourceCanteen = street.pois.find((p) => p.id === 'district4-worker-canteen')!
    expect(canteen.x).toBe(sourceCanteen.position.x)
    expect(canteen.y).toBe(sourceCanteen.position.y)
    expect(canteen.locationId).toBe('workerCanteen')
    expect(canteen.description).toBe(sourceCanteen.description)
  })

  it('defaults a missing lockedReason to empty string rather than undefined', () => {
    const transit = seed.pois.find((p) => p.id === 'district4-transit-platform')!
    expect(transit.lockedReason).toBe('')
    const incident = seed.pois.find((p) => p.id === 'district4-incident-scene')!
    expect(incident.lockedReason).toBe(street.pois.find((p) => p.id === 'district4-incident-scene')!.lockedReason)
  })

  it('defaults missing doors to an empty array', () => {
    expect(seed.doors).toEqual([])
  })
})
