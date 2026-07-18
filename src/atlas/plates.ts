import { getPlateVelocityFrame } from '../../lib/atlas-motion/kinetics'
import { getViewportEntryRange } from '../../lib/atlas-motion/scroll-trigger-range'

import { getAtlasEngine, type AtlasEngine } from './engine'

export function setupVelocityPlates(
  root: Document = document,
  engine: AtlasEngine | null = getAtlasEngine(),
): () => void {
  const plates = Array.from(
    root.querySelectorAll<HTMLElement>('[data-atlas-velocity-plate]'),
  )
  if (!engine || plates.length === 0) return () => undefined

  const setters = plates.map((plate) => ({
    skew: engine.gsap.quickTo(plate, '--atlas-plate-skew', {
      duration: 0.28,
      ease: 'power3.out',
    }),
    scale: engine.gsap.quickTo(plate, '--atlas-plate-scale', {
      duration: 0.28,
      ease: 'power3.out',
    }),
  }))
  const applyVelocity = (velocity: number) => {
    const frame = getPlateVelocityFrame(velocity)
    setters.forEach(({ scale, skew }) => {
      skew(frame.skewY)
      scale(frame.scale)
    })
  }
  const settle = engine.gsap.delayedCall(0.08, () => applyVelocity(0))
  settle.pause()
  const trigger = engine.ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      applyVelocity(self.getVelocity())
      settle.restart(true)
    },
  })

  return () => {
    trigger.kill()
    settle.kill()
    setters.forEach(({ scale, skew }) => {
      scale.tween.kill()
      skew.tween.kill()
    })
    engine.gsap.set(plates, { clearProps: '--atlas-plate-scale,--atlas-plate-skew' })
  }
}

export function setupPrintReveals(
  root: Document = document,
  runtimeWindow: Window = window,
  engine: AtlasEngine | null = getAtlasEngine(),
): () => void {
  const plates = Array.from(root.querySelectorAll<HTMLElement>('[data-atlas-print-plate]'))
  if (!engine || plates.length === 0) return () => undefined

  const timelines = plates.map((plate) => {
    const measureRange = () => getViewportEntryRange({
      elementTop: plate.getBoundingClientRect().top + runtimeWindow.scrollY,
      endViewportRatio: 0.35,
      startViewportRatio: 0.86,
      viewportHeight: runtimeWindow.innerHeight,
    })
    const timeline = engine.gsap.timeline({
      scrollTrigger: {
        trigger: plate,
        start: () => measureRange().start,
        end: () => measureRange().end,
        scrub: 0.65,
      },
    })
    timeline.fromTo(
      plate,
      { '--atlas-print-dot': '0px' },
      { '--atlas-print-dot': '10px', ease: 'none' },
      0,
    )
    return timeline
  })

  return () => timelines.forEach((timeline) => timeline.kill())
}
