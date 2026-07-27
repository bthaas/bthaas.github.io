import { setupContactFinale } from './contact'
import { setupCursor } from './cursor'
import { initializeAtlasEngine, type AtlasEngine } from './engine'
import { setupHorizonLoader } from './horizon-loader'
import { setupLocalTime } from './local-time'
import { setupMagnetic } from './magnetic'
import { setupProjectPans } from './projects'
import { setupReveals } from './reveal'
import { createScrollBus, type ScrollBus } from './scroll-bus'
import { setupScrambleWayfinding } from './wayfinding'

interface AtlasRuntimeOptions {
  readonly createBus?: (engine: AtlasEngine) => ScrollBus
  readonly createEngine?: () => AtlasEngine | null
  readonly document?: Document
  readonly matchMedia?: (query: string) => Pick<MediaQueryList, 'matches'>
  readonly prepareContact?: (document: Document, window: Window) => () => void
  readonly prepareCursor?: (document: Document) => () => void
  readonly prepareHorizon?: (document: Document) => () => void
  readonly prepareMagnetic?: (document: Document) => () => void
  readonly prepareLocalTime?: (document: Document) => () => void
  readonly prepareProjects?: (document: Document, window: Window) => () => void
  readonly prepareReveals?: () => () => void
  readonly prepareScramble?: (document: Document) => () => void
  readonly window?: Window
}

export function initializeAtlas({
  createBus,
  createEngine,
  document: runtimeDocument = document,
  matchMedia = (query) => window.matchMedia(query),
  prepareContact = setupContactFinale,
  prepareCursor = setupCursor,
  prepareHorizon = setupHorizonLoader,
  prepareMagnetic = setupMagnetic,
  prepareLocalTime = setupLocalTime,
  prepareProjects = setupProjectPans,
  prepareReveals = setupReveals,
  prepareScramble = setupScrambleWayfinding,
  window: runtimeWindow = window,
}: AtlasRuntimeOptions = {}): () => void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {}
  }

  const engine = (createEngine ?? (() => initializeAtlasEngine({ matchMedia })))()
  if (!engine) {
    return () => {}
  }

  const html = runtimeDocument.documentElement
  html.classList.add('atlas-js')
  html.dataset.atlas = 'ready'

  const cleanupLocalTime = prepareLocalTime(runtimeDocument)
  const cleanupContact = prepareContact(runtimeDocument, runtimeWindow)
  const cleanupCursor = prepareCursor(runtimeDocument)
  const cleanupHorizon = prepareHorizon(runtimeDocument)
  const cleanupMagnetic = prepareMagnetic(runtimeDocument)
  const cleanupProjects = prepareProjects(runtimeDocument, runtimeWindow)
  const cleanupScramble = prepareScramble(runtimeDocument)
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
    cleanupContact()
    cleanupCursor()
    cleanupHorizon()
    cleanupMagnetic()
    cleanupProjects()
    cleanupScramble()
    cleanupLocalTime()
    cleanupReveals()
    scrollBus.destroy()
    engine.destroy()
    runtimeWindow.removeEventListener('pagehide', destroy)
  }

  runtimeWindow.addEventListener('pagehide', destroy, { once: true })
  return destroy
}
