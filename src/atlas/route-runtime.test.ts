import { describe, expect, it, vi } from 'vitest'

import {
  ATLAS_ROUTE_CHANGE_EVENT,
  installAtlasRouteRuntime,
} from './route-runtime'

describe('installAtlasRouteRuntime', () => {
  it('reinitializes once against the committed DOM when client routing changes', () => {
    const scheduled = new Map<number, FrameRequestCallback>()
    const cleanupFirst = vi.fn()
    const cleanupSecond = vi.fn()
    const initialize = vi.fn()
      .mockReturnValueOnce(cleanupFirst)
      .mockReturnValueOnce(cleanupSecond)
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      const id = scheduled.size + 1
      scheduled.set(id, callback)
      return id
    })
    const cancelFrame = vi.fn((id: number) => scheduled.delete(id))
    const dispose = installAtlasRouteRuntime({
      cancelFrame,
      initialize,
      requestFrame,
      runtimeWindow: window,
    })

    expect(initialize).toHaveBeenCalledOnce()

    window.dispatchEvent(new CustomEvent(ATLAS_ROUTE_CHANGE_EVENT))
    window.dispatchEvent(new CustomEvent(ATLAS_ROUTE_CHANGE_EVENT))
    expect(initialize).toHaveBeenCalledOnce()
    expect(cancelFrame).toHaveBeenCalledOnce()

    const latestFrame = Array.from(scheduled.values()).at(-1)
    latestFrame?.(16)
    expect(cleanupFirst).toHaveBeenCalledOnce()
    expect(initialize).toHaveBeenCalledTimes(2)

    dispose()
    expect(cleanupSecond).toHaveBeenCalledOnce()
  })
})
