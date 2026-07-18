import { getMagneticOffset } from '../../lib/atlas-motion/kinetics'

import { hasFinePointer } from './capabilities'
import { getAtlasEngine, type AtlasEngine } from './engine'

type FinePointerCheck = () => boolean

export function setupMagnetic(
  root: Document = document,
  finePointer: FinePointerCheck = hasFinePointer,
  engine: AtlasEngine | null = getAtlasEngine(),
): () => void {
  if (!finePointer() || !engine) return () => undefined

  const cleanups: Array<() => void> = []
  root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((element) => {
    let centerX = 0
    let centerY = 0
    const xTo = engine.gsap.quickTo(element, 'x', { duration: 0.18, ease: 'power3.out' })
    const yTo = engine.gsap.quickTo(element, 'y', { duration: 0.18, ease: 'power3.out' })
    let release: { kill: () => void } | null = null
    const measure = () => {
      const bounds = element.getBoundingClientRect()
      centerX = bounds.left + bounds.width / 2
      centerY = bounds.top + bounds.height / 2
    }
    const handleEnter = () => measure()
    const handleMove = (event: PointerEvent) => {
      const offset = getMagneticOffset({
        centerX,
        centerY,
        pointerX: event.clientX,
        pointerY: event.clientY,
      })
      xTo(offset.x)
      yTo(offset.y)
    }
    const handleLeave = () => {
      release?.kill()
      release = engine.gsap.to(element, {
        duration: 0.4,
        ease: 'elastic.out(1, 0.45)',
        overwrite: true,
        x: 0,
        y: 0,
      })
    }

    element.dataset.magneticReady = ''
    element.addEventListener('pointerenter', handleEnter)
    element.addEventListener('pointermove', handleMove)
    element.addEventListener('pointerleave', handleLeave)
    cleanups.push(() => {
      element.removeEventListener('pointerenter', handleEnter)
      element.removeEventListener('pointermove', handleMove)
      element.removeEventListener('pointerleave', handleLeave)
      release?.kill()
      xTo.tween.kill()
      yTo.tween.kill()
      engine.gsap.set(element, { clearProps: 'transform' })
      delete element.dataset.magneticReady
    })
  })

  return () => cleanups.forEach((cleanup) => cleanup())
}
