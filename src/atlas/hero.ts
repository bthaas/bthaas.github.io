import { formatCountUpFrame } from '../../lib/atlas-motion/count-up'

import { getAtlasEngine, type AtlasEngine } from './engine'

export function setupMetricCountUps(
  root: Document = document,
  engine: AtlasEngine | null = getAtlasEngine(),
): () => void {
  const strip = root.querySelector<HTMLElement>('.signal-strip')
  const metrics = Array.from(root.querySelectorAll<HTMLElement>('[data-atlas-count]'))
  if (!strip || metrics.length === 0 || !engine) return () => undefined

  strip.dataset.atlasCountReady = ''
  const sources = Array.from(strip.querySelectorAll<HTMLElement>('small'))
  engine.gsap.set(sources, { opacity: 0, y: 5 })
  const tweens: Array<{ kill: () => void }> = []
  let completed = 0
  const trigger = engine.ScrollTrigger.create({
    trigger: strip,
    start: 'top 72%',
    once: true,
    onEnter: () => {
      strip.classList.add('is-counting')
      metrics.forEach((metric) => {
        const target = metric.textContent?.trim() ?? ''
        const counter = { progress: 0 }
        engine.gsap.set(metric, { filter: 'blur(0.75px)' })
        const tween = engine.gsap.to(counter, {
          duration: 0.9,
          ease: 'power2.out',
          progress: 1,
          snap: { progress: 1 / 30 },
          onUpdate: () => {
            metric.textContent = formatCountUpFrame(target, counter.progress)
          },
          onComplete: () => {
            metric.textContent = target
            tweens.push(engine.gsap.to(metric, {
              duration: 0.08,
              ease: 'power1.out',
              filter: 'blur(0px)',
            }))
            completed += 1
            if (completed !== metrics.length) return
            strip.classList.remove('is-counting')
            strip.classList.add('is-counted')
            tweens.push(engine.gsap.to(sources, {
              duration: 0.32,
              ease: 'power2.out',
              opacity: 1,
              stagger: 0.07,
              y: 0,
            }))
          },
        })
        tweens.push(tween)
      })
    },
  })

  return () => {
    trigger.kill()
    tweens.forEach((tween) => tween.kill())
  }
}
