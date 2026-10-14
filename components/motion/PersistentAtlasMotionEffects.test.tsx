import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PersistentAtlasMotionEffects } from './PersistentAtlasMotionEffects'

let pathname = '/'
let mounts = 0

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}))

vi.mock('./AtlasMotionEffects', async () => {
  const { useEffect } = await import('react')
  return {
    AtlasMotionEffects: function MockAtlasMotionEffects() {
      useEffect(() => {
        mounts += 1
      }, [])
      return <div data-testid="atlas-motion-effects" />
    },
  }
})

describe('PersistentAtlasMotionEffects', () => {
  beforeEach(() => {
    pathname = '/'
    mounts = 0
  })

  it('keeps one mounted effects layer while moving between portfolio screens', async () => {
    const { rerender } = render(<PersistentAtlasMotionEffects />)
    expect(await screen.findByTestId('atlas-motion-effects')).toBeInTheDocument()

    for (const next of ['/experience', '/projects', '/skills', '/contact', '/']) {
      pathname = next
      rerender(<PersistentAtlasMotionEffects />)
      expect(screen.getByTestId('atlas-motion-effects')).toBeInTheDocument()
    }

    expect(mounts).toBe(1)
  })

  it('renders nothing on editorial pages and case studies', () => {
    pathname = '/projects/courtvision'
    const { rerender } = render(<PersistentAtlasMotionEffects />)
    expect(screen.queryByTestId('atlas-motion-effects')).not.toBeInTheDocument()

    pathname = '/about'
    rerender(<PersistentAtlasMotionEffects />)
    expect(screen.queryByTestId('atlas-motion-effects')).not.toBeInTheDocument()
  })
})
