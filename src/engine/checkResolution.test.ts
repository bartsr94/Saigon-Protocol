import { describe, expect, it } from 'vitest'
import { resolveCheck, type RandomSource } from './checkResolution'

/** Deterministic RNG: feeds fixed [0,1) values in sequence, one per die. */
function fixedRandom(...values: number[]): RandomSource {
  let i = 0
  return () => values[i++ % values.length]
}

/** Maps a desired die face (1-6) to the [0,1) value rollDie will floor into it. */
function faceValue(face: Die): number {
  return (face - 1) / 6
}

type Die = 1 | 2 | 3 | 4 | 5 | 6

describe('resolveCheck', () => {
  it('sums dice + modifier and compares to target number', () => {
    const random = fixedRandom(faceValue(3), faceValue(4)) // 3+4=7
    const result = resolveCheck(2, 9, random)
    expect(result.dice).toEqual([3, 4])
    expect(result.diceTotal).toBe(7)
    expect(result.total).toBe(9)
    expect(result.success).toBe(true)
  })

  it('fails when total is below target number', () => {
    const random = fixedRandom(faceValue(1), faceValue(2)) // 1+2=3
    const result = resolveCheck(0, 9, random)
    expect(result.success).toBe(false)
  })

  it('natural 12 always succeeds regardless of modifier/target', () => {
    const random = fixedRandom(faceValue(6), faceValue(6))
    const result = resolveCheck(-10, 999, random)
    expect(result.doubles).toBe('critSuccess')
    expect(result.success).toBe(true)
  })

  it('natural 2 always fails regardless of modifier/target', () => {
    const random = fixedRandom(faceValue(1), faceValue(1))
    const result = resolveCheck(10, -999, random)
    expect(result.doubles).toBe('critFail')
    expect(result.success).toBe(false)
  })

  it('non-doubles rolls have no doubles result', () => {
    const random = fixedRandom(faceValue(2), faceValue(5))
    const result = resolveCheck(0, 7, random)
    expect(result.doubles).toBeNull()
  })

  it('a tie between total and target number is a success', () => {
    const random = fixedRandom(faceValue(3), faceValue(3)) // diceTotal 6, but not a "double 6s" (that's 6+6=12)
    const result = resolveCheck(3, 9, random)
    expect(result.total).toBe(9)
    expect(result.success).toBe(true)
  })
})
