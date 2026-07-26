import { ATLAS_ROUTE_CHANGE_EVENT } from '../../lib/atlas-events'

import { initializeAtlas } from './runtime'

interface AtlasRouteRuntimeOptions {
  readonly cancelFrame?: (handle: number) => void
  readonly initialize?: () => () => void
  readonly requestFrame?: (callback: FrameRequestCallback) => number
  readonly runtimeDocument?: Document
  readonly runtimeWindow?: Window
}

export { ATLAS_ROUTE_CHANGE_EVENT }

export function installAtlasRouteRuntime({
  cancelFrame,
  initialize = initializeAtlas,
  requestFrame,
  runtimeDocument = document,
  runtimeWindow = window,
}: AtlasRouteRuntimeOptions = {}) {
  const cancelAnimationFrame = cancelFrame
    ?? ((handle: number) => runtimeWindow.cancelAnimationFrame(handle))
  const requestAnimationFrame = requestFrame
    ?? ((callback: FrameRequestCallback) => runtimeWindow.requestAnimationFrame(callback))
  let cleanup: () => void = () => undefined
  let frame = 0
  let initialized = false
  let active = true

  const start = () => {
    if (!active) return
    frame = 0
    if (initialized) cleanup()
    cleanup = initialize()
    initialized = true
  }
  const schedule = () => {
    if (!active) return
    if (frame) cancelAnimationFrame(frame)
    frame = requestAnimationFrame(start)
  }
  const handleReady = () => start()
  const dispose = () => {
    if (!active) return
    active = false
    if (frame) cancelAnimationFrame(frame)
    runtimeDocument.removeEventListener('DOMContentLoaded', handleReady)
    runtimeWindow.removeEventListener(ATLAS_ROUTE_CHANGE_EVENT, schedule)
    runtimeWindow.removeEventListener('pagehide', dispose)
    if (initialized) cleanup()
  }

  runtimeWindow.addEventListener(ATLAS_ROUTE_CHANGE_EVENT, schedule)
  runtimeWindow.addEventListener('pagehide', dispose, { once: true })
  if (runtimeDocument.readyState === 'loading') {
    runtimeDocument.addEventListener('DOMContentLoaded', handleReady, { once: true })
  } else {
    start()
  }

  return dispose
}
