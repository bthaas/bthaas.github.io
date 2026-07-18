import { getExperienceLighting } from '../../lib/descent-choreography'
import { getViewportEntryRange } from '../../lib/atlas-motion/scroll-trigger-range'

import { getAtlasEngine, type AtlasEngine } from './engine'

type ObserverFactory = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit,
) => IntersectionObserver

function setDossierState(dossier: HTMLElement, expanded: boolean) {
  const toggle = dossier.querySelector<HTMLButtonElement>('.flight-dossier__toggle')
  const panel = dossier.querySelector<HTMLElement>('.flight-dossier__panel')
  if (!toggle || !panel) return

  dossier.dataset.state = expanded ? 'open' : 'closed'
  toggle.setAttribute('aria-expanded', String(expanded))
  if (expanded) panel.removeAttribute('aria-hidden')
  else panel.setAttribute('aria-hidden', 'true')
}

export function setupDossiers(
  root: Document = document,
  engine: AtlasEngine | null = getAtlasEngine(),
): () => void {
  const cleanups: Array<() => void> = []
  const animations: Array<{ kill: () => void }> = []
  const splits: Array<{ revert: () => void }> = []
  const triggers: Array<{ kill: () => void }> = []
  const enhanced = root.documentElement.classList.contains('atlas-js')
  const entries = Array.from(root.querySelectorAll<HTMLElement>('.flight-entry'))
  const runtimeWindow = root.defaultView ?? window

  if (engine) {
    entries.forEach((entry) => {
      const rule = entry.querySelector<SVGLineElement>('[data-flight-rule]')
      const index = entry.querySelector<HTMLElement>('.flight-index')
      if (!rule || !index) return

      const split = engine.plugins.SplitText.create(index, { aria: 'auto', type: 'chars' })
      splits.push(split)
      engine.gsap.set(rule, { drawSVG: '0%' })
      engine.gsap.set(split.chars, { opacity: 0, rotationX: -80, yPercent: 105 })
      const measureStart = () => getViewportEntryRange({
        elementTop: entry.getBoundingClientRect().top + runtimeWindow.scrollY,
        endViewportRatio: 0.78,
        startViewportRatio: 0.8,
        viewportHeight: runtimeWindow.innerHeight,
      }).start
      triggers.push(engine.ScrollTrigger.create({
        trigger: entry,
        start: measureStart,
        once: true,
        onEnter: () => {
          animations.push(engine.gsap.fromTo(
            rule,
            { drawSVG: '0%' },
            { drawSVG: '100%', duration: 0.62, ease: 'power2.out' },
          ))
        },
      }))
      triggers.push(engine.ScrollTrigger.create({
        trigger: index,
        start: measureStart,
        once: true,
        onEnter: () => {
          animations.push(engine.gsap.fromTo(
            split.chars,
            { opacity: 0, rotationX: -80, yPercent: 105 },
            {
              duration: 0.46,
              ease: 'power3.out',
              opacity: 1,
              rotationX: 0,
              stagger: 0.06,
              yPercent: 0,
            },
          ))
        },
      }))
    })
  }

  root.querySelectorAll<HTMLElement>('[data-dossier]').forEach((dossier) => {
    const toggle = dossier.querySelector<HTMLButtonElement>('.flight-dossier__toggle')
    if (!toggle) return

    setDossierState(dossier, !enhanced)
    dossier.dataset.dossierReady = ''
    let flipAnimation: { kill: () => void } | null = null

    const handleClick = () => {
      const expanded = toggle.getAttribute('aria-expanded') !== 'true'
      if (!engine) {
        setDossierState(dossier, expanded)
        return
      }

      const state = engine.plugins.Flip.getState(entries)
      setDossierState(dossier, expanded)
      flipAnimation?.kill()
      flipAnimation = engine.plugins.Flip.from(state, {
        absolute: false,
        duration: 0.48,
        ease: 'power3.inOut',
        nested: true,
        onComplete: () => engine.ScrollTrigger.refresh(),
      })
      animations.push(flipAnimation)
    }
    toggle.addEventListener('click', handleClick)
    cleanups.push(() => {
      toggle.removeEventListener('click', handleClick)
      delete dossier.dataset.dossierReady
      setDossierState(dossier, true)
    })
  })

  return () => {
    cleanups.forEach((cleanup) => cleanup())
    triggers.forEach((trigger) => trigger.kill())
    animations.forEach((animation) => animation.kill())
    splits.forEach((split) => split.revert())
  }
}

export function setupExperienceChapter(
  root: Document = document,
  runtimeWindow: Window = window,
  supportsScrollDriven =
    typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()'),
  createObserver: ObserverFactory | undefined =
    typeof IntersectionObserver === 'undefined'
      ? undefined
      : (callback, options) => new IntersectionObserver(callback, options),
): () => void {
  const section = root.querySelector<HTMLElement>('.experience-section')
  const steps = Array.from(
    root.querySelectorAll<HTMLElement>('[data-experience-light-step]'),
  )
  if (supportsScrollDriven || !section || steps.length !== 3 || !createObserver) {
    return () => undefined
  }

  const applyLighting = () => {
    const midpoint = runtimeWindow.innerHeight / 2
    const depth = steps.filter((step) => step.getBoundingClientRect().top <= midpoint).length
    const lighting = getExperienceLighting(depth / steps.length)
    section.style.setProperty('--atlas-experience-darkness', String(lighting.darknessOpacity))
    section.style.setProperty('--atlas-experience-warmth', String(lighting.warmthOpacity))
  }
  const observer = createObserver(applyLighting, {
    rootMargin: '-50% 0px -49% 0px',
    threshold: 0,
  })

  root.documentElement.classList.add('atlas-experience-fallback')
  steps.forEach((step) => observer.observe(step))
  applyLighting()

  return () => {
    observer.disconnect()
    root.documentElement.classList.remove('atlas-experience-fallback')
    section.style.removeProperty('--atlas-experience-darkness')
    section.style.removeProperty('--atlas-experience-warmth')
  }
}
