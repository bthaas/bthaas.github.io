import { getExperienceLighting } from '../../lib/descent-choreography'

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

export function setupDossiers(root: Document = document): () => void {
  const cleanups: Array<() => void> = []
  const enhanced = root.documentElement.classList.contains('atlas-js')

  root.querySelectorAll<HTMLElement>('[data-dossier]').forEach((dossier) => {
    const toggle = dossier.querySelector<HTMLButtonElement>('.flight-dossier__toggle')
    if (!toggle) return

    setDossierState(dossier, !enhanced)
    dossier.dataset.dossierReady = ''
    dossier.dataset.dossierAnimate = ''

    const handleClick = () => {
      setDossierState(dossier, toggle.getAttribute('aria-expanded') !== 'true')
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      handleClick()
    }
    toggle.addEventListener('click', handleClick)
    toggle.addEventListener('keydown', handleKeyDown)
    cleanups.push(() => {
      toggle.removeEventListener('click', handleClick)
      toggle.removeEventListener('keydown', handleKeyDown)
      delete dossier.dataset.dossierReady
      delete dossier.dataset.dossierAnimate
      setDossierState(dossier, true)
    })
  })

  return () => cleanups.forEach((cleanup) => cleanup())
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
