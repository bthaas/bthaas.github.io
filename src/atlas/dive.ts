import {
  getCoverRect,
  getPreloadOrder,
  getSectionProgress,
  getWashAlpha,
  progressToFrame,
} from '../../lib/atlas-motion/dive'

const FRAME_COUNT = 144
const FRAME_WIDTH = 1280
const FRAME_HEIGHT = 688

type DiveObserver = Pick<IntersectionObserver, 'disconnect' | 'observe'>
type ObserverFactory = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit,
) => DiveObserver

interface DiveOptions {
  readonly createImage?: () => HTMLImageElement
  readonly createObserver?: ObserverFactory
}

const frameUrl = (index: number) => (
  `/frames/dive/frame_${String(index).padStart(3, '0')}.webp`
)

export function setupDiveScroll(
  root: Document = document,
  runtimeWindow: Window = window,
  {
    createImage = () => new Image(),
    createObserver = typeof IntersectionObserver === 'undefined'
      ? undefined
      : (callback, options) => new IntersectionObserver(callback, options),
  }: DiveOptions = {},
): () => void {
  const section = root.querySelector<HTMLElement>('.dive-section')
  const canvas = section?.querySelector<HTMLCanvasElement>('[data-dive-canvas]')
  if (!section || !canvas) return () => undefined

  const context = canvas.getContext('2d')
  const frames: Array<HTMLImageElement | undefined> = new Array(FRAME_COUNT)
  let observer: DiveObserver | undefined
  let active = true
  let loading = false
  let targetFrame = 0
  let washAlpha = 0
  let lastTarget = -1
  let lastWash = -1

  const draw = (force = false) => {
    if (!force && targetFrame === lastTarget && washAlpha === lastWash) return
    lastTarget = targetFrame
    lastWash = washAlpha
    if (!context) return

    let index = targetFrame
    while (index >= 0 && !frames[index]) index -= 1
    const frame = frames[index]
    if (frame) {
      const rect = getCoverRect(canvas.width, canvas.height, FRAME_WIDTH, FRAME_HEIGHT)
      context.drawImage(
        frame,
        rect.sx,
        rect.sy,
        rect.sw,
        rect.sh,
        rect.dx,
        rect.dy,
        rect.dw,
        rect.dh,
      )
    }
    if (washAlpha > 0) {
      context.fillStyle = `rgba(32, 42, 68, ${washAlpha})`
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
  }

  const update = () => {
    const progress = getSectionProgress(section.getBoundingClientRect(), runtimeWindow.innerHeight)
    targetFrame = progressToFrame(progress, FRAME_COUNT)
    washAlpha = getWashAlpha(progress)
    draw()
  }

  const resize = () => {
    const bounds = canvas.getBoundingClientRect()
    const pixelRatio = Math.min(runtimeWindow.devicePixelRatio || 1, 2)
    const width = Math.round(bounds.width * pixelRatio)
    const height = Math.round(bounds.height * pixelRatio)
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    update()
    draw(true)
  }

  const loadFrames = async () => {
    if (loading) return
    loading = true
    const mobile = runtimeWindow.innerWidth <= 720
    const order = getPreloadOrder(FRAME_COUNT).filter((index) => !mobile || index % 2 === 0)
    for (const index of order) {
      if (!active) return
      const image = createImage()
      image.src = frameUrl(index)
      try {
        await image.decode()
      } catch {
        continue
      }
      if (!active) return
      frames[index] = image
      if (index <= targetFrame) draw(true)
    }
  }

  const beginLoading = () => {
    observer?.disconnect()
    observer = undefined
    void loadFrames()
  }
  const handleScroll = () => update()
  const handleResize = () => resize()

  resize()
  runtimeWindow.addEventListener('atlas:scroll', handleScroll)
  runtimeWindow.addEventListener('resize', handleResize, { passive: true })
  if (createObserver) {
    observer = createObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) beginLoading()
    }, { rootMargin: '150%', threshold: 0 })
    observer.observe(section)
  } else beginLoading()

  return () => {
    active = false
    observer?.disconnect()
    runtimeWindow.removeEventListener('atlas:scroll', handleScroll)
    runtimeWindow.removeEventListener('resize', handleResize)
  }
}
