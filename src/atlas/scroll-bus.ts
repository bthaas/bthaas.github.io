import { getDocumentProgress } from '../../lib/atlas-motion/progress'
import { getAtlasEngine, type AtlasEngine } from './engine'

export interface ScrollSnapshot {
  readonly documentProgress: number
  readonly scrollY: number
}

export type ScrollSubscriber = (snapshot: ScrollSnapshot) => void

export interface ScrollBus {
  readonly destroy: () => void
  readonly subscribe: (subscriber: ScrollSubscriber) => () => void
}

interface ScrollBusOptions {
  readonly document?: Document
  readonly engine?: AtlasEngine | null
  readonly window?: Window
}

export function createScrollBus({
  document: runtimeDocument = document,
  engine = getAtlasEngine(),
  window: runtimeWindow = window,
}: ScrollBusOptions = {}): ScrollBus {
  const subscribers = new Set<ScrollSubscriber>()

  const readSnapshot = (): ScrollSnapshot => {
    const scrollY = engine?.lenis.scroll ?? runtimeWindow.scrollY
    return {
      documentProgress: getDocumentProgress({
        scrollHeight: runtimeDocument.documentElement.scrollHeight,
        scrollY,
        viewportHeight: runtimeWindow.innerHeight,
      }),
      scrollY,
    }
  }

  const publish = () => {
    const snapshot = {
      ...readSnapshot(),
    }
    subscribers.forEach((subscriber) => subscriber(snapshot))
  }

  const trigger = engine?.ScrollTrigger.create({
    end: 'max',
    onRefresh: publish,
    onUpdate: publish,
    start: 0,
    trigger: runtimeDocument.documentElement,
  })

  return {
    destroy: () => {
      trigger?.kill()
      subscribers.clear()
    },
    subscribe: (subscriber) => {
      subscribers.add(subscriber)
      subscriber(readSnapshot())
      return () => subscribers.delete(subscriber)
    },
  }
}
