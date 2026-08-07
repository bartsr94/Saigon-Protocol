import { describe, expect, it } from 'vitest'
import { SFX_CATEGORY_VARIANTS, SFX_ID_OVERRIDE, SFX_ID_TO_CATEGORY, SFX_IDS, type SfxCategory } from './sfx'

const EXPECTED_VARIANT_COUNT: Record<SfxCategory, number> = {
  hover: 9,
  confirm: 9,
  close: 9,
  open: 9,
  scan: 8,
}

describe('SFX_ID_TO_CATEGORY', () => {
  it('assigns every SfxId a category', () => {
    for (const id of SFX_IDS) {
      expect(SFX_ID_TO_CATEGORY[id]).toBeTruthy()
    }
  })
})

describe('SFX_CATEGORY_VARIANTS', () => {
  it('has the delivered variant count for each category', () => {
    for (const [category, count] of Object.entries(EXPECTED_VARIANT_COUNT)) {
      expect(SFX_CATEGORY_VARIANTS[category as SfxCategory]).toHaveLength(count)
    }
  })

  it('every variant path points inside its own category folder, sequentially numbered', () => {
    for (const [category, variants] of Object.entries(SFX_CATEGORY_VARIANTS)) {
      variants.forEach((path, i) => {
        expect(path).toMatch(new RegExp(`^/audio/sfx/${category}--.*/ui-${category}-${i + 1}\\.mp3$`))
      })
    }
  })

  it('has no duplicate paths across or within categories', () => {
    const allPaths = Object.values(SFX_CATEGORY_VARIANTS).flat()
    expect(new Set(allPaths).size).toBe(allPaths.length)
  })
})

describe('SFX_ID_OVERRIDE', () => {
  it("buttonClick's pinned file is a real member of its own category's variant pool, not a stray path", () => {
    const override = SFX_ID_OVERRIDE.buttonClick!
    const category = SFX_ID_TO_CATEGORY.buttonClick
    expect(SFX_CATEGORY_VARIANTS[category]).toContain(override)
  })

  it('points at the specific variant requested (ui-confirm-6)', () => {
    expect(SFX_ID_OVERRIDE.buttonClick).toMatch(/\/ui-confirm-6\.mp3$/)
  })
})
