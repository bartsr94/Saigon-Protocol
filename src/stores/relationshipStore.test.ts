import { beforeEach, describe, expect, it } from 'vitest'
import { useRelationshipStore } from './relationshipStore'
import { NPC_IDS } from '../content/npcs'

describe('relationshipStore', () => {
  beforeEach(() => {
    useRelationshipStore.setState(useRelationshipStore.getInitialState(), true)
  })

  it('starts every NPC at 0', () => {
    const { affinity } = useRelationshipStore.getState()
    for (const id of NPC_IDS) {
      expect(affinity[id]).toBe(0)
    }
  })

  it('adjustAffinity applies a delta and clamps at the bounds', () => {
    useRelationshipStore.getState().adjustAffinity('lakshmiAvani', 3)
    expect(useRelationshipStore.getState().affinity.lakshmiAvani).toBe(3)

    useRelationshipStore.getState().adjustAffinity('lakshmiAvani', -1)
    expect(useRelationshipStore.getState().affinity.lakshmiAvani).toBe(2)

    useRelationshipStore.getState().adjustAffinity('lakshmiAvani', 100)
    expect(useRelationshipStore.getState().affinity.lakshmiAvani).toBe(10)

    useRelationshipStore.getState().adjustAffinity('lakshmiAvani', -100)
    expect(useRelationshipStore.getState().affinity.lakshmiAvani).toBe(-10)
  })

  it('adjustAffinity only touches the targeted NPC', () => {
    useRelationshipStore.getState().adjustAffinity('lakshmiAvani', 5)
    expect(useRelationshipStore.getState().affinity.meiHong).toBe(0)
  })

  it('hydrate bulk-restores affinity scores', () => {
    useRelationshipStore.getState().hydrate({
      ...useRelationshipStore.getInitialState().affinity,
      lakshmiAvani: 6,
      soraBaek: -4,
    })

    const { affinity } = useRelationshipStore.getState()
    expect(affinity.lakshmiAvani).toBe(6)
    expect(affinity.soraBaek).toBe(-4)
  })

  it('reset restores everyone to 0', () => {
    useRelationshipStore.getState().adjustAffinity('lakshmiAvani', 5)
    useRelationshipStore.getState().reset()

    const { affinity } = useRelationshipStore.getState()
    for (const id of NPC_IDS) {
      expect(affinity[id]).toBe(0)
    }
  })
})
