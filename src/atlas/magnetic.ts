import { hasFinePointer } from './capabilities'

type FinePointerCheck = () => boolean
type RequestFrame = (callback: FrameRequestCallback) => number
type CancelFrame = (handle: number) => void

const clampMagnet = (value: number) => Math.max(-6, Math.min(6, value))

export function setupMagnetic(
  root: Document = document,
  finePointer: FinePointerCheck = hasFinePointer,
  requestFrame: RequestFrame = requestAnimationFrame,
  cancelFrame: CancelFrame = cancelAnimationFrame,
): () => void {
  if (!finePointer()) return () => undefined

  const cleanups: Array<() => void> = []
  root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((element) => {
    let animationFrame = 0
    let centerX = 0
    let centerY = 0
    let currentX = 0
    let currentY = 0
    let targetX = 0
    let targetY = 0

    const render = () => {
      currentX += (targetX - currentX) * 0.24
      currentY += (targetY - currentY) * 0.24
      element.style.setProperty('--atlas-magnet-x', `${Number(currentX.toFixed(3))}px`)
      element.style.setProperty('--atlas-magnet-y', `${Number(currentY.toFixed(3))}px`)

      if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
        animationFrame = requestFrame(render)
      } else {
        animationFrame = 0
      }
    }
    const queueRender = () => {
      if (animationFrame === 0) animationFrame = requestFrame(render)
    }
    const measure = () => {
      const bounds = element.getBoundingClientRect()
      centerX = bounds.left + bounds.width / 2
      centerY = bounds.top + bounds.height / 2
    }
    const handleEnter = () => measure()
    const handleMove = (event: PointerEvent) => {
      targetX = clampMagnet((event.clientX - centerX) * 0.12)
      targetY = clampMagnet((event.clientY - centerY) * 0.12)
      queueRender()
    }
    const handleLeave = () => {
      targetX = 0
      targetY = 0
      queueRender()
    }

    element.dataset.magneticReady = ''
    element.addEventListener('pointerenter', handleEnter)
    element.addEventListener('pointermove', handleMove)
    element.addEventListener('pointerleave', handleLeave)
    cleanups.push(() => {
      cancelFrame(animationFrame)
      element.removeEventListener('pointerenter', handleEnter)
      element.removeEventListener('pointermove', handleMove)
      element.removeEventListener('pointerleave', handleLeave)
      element.style.removeProperty('--atlas-magnet-x')
      element.style.removeProperty('--atlas-magnet-y')
      delete element.dataset.magneticReady
    })
  })

  return () => cleanups.forEach((cleanup) => cleanup())
}
