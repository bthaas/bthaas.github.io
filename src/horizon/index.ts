import {
  createFlock,
  getFlockFrameDelta,
  stepFlock,
  type FlockBird,
} from '../../lib/atlas-motion/flock'

interface HorizonWindow extends Window {
  __atlasHorizon?: { destroy: () => void }
}

const BIRD_COUNT = 24
const COLORS = ['57 49 82', '13 78 184'] as const
const target = document.querySelector<HTMLElement>('[data-horizon-flock]')

if (target) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { alpha: true })
  let birds = createFlock(BIRD_COUNT, 73)
  let frame = 0
  let height = 1
  let width = 1
  let lastRenderTime = performance.now()
  let isVisible = typeof IntersectionObserver === 'undefined'
  let statsStart = 0
  let statsFrames = 0
  const collectStats = new URLSearchParams(location.search).has('stats')

  const resize = () => {
    const bounds = target.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    width = Math.max(1, bounds.width)
    height = Math.max(1, bounds.height)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    context?.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  const drawBird = (bird: FlockBird) => {
    if (!context) return
    const x = bird.x * width
    const y = bird.y * height
    const edgeFade = Math.min(1, (bird.x + 0.05) * 6, (1.05 - bird.x) * 6)
    const horizonFade = 1 - Math.max(0, bird.y - 0.58) / 0.14
    const opacity = Math.max(0.18, Math.min(edgeFade, horizonFade)) * 0.72
    const scale = bird.size * Math.max(0.8, width / 720)
    const angle = Math.atan2(bird.vy * height, bird.vx * width)

    context.save()
    context.translate(x, y)
    context.rotate(angle)
    context.scale(scale, scale)
    context.fillStyle = `rgb(${COLORS[bird.colorIndex]} / ${opacity})`
    context.beginPath()
    context.ellipse(0, 0, 3.5, 1.15, 0, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }
  const render = (time: number) => {
    const delta = getFlockFrameDelta(lastRenderTime, time)
    if (isVisible && context && delta !== null) {
      lastRenderTime = time
      birds = stepFlock(birds, delta)
      context.clearRect(0, 0, width, height)
      birds.forEach(drawBird)
      if (collectStats) {
        if (statsStart === 0) statsStart = time
        statsFrames += 1
        const elapsed = time - statsStart
        if (elapsed >= 2000 && !target.dataset.horizonFps) {
          target.dataset.horizonFps = (statsFrames * 1000 / elapsed).toFixed(1)
        }
      }
    }
    frame = window.requestAnimationFrame(render)
  }

  target.append(canvas)
  resize()
  const resizeObserver = typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver(resize)
  const visibilityObserver = typeof IntersectionObserver === 'undefined'
    ? null
    : new IntersectionObserver(([entry]) => {
        const nextVisible = entry?.isIntersecting ?? false
        if (nextVisible !== isVisible) {
          statsStart = 0
          statsFrames = 0
          delete target.dataset.horizonFps
        }
        isVisible = nextVisible
        lastRenderTime = performance.now()
      }, { rootMargin: '15% 0px' })
  resizeObserver?.observe(target)
  visibilityObserver?.observe(target)
  frame = window.requestAnimationFrame(render)

  ;(window as HorizonWindow).__atlasHorizon = {
    destroy: () => {
      window.cancelAnimationFrame(frame)
      resizeObserver?.disconnect()
      visibilityObserver?.disconnect()
      canvas.remove()
      delete target.dataset.horizonFps
    },
  }
}
