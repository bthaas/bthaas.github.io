import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DialogFrame } from './DialogFrame'

function installReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
}

describe('DialogFrame', () => {
  it('renders its static end state for reduced motion', () => {
    installReducedMotion(true)
    const { container } = render(
      <div className="dialog-backdrop">
        <article className="project-dialog">
          <DialogFrame />
        </article>
      </div>,
    )

    expect(container.querySelector('path')).toHaveStyle({ strokeDashoffset: '0' })
  })

  it('stays inert when rendered without a dialog container', () => {
    installReducedMotion(false)
    const { container } = render(<DialogFrame />)

    expect(container.querySelector('.dialog-drawn-frame')).toBeInTheDocument()
  })
})
