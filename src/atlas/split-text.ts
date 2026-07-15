import { planSplitText, type SplitTextMode } from '../../lib/atlas-motion/split-text'

export function splitText(element: HTMLElement, mode: SplitTextMode = 'word'): void {
  if (element.dataset.atlasSplit) return

  const plan = planSplitText(element.textContent ?? '', mode)
  const fragment = document.createDocumentFragment()

  for (const segment of plan.segments) {
    if (segment.isWhitespace) {
      fragment.append(document.createTextNode(segment.value))
      continue
    }

    const mask = document.createElement('span')
    const token = document.createElement('span')
    mask.className = `atlas-split-mask atlas-split-mask--${mode}`
    mask.setAttribute('aria-hidden', 'true')
    mask.style.setProperty('--atlas-split-index', String(segment.index))
    token.className = 'atlas-split-token'
    token.textContent = segment.value
    mask.append(token)
    fragment.append(mask)
  }

  element.setAttribute('aria-label', plan.accessibleLabel)
  element.dataset.atlasSplit = mode
  element.replaceChildren(fragment)
}
