import { describe, expect, it } from 'vitest'

import {
  SUN_SPECTACLE_DURATION_MS,
  advanceKonamiSequence,
  createSunSpectacleFrame,
  writeSunSpectacleFrame,
} from './sun-spectacle'

describe('sun spectacle choreography', () => {
  it('recognizes the complete Konami sequence and recovers after a mismatch', () => {
    const keys = [
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'b',
      'a',
    ]
    let index = 0
    let complete = false

    for (const key of ['x', ...keys]) {
      const result = advanceKonamiSequence(index, key)
      index = result.index
      complete = result.complete
    }

    expect(complete).toBe(true)
    expect(index).toBe(0)
  })

  it('flares first, peaks in a blizzard, then lands one golden feather', () => {
    const frame = createSunSpectacleFrame()

    expect(SUN_SPECTACLE_DURATION_MS).toBeLessThanOrEqual(3_500)

    writeSunSpectacleFrame(220, frame)
    expect(frame.flare).toBeGreaterThan(0.9)
    expect(frame.blizzard).toBeGreaterThan(0)
    expect(frame.goldProgress).toBe(0)

    writeSunSpectacleFrame(1_650, frame)
    expect(frame.blizzard).toBeGreaterThan(0.95)
    expect(frame.goldProgress).toBeGreaterThan(0.2)
    expect(frame.goldProgress).toBeLessThan(0.8)

    writeSunSpectacleFrame(SUN_SPECTACLE_DURATION_MS, frame)
    expect(frame.flare).toBe(0)
    expect(frame.blizzard).toBe(0)
    expect(frame.goldProgress).toBe(1)
    expect(frame.goldRotation).toBe(960)
    expect(frame.complete).toBe(true)
  })

  it('clamps negative and overrun elapsed time without allocating a new frame', () => {
    const frame = createSunSpectacleFrame()

    expect(writeSunSpectacleFrame(-200, frame)).toBe(frame)
    expect(frame.progress).toBe(0)
    writeSunSpectacleFrame(SUN_SPECTACLE_DURATION_MS + 1_000, frame)
    expect(frame.progress).toBe(1)
    expect(frame.complete).toBe(true)
  })
})
