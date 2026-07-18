import { getViewportEntryRange } from '../../lib/atlas-motion/scroll-trigger-range'

import { getAtlasEngine, type AtlasEngine } from './engine'

const UPPERCASE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 /·'

export function setupScrambleWayfinding(
  root: Document = document,
  engine: AtlasEngine | null = getAtlasEngine(),
): () => void {
  if (!engine) return () => undefined

  const runtimeWindow = root.defaultView ?? window
  const navLabels = Array.from(root.querySelectorAll<HTMLElement>('.nav-links a'))
  const revealLabels = Array.from(
    root.querySelectorAll<HTMLElement>('.eyebrow, .art-caption'),
  )
  const targets = [...navLabels, ...revealLabels]
  const originalLabels = new Map(targets.map((target) => [target, target.getAttribute('aria-label')]))
  const originalText = new Map(targets.map((target) => [target, target.textContent?.trim() ?? '']))
  const tweens: Array<{ kill: () => void }> = []
  const triggers: Array<{ kill: () => void }> = []
  const cleanups: Array<() => void> = []

  const decode = (target: HTMLElement) => {
    const text = originalText.get(target) ?? ''
    if (!text) return
    tweens.push(engine.gsap.to(target, {
      duration: 0.45,
      ease: 'none',
      scrambleText: {
        chars: UPPERCASE_CHARSET,
        revealDelay: 0.08,
        speed: 0.65,
        text,
      },
    }))
  }

  targets.forEach((target) => {
    const text = originalText.get(target)
    if (text) target.setAttribute('aria-label', text)
  })
  navLabels.forEach((label) => {
    const handleRepeat = () => decode(label)
    label.addEventListener('pointerenter', handleRepeat)
    label.addEventListener('focus', handleRepeat)
    cleanups.push(() => {
      label.removeEventListener('pointerenter', handleRepeat)
      label.removeEventListener('focus', handleRepeat)
    })
    decode(label)
  })
  revealLabels.forEach((label) => {
    const measureStart = () => getViewportEntryRange({
      elementTop: label.getBoundingClientRect().top + runtimeWindow.scrollY,
      endViewportRatio: 0.84,
      startViewportRatio: 0.85,
      viewportHeight: runtimeWindow.innerHeight,
    }).start
    triggers.push(engine.ScrollTrigger.create({
      trigger: label,
      start: measureStart,
      once: true,
      onEnter: () => decode(label),
    }))
  })

  return () => {
    cleanups.forEach((cleanup) => cleanup())
    triggers.forEach((trigger) => trigger.kill())
    tweens.forEach((tween) => tween.kill())
    originalLabels.forEach((ariaLabel, target) => {
      if (ariaLabel === null) target.removeAttribute('aria-label')
      else target.setAttribute('aria-label', ariaLabel)
    })
  }
}
