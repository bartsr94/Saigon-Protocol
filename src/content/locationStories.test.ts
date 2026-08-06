import { describe, expect, it } from 'vitest'
import { LOCATION_STORY_JSON } from './locationStories'
import { LOCATION_IDS } from './locations'

describe('locationStories', () => {
  it('has a compiled story entry for every location', () => {
    for (const id of LOCATION_IDS) {
      expect(LOCATION_STORY_JSON[id]).toBeTruthy()
    }
  })

  it('gives each location distinct content, not one shared fixture', () => {
    const entries = LOCATION_IDS.map((id) => LOCATION_STORY_JSON[id])
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        expect(entries[i]).not.toBe(entries[j])
      }
    }
  })
})
