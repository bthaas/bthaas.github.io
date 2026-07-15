import { setupReveals } from './reveal'
import { createScrollBus, type ScrollBus } from './scroll-bus'

interface AtlasRuntimeOptions {
  readonly createBus?: () => ScrollBus
  readonly document?: Document
  readonly matchMedia?: (query: string) => Pick<MediaQueryList, 'matches'>
  readonly prepareReveals?: () => () => void
  readonly window?: Window
}

export function initializeAtlas({
  createBus = createScrollBus,
  document: runtimeDocument = document,
  matchMedia = (query) => window.matchMedia(query),
  prepareReveals = setupReveals,
  window: runtimeWindow = window,
}: AtlasRuntimeOptions = {}): () => void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => undefined

  const html = runtimeDocument.documentElement
  html.classList.add('atlas-js')
  html.dataset.atlas = 'ready'

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
    cleanupReveals()
    scrollBus.destroy()
    runtimeWindow.removeEventListener('pagehide', destroy)
  }

  runtimeWindow.addEventListener('pagehide', destroy, { once: true })
  return destroy
}
