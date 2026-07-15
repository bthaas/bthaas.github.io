import { hasFinePointer } from './capabilities'

type CursorMode = 'default' | 'expand' | 'external' | 'read'
type FinePointerCheck = () => boolean
type RequestFrame = (callback: FrameRequestCallback) => number
type CancelFrame = (handle: number) => void

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
  requestFrame: RequestFrame = requestAnimationFrame,
  cancelFrame: CancelFrame = cancelAnimationFrame,
): () => void {
  if (!finePointer() || !root.body) return () => undefined

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

  let animationFrame = 0
  let ringX = 0
  let ringY = 0
  let targetX = 0
  let targetY = 0

  const render = () => {
    ringX += (targetX - ringX) * 0.22
    ringY += (targetY - ringY) * 0.22
    cursor.style.setProperty('--atlas-cursor-ring-x', `${Number(ringX.toFixed(2))}px`)
    cursor.style.setProperty('--atlas-cursor-ring-y', `${Number(ringY.toFixed(2))}px`)
    if (Math.abs(targetX - ringX) > 0.1 || Math.abs(targetY - ringY) > 0.1) {
      animationFrame = requestFrame(render)
    } else {
      animationFrame = 0
    }
  }
  const queueRender = () => {
    if (animationFrame === 0) animationFrame = requestFrame(render)
  }
  const updateMode = (target: EventTarget | null) => {
    const mode = getCursorMode(target)
    cursor.dataset.cursorMode = mode
    label.textContent = labels[mode]
  }
  const handleMove = (event: PointerEvent) => {
    targetX = event.clientX
    targetY = event.clientY
    cursor.style.setProperty('--atlas-cursor-dot-x', `${targetX}px`)
    cursor.style.setProperty('--atlas-cursor-dot-y', `${targetY}px`)
    cursor.classList.add('is-visible')
    updateMode(event.target)
    queueRender()
  }
  const handleOver = (event: PointerEvent) => updateMode(event.target)
  const handleLeave = () => cursor.classList.remove('is-visible')

  root.addEventListener('pointermove', handleMove)
  root.addEventListener('pointerover', handleOver)
  root.documentElement.addEventListener('pointerleave', handleLeave)

  return () => {
    cancelFrame(animationFrame)
    root.removeEventListener('pointermove', handleMove)
    root.removeEventListener('pointerover', handleOver)
    root.documentElement.removeEventListener('pointerleave', handleLeave)
    cursor.remove()
  }
}
