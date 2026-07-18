import { fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FlightTiltSurface } from './FlightTiltSurface'

function setReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

describe('FlightTiltSurface', () => {
  beforeEach(() => setReducedMotion(false))

  it('owns only a dedicated inner surface and keeps nested controls interactive', () => {
    const { container, getByRole, unmount } = render(
      <FlightTiltSurface><button type="button">Field notes</button></FlightTiltSurface>,
    )
    const surface = container.querySelector<HTMLElement>('.flight-entry__tilt')!
    Object.defineProperty(surface, 'getBoundingClientRect', {
      value: () => ({
        bottom: 200,
        height: 200,
        left: 0,
        right: 400,
        top: 0,
        width: 400,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    })

    fireEvent.pointerMove(surface, { clientX: 400, clientY: 0, pointerType: 'mouse' })
    fireEvent.pointerLeave(surface, { pointerType: 'mouse' })
    expect(surface).toHaveAttribute('data-tilted-card-ready')
    expect(getByRole('button', { name: 'Field notes' })).toBeEnabled()
    expect(() => unmount()).not.toThrow()
  })

  it('is a calm structural wrapper under reduced motion', () => {
    setReducedMotion(true)
    const { container } = render(<FlightTiltSurface><span>Entry</span></FlightTiltSurface>)

    expect(container.querySelector('.flight-entry__tilt')).not.toHaveAttribute(
      'data-tilted-card-ready',
    )
    expect(container).toHaveTextContent('Entry')
  })
})
