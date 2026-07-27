import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ArrowIcon } from './ArrowIcon'

describe('ArrowIcon', () => {
  it.each(['left', 'right', 'up-right'] as const)(
    'renders a centered, decorative %s vector',
    (direction) => {
      const { container } = render(<ArrowIcon direction={direction} />)
      const icon = container.querySelector('svg')

      expect(icon).toHaveAttribute('aria-hidden', 'true')
      expect(icon).toHaveAttribute('data-arrow-direction', direction)
      expect(icon).toHaveAttribute('focusable', 'false')
      expect(icon).toHaveAttribute('viewBox', '0 0 24 24')
      expect(icon).not.toHaveTextContent(/[←→↗]/)
    },
  )
})
