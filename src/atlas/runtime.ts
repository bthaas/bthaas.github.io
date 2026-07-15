import { setupEntrance, setupHeroParallax, setupMetricCountUps } from './hero'
import { setupReveals } from './reveal'
import { createScrollBus, type ScrollBus } from './scroll-bus'
import { setupSectionWayfinding, setupSunArc } from './sun-arc'

interface AtlasRuntimeOptions {
  readonly createBus?: () => ScrollBus
  readonly document?: Document
  readonly matchMedia?: (query: string) => Pick<MediaQueryList, 'matches'>
  readonly prepareEntrance?: (document: Document) => () => void
  readonly prepareHero?: (document: Document, window: Window) => () => void
  readonly prepareMetrics?: (document: Document) => () => void
  readonly prepareReveals?: () => () => void
  readonly prepareSun?: (document: Document, window: Window) => () => void
  readonly prepareWayfinding?: (document: Document) => () => void
  readonly window?: Window
}

export function initializeAtlas({
  createBus = createScrollBus,
  document: runtimeDocument = document,
  matchMedia = (query) => window.matchMedia(query),
  prepareEntrance = setupEntrance,
  prepareHero = setupHeroParallax,
  prepareMetrics = setupMetricCountUps,
  prepareReveals = setupReveals,
  prepareSun = setupSunArc,
  prepareWayfinding = setupSectionWayfinding,
  window: runtimeWindow = window,
}: AtlasRuntimeOptions = {}): () => void {
  const cleanupWayfinding = prepareWayfinding(runtimeDocument)
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return cleanupWayfinding

  const html = runtimeDocument.documentElement
  html.classList.add('atlas-js')
  html.dataset.atlas = 'ready'

  const cleanupEntrance = prepareEntrance(runtimeDocument)
  const cleanupHero = prepareHero(runtimeDocument, runtimeWindow)
  const cleanupMetrics = prepareMetrics(runtimeDocument)
  const cleanupSun = prepareSun(runtimeDocument, runtimeWindow)
  const scrollBus = createBus()
  const unsubscribe = scrollBus.subscribe((snapshot) => {
    runtimeWindow.dispatchEvent(new CustomEvent('atlas:scroll', { detail: snapshot }))
  })
  const cleanupReveals = prepareReveals()
  let isActive = true

  const destroy = () => {
    if (!isActive) return
    isActive = false
    unsubscribe()
    cleanupEntrance()
    cleanupHero()
    cleanupMetrics()
    cleanupSun()
    cleanupWayfinding()
    cleanupReveals()
    scrollBus.destroy()
    runtimeWindow.removeEventListener('pagehide', destroy)
  }

  runtimeWindow.addEventListener('pagehide', destroy, { once: true })
  return destroy
}
