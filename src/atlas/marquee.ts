import { getMarqueeVelocityFrame } from '../../lib/atlas-motion/kinetics'

import { getAtlasEngine, type AtlasEngine } from './engine'

export function setupMarquee(
  root: Document = document,
  engine: AtlasEngine | null = getAtlasEngine(),
): () => void {
  const marquee = root.querySelector<HTMLElement>('[data-craft-marquee]')
  const track = marquee?.querySelector<HTMLElement>('.craft-marquee__track')
  if (!engine || !marquee || !track) return () => undefined

  const loop = engine.gsap.timeline()
  loop.fromTo(
    track,
    { xPercent: 0 },
    { duration: 28, ease: 'none', repeat: -1, xPercent: -50 },
  )
  const skewTo = engine.gsap.quickTo(track, 'skewX', {
    duration: 0.24,
    ease: 'power3.out',
  })
  const settle = engine.gsap.delayedCall(0.1, () => {
    loop.timeScale(1)
    skewTo(0)
  })
  settle.pause()
  const trigger = engine.ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const frame = getMarqueeVelocityFrame(self.getVelocity())
      loop.timeScale(frame.timeScale)
      skewTo(frame.skewX)
      settle.restart(true)
    },
  })

  let isHovered = false
  let hasFocus = false
  const updatePlayback = () => {
    if (isHovered || hasFocus) loop.pause()
    else loop.resume()
  }
  const handleEnter = () => {
    isHovered = true
    updatePlayback()
  }
  const handleLeave = () => {
    isHovered = false
    updatePlayback()
  }
  const handleFocusIn = () => {
    hasFocus = true
    updatePlayback()
  }
  const handleFocusOut = (event: FocusEvent) => {
    if (event.relatedTarget instanceof Node && marquee.contains(event.relatedTarget)) return
    hasFocus = false
    updatePlayback()
  }
  marquee.addEventListener('pointerenter', handleEnter)
  marquee.addEventListener('pointerleave', handleLeave)
  marquee.addEventListener('focusin', handleFocusIn)
  marquee.addEventListener('focusout', handleFocusOut)

  return () => {
    marquee.removeEventListener('pointerenter', handleEnter)
    marquee.removeEventListener('pointerleave', handleLeave)
    marquee.removeEventListener('focusin', handleFocusIn)
    marquee.removeEventListener('focusout', handleFocusOut)
    trigger.kill()
    settle.kill()
    skewTo.tween.kill()
    loop.kill()
  }
}
