import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FrameRateLimiter } from './FrameRateLimiter'

const invalidate = vi.fn()

vi.mock('@react-three/fiber', () => ({
  useThree: (selector: (state: { invalidate: () => void }) => unknown) => selector({ invalidate }),
}))

let queuedFrame: FrameRequestCallback | null = null

function runFrames(refreshRate: number, frames: number) {
  const frameMs = 1000 / refreshRate
  for (let index = 1; index <= frames; index += 1) {
    const callback = queuedFrame
    queuedFrame = null
    callback?.(index * frameMs)
  }
}

describe('FrameRateLimiter', () => {
  beforeEach(() => {
    invalidate.mockClear()
    queuedFrame = null
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      queuedFrame = callback
      return 7
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => vi.unstubAllGlobals())

  it('invalidates a demand canvas at the capped rate instead of every refresh', () => {
    render(<FrameRateLimiter fps={60} />)

    runFrames(120, 120)

    expect(invalidate).toHaveBeenCalledTimes(60)
  })

  it('skips invalidation while the scene reports nothing to draw', () => {
    let idle = true
    render(<FrameRateLimiter fps={60} shouldRender={() => !idle} />)

    runFrames(60, 30)
    expect(invalidate).not.toHaveBeenCalled()

    idle = false
    runFrames(60, 30)
    expect(invalidate).toHaveBeenCalledTimes(30)
  })

  it('follows the display refresh while the scene reports active motion', () => {
    let moving = true
    render(<FrameRateLimiter fps={60} fullRate={() => moving} />)

    runFrames(120, 120)
    expect(invalidate).toHaveBeenCalledTimes(120)

    moving = false
    invalidate.mockClear()
    runFrames(120, 120)
    expect(invalidate).toHaveBeenCalledTimes(60)
  })

  it('stops its frame loop on unmount', () => {
    const { unmount } = render(<FrameRateLimiter fps={30} />)

    unmount()

    expect(cancelAnimationFrame).toHaveBeenCalledWith(7)
  })
})
