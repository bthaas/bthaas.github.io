export interface FramePacer {
  readonly shouldRender: (now: number) => boolean
}

// Vsync timestamps jitter by a fraction of a millisecond, so a frame that lands
// slightly before its deadline still counts; otherwise a 60 fps cap on a 60 Hz
// display would skip alternate frames.
const VSYNC_TOLERANCE_MS = 2

/**
 * Paces renders against a fixed schedule of deadlines rather than the time since
 * the last render, so refresh rates that are not a multiple of the cap (75, 90,
 * 144 Hz) mix short and long gaps and still average the requested rate.
 */
export function createFramePacer(fps: number): FramePacer {
  if (!Number.isFinite(fps) || fps <= 0) {
    throw new RangeError(`Frame rate must be a positive number, received ${fps}`)
  }

  const intervalMs = 1000 / fps
  let nextRenderTime = Number.NEGATIVE_INFINITY

  return {
    shouldRender: (now) => {
      if (now < nextRenderTime - VSYNC_TOLERANCE_MS) return false
      // After a pause (hidden tab, idle scene) restart the schedule instead of
      // bursting to catch up on missed deadlines.
      nextRenderTime = now - nextRenderTime > intervalMs
        ? now + intervalMs
        : nextRenderTime + intervalMs
      return true
    },
  }
}
