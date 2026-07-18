import { hasFinePointer } from './capabilities'
import { getAtlasEngine, type AtlasEngine } from './engine'

type CursorMode = 'default' | 'expand' | 'external' | 'read'
type FinePointerCheck = () => boolean

const labels: Record<CursorMode, string> = {
  default: '',
  expand: '+',
  external: '↗',
  read: 'read',
}

function getCursorMode(target: EventTarget | null): CursorMode {
  if (!(target instanceof Element)) return 'default'
  if (target.closest('[data-cursor="expand"]')) return 'expand'
  if (target.closest('a[target="_blank"]')) return 'external'
  if (target.closest('[data-cursor="read"]')) return 'read'
  return 'default'
}

export function setupCursor(
  root: Document = document,
  finePointer: FinePointerCheck = hasFinePointer,
  engine: AtlasEngine | null = getAtlasEngine(),
): () => void {
  if (!finePointer() || !root.body || !engine) return () => undefined

  const cursor = root.createElement('div')
  const dot = root.createElement('span')
  const ring = root.createElement('span')
  const label = root.createElement('span')
  cursor.dataset.atlasCursor = ''
  cursor.dataset.cursorMode = 'default'
  cursor.className = 'atlas-cursor'
  cursor.setAttribute('aria-hidden', 'true')
  dot.className = 'atlas-cursor__dot'
  ring.className = 'atlas-cursor__ring'
  label.className = 'atlas-cursor__label'
  label.dataset.atlasCursorLabel = ''
  ring.append(label)
  cursor.append(dot, ring)
  root.body.append(cursor)

  engine.gsap.set([dot, ring], { x: -20, xPercent: -50, y: -20, yPercent: -50 })
  const setDotX = engine.gsap.quickSetter(dot, 'x', 'px')
  const setDotY = engine.gsap.quickSetter(dot, 'y', 'px')
  const ringXTo = engine.gsap.quickTo(ring, 'x', { duration: 0.2, ease: 'power3.out' })
  const ringYTo = engine.gsap.quickTo(ring, 'y', { duration: 0.2, ease: 'power3.out' })
  const updateMode = (target: EventTarget | null) => {
    const mode = getCursorMode(target)
    cursor.dataset.cursorMode = mode
    label.textContent = labels[mode]
  }
  const handleMove = (event: PointerEvent) => {
    setDotX(event.clientX)
    setDotY(event.clientY)
    ringXTo(event.clientX)
    ringYTo(event.clientY)
    cursor.classList.add('is-visible')
    updateMode(event.target)
  }
  const handleOver = (event: PointerEvent) => updateMode(event.target)
  const handleLeave = () => cursor.classList.remove('is-visible')

  root.addEventListener('pointermove', handleMove)
  root.addEventListener('pointerover', handleOver)
  root.documentElement.addEventListener('pointerleave', handleLeave)

  return () => {
    root.removeEventListener('pointermove', handleMove)
    root.removeEventListener('pointerover', handleOver)
    root.documentElement.removeEventListener('pointerleave', handleLeave)
    ringXTo.tween.kill()
    ringYTo.tween.kill()
    cursor.remove()
  }
}
