import { setupChapterWipes } from './chapter-wipe'
import { setupContactFinale } from './contact'
import { setupCraftChapter } from './craft'
import { setupCursor } from './cursor'
import { initializeAtlasEngine, type AtlasEngine } from './engine'
import { setupDossiers, setupExperienceChapter } from './experience'
import { setupEntrance, setupHeroParallax, setupMetricCountUps } from './hero'
import { setupHorizonLoader } from './horizon-loader'
import { setupLocalTime } from './local-time'
import { setupMagnetic } from './magnetic'
import { setupMarquee } from './marquee'
import { setupPrintReveals, setupVelocityPlates } from './plates'
import { setupProjectPans } from './projects'
import { setupReveals } from './reveal'
import { createScrollBus, type ScrollBus } from './scroll-bus'
import { setupSectionWayfinding, setupSunArc } from './sun-arc'
import { setupScrambleWayfinding } from './wayfinding'

interface AtlasRuntimeOptions {
  readonly createBus?: (engine: AtlasEngine) => ScrollBus
  readonly createEngine?: () => AtlasEngine | null
  readonly document?: Document
  readonly matchMedia?: (query: string) => Pick<MediaQueryList, 'matches'>
  readonly prepareEntrance?: (document: Document) => () => void
  readonly prepareCraft?: (document: Document, window: Window) => () => void
  readonly prepareContact?: (document: Document, window: Window) => () => void
  readonly prepareCursor?: (document: Document) => () => void
  readonly prepareDossiers?: (document: Document) => () => void
  readonly prepareHero?: (document: Document, window: Window) => () => void
  readonly prepareHorizon?: (document: Document) => () => void
  readonly prepareExperience?: (document: Document, window: Window) => () => void
  readonly prepareMetrics?: (document: Document) => () => void
  readonly prepareMagnetic?: (document: Document) => () => void
  readonly prepareMarquee?: (document: Document) => () => void
  readonly prepareLocalTime?: (document: Document) => () => void
  readonly prepareProjects?: (document: Document, window: Window) => () => void
  readonly preparePrintReveals?: (document: Document, window: Window) => () => void
  readonly prepareReveals?: () => () => void
  readonly prepareSun?: (document: Document, window: Window) => () => void
  readonly prepareScramble?: (document: Document) => () => void
  readonly prepareVelocityPlates?: (document: Document) => () => void
  readonly prepareWayfinding?: (document: Document) => () => void
  readonly prepareWipes?: (document: Document) => () => void
  readonly window?: Window
}

export function initializeAtlas({
  createBus,
  createEngine,
  document: runtimeDocument = document,
  matchMedia = (query) => window.matchMedia(query),
  prepareEntrance = setupEntrance,
  prepareCraft = setupCraftChapter,
  prepareContact = setupContactFinale,
  prepareCursor = setupCursor,
  prepareDossiers = setupDossiers,
  prepareHero = setupHeroParallax,
  prepareHorizon = setupHorizonLoader,
  prepareExperience = setupExperienceChapter,
  prepareMetrics = setupMetricCountUps,
  prepareMagnetic = setupMagnetic,
  prepareMarquee = setupMarquee,
  prepareLocalTime = setupLocalTime,
  prepareProjects = setupProjectPans,
  preparePrintReveals = setupPrintReveals,
  prepareReveals = setupReveals,
  prepareSun = setupSunArc,
  prepareScramble = setupScrambleWayfinding,
  prepareVelocityPlates = setupVelocityPlates,
  prepareWayfinding = setupSectionWayfinding,
  prepareWipes = setupChapterWipes,
  window: runtimeWindow = window,
}: AtlasRuntimeOptions = {}): () => void {
  const cleanupWayfinding = prepareWayfinding(runtimeDocument)
  const cleanupLocalTime = prepareLocalTime(runtimeDocument)
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const cleanupDossiers = prepareDossiers(runtimeDocument)
    return () => {
      cleanupDossiers()
      cleanupLocalTime()
      cleanupWayfinding()
    }
  }

  const engine = (createEngine ?? (() => initializeAtlasEngine({ matchMedia })))()
  if (!engine) {
    const cleanupDossiers = prepareDossiers(runtimeDocument)
    return () => {
      cleanupDossiers()
      cleanupLocalTime()
      cleanupWayfinding()
    }
  }

  const html = runtimeDocument.documentElement
  html.classList.add('atlas-js')
  html.dataset.atlas = 'ready'

  const cleanupEntrance = prepareEntrance(runtimeDocument)
  const cleanupCraft = prepareCraft(runtimeDocument, runtimeWindow)
  const cleanupContact = prepareContact(runtimeDocument, runtimeWindow)
  const cleanupCursor = prepareCursor(runtimeDocument)
  const cleanupDossiers = prepareDossiers(runtimeDocument)
  const cleanupExperience = prepareExperience(runtimeDocument, runtimeWindow)
  const cleanupHero = prepareHero(runtimeDocument, runtimeWindow)
  const cleanupHorizon = prepareHorizon(runtimeDocument)
  const cleanupMetrics = prepareMetrics(runtimeDocument)
  const cleanupMagnetic = prepareMagnetic(runtimeDocument)
  const cleanupMarquee = prepareMarquee(runtimeDocument)
  const cleanupProjects = prepareProjects(runtimeDocument, runtimeWindow)
  const cleanupPrintReveals = preparePrintReveals(runtimeDocument, runtimeWindow)
  const cleanupScramble = prepareScramble(runtimeDocument)
  const cleanupSun = prepareSun(runtimeDocument, runtimeWindow)
  const cleanupVelocityPlates = prepareVelocityPlates(runtimeDocument)
  const cleanupWipes = prepareWipes(runtimeDocument)
  const scrollBus = (createBus ?? ((activeEngine) => createScrollBus({
    document: runtimeDocument,
    engine: activeEngine,
    window: runtimeWindow,
  })))(engine)
  const unsubscribe = scrollBus.subscribe((snapshot) => {
    runtimeWindow.dispatchEvent(new CustomEvent('atlas:scroll', { detail: snapshot }))
  })
  const cleanupReveals = prepareReveals()
  let isActive = true
  const refreshScrollTriggers = () => {
    if (isActive) engine.ScrollTrigger.refresh()
  }
  let refreshFrame = 0
  const scheduleRefresh = () => {
    if (!isActive) return
    runtimeWindow.cancelAnimationFrame(refreshFrame)
    refreshFrame = runtimeWindow.requestAnimationFrame(() => {
      refreshFrame = runtimeWindow.requestAnimationFrame(() => {
        refreshFrame = 0
        refreshScrollTriggers()
      })
    })
  }
  const handleLoad = () => scheduleRefresh()
  const ResizeObserverConstructor = runtimeDocument.defaultView?.ResizeObserver
  const layoutObserver = ResizeObserverConstructor
    ? new ResizeObserverConstructor(scheduleRefresh)
    : null
  layoutObserver?.observe(runtimeDocument.querySelector('main') ?? runtimeDocument.documentElement)
  refreshScrollTriggers()
  if (runtimeDocument.readyState === 'complete') scheduleRefresh()
  else runtimeWindow.addEventListener('load', handleLoad, { once: true })
  void runtimeDocument.fonts?.ready.then(scheduleRefresh)

  const destroy = () => {
    if (!isActive) return
    isActive = false
    runtimeWindow.cancelAnimationFrame(refreshFrame)
    runtimeWindow.removeEventListener('load', handleLoad)
    layoutObserver?.disconnect()
    unsubscribe()
    cleanupEntrance()
    cleanupCraft()
    cleanupContact()
    cleanupCursor()
    cleanupDossiers()
    cleanupExperience()
    cleanupHero()
    cleanupHorizon()
    cleanupMetrics()
    cleanupMagnetic()
    cleanupMarquee()
    cleanupProjects()
    cleanupPrintReveals()
    cleanupScramble()
    cleanupSun()
    cleanupVelocityPlates()
    cleanupWipes()
    cleanupLocalTime()
    cleanupWayfinding()
    cleanupReveals()
    scrollBus.destroy()
    engine.destroy()
    runtimeWindow.removeEventListener('pagehide', destroy)
  }

  runtimeWindow.addEventListener('pagehide', destroy, { once: true })
  return destroy
}
