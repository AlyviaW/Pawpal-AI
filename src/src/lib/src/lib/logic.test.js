import { describe, it, expect } from 'vitest'
import {
  stableFromFile, buildActivity, simulateToilet,
  calcDaily, waterTargetMl, mealsPerDay
} from './logic.js'

describe('logic', () => {
  const fakeFile = { size: 1_800_000, lastModified: 123456789, name: 'test.mp4' }

  it('stableFromFile deterministic', () => {
    const s1 = stableFromFile(fakeFile)
    const s2 = stableFromFile(fakeFile)
    expect(Math.abs(s1 - s2)).toBeLessThan(1e-12)
  })

  it('buildActivity returns valid label', () => {
    const r = buildActivity(fakeFile, 'Cat')
    expect(['Low','Normal','High']).toContain(r.label)
    expect(r.activityIndex).toBeGreaterThan(0)
    expect(r.activityIndex).toBeLessThanOrEqual(1)
  })

  it('simulateToilet score in [2..5]', () => {
    const p = { size: 500000, lastModified: 111, name: 'toilet.jpg' }
    const r = simulateToilet(p)
    expect(r.score).toBeGreaterThanOrEqual(2)
    expect(r.score).toBeLessThanOrEqual(5)
  })

  it('calcDaily returns nulls if missing inputs', () => {
    const r = calcDaily(null, null, 'Normal')
    expect(r.kcal).toBeNull()
    expect(r.grams).toBeNull()
  })

  it('calcDaily increases with weight (dog)', () => {
    const d5 = calcDaily('Dog', 5, 'Normal')
    const d10 = calcDaily('Dog', 10, 'Normal')
    expect(d10.kcal).toBeGreaterThan(d5.kcal)
  })

  it('waterTargetMl depends on species', () => {
    expect(waterTargetMl('Cat', 4)).toBeGreaterThan(0)
    expect(waterTargetMl('Dog', 10)).toBeGreaterThan(0)
  })

  it('mealsPerDay for puppies/kittens <1y is 3', () => {
    expect(mealsPerDay('Dog', 0.5)).toBe(3)
    expect(mealsPerDay('Cat', 2)).toBe(2)
  })
})
