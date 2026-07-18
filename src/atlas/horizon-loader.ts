import { getAtlasEngine, type AtlasEngine } from './engine'

declare const __ATLAS_HORIZON_SOURCE__: string

interface HorizonWindow extends Window {
  __atlasHorizon?: { destroy: () => void }
}

const defaultHorizonSource = typeof __ATLAS_HORIZON_SOURCE__ === 'string'
  ? __ATLAS_HORIZON_SOURCE__
  : '/horizon.js'

export function setupHorizonLoader(
  root: Document = document,
  engine: AtlasEngine | null = getAtlasEngine(),
  source = defaultHorizonSource,
): () => void {
  const section = root.querySelector<HTMLElement>('[data-contact-finale]')
  const viewportWidth = root.defaultView?.innerWidth ?? Number.POSITIVE_INFINITY
  if (!section || !engine || engine.isCoarsePointer || viewportWidth <= 720) {
    return () => undefined
  }

  let script: HTMLScriptElement | null = null
  const load = () => {
    if (script || root.querySelector('script[data-atlas-horizon]')) return
    script = root.createElement('script')
    script.async = true
    script.dataset.atlasHorizon = ''
    script.src = source
    root.body.append(script)
  }
  const trigger = engine.ScrollTrigger.create({
    trigger: section,
    start: 'top bottom+=50%',
    once: true,
    onEnter: load,
  })

  return () => {
    trigger.kill()
    ;(root.defaultView as HorizonWindow | null)?.__atlasHorizon?.destroy()
    delete (root.defaultView as HorizonWindow | null)?.__atlasHorizon
    script?.remove()
    script = null
  }
}
