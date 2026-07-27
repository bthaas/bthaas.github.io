import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRef } from 'react'
import type { AnchorHTMLAttributes } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigation = vi.hoisted(() => ({
  pathname: '/',
  prefetch: vi.fn(),
  push: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({
    prefetch: navigation.prefetch,
    push: navigation.push,
  }),
}))

vi.mock('next/link', async () => {
  const React = await vi.importActual<typeof import('react')>('react')

  return {
    default: React.forwardRef<
      HTMLAnchorElement,
      AnchorHTMLAttributes<HTMLAnchorElement> & {
        readonly href: string
        readonly onNavigate?: (event: { preventDefault: () => void }) => void
      }
    >(function MockLink({ href, onClick, onNavigate, ...props }, ref) {
      return (
        <a
          {...props}
          href={href}
          ref={ref}
          onClick={(event) => {
            onClick?.(event)
            if (event.defaultPrevented) return
            event.preventDefault()
            onNavigate?.({ preventDefault: vi.fn() })
          }}
        />
      )
    }),
  }
})

import {
  PageTransitionProvider,
  TransitionLink,
} from './PageTransitionProvider'

function PortalLinkFixture({ href = '/projects' }: { readonly href?: string }) {
  const sourceRef = useRef<HTMLSpanElement>(null)

  return (
    <PageTransitionProvider>
      <main>Current route</main>
      <span ref={sourceRef} />
      <TransitionLink
        href={href}
        portal={{
          image: '/icarus-atlas/project-courtvision-640.avif',
          label: 'Projects',
          sourceRef,
        }}
        transition="portal"
      >
        Projects
      </TransitionLink>
    </PageTransitionProvider>
  )
}

function StandardLinkFixture({ href = '/projects' }: { readonly href?: string }) {
  return (
    <PageTransitionProvider>
      <main>Current route</main>
      <TransitionLink href={href}>Projects</TransitionLink>
    </PageTransitionProvider>
  )
}

describe('PageTransitionProvider', () => {
  beforeEach(() => {
    navigation.pathname = '/'
    navigation.prefetch.mockClear()
    navigation.push.mockClear()
  })

  it('routes a cylinder face immediately without rendering transition UI', () => {
    render(<PortalLinkFixture />)
    const link = screen.getByRole('link', { name: 'Projects' })

    fireEvent.click(link)

    expect(navigation.push).toHaveBeenCalledOnce()
    expect(navigation.push).toHaveBeenCalledWith('/projects')
    expect(screen.queryByTestId('page-transition-overlay')).not.toBeInTheDocument()
    expect(document.querySelector('[data-page-transition-ribbon]')).toBeNull()
    expect(document.documentElement).not.toHaveAttribute('data-page-transition')
  })

  it('locks rapid clicks until the pathname changes, then permits the next route', () => {
    const { rerender } = render(<PortalLinkFixture />)
    const link = screen.getByRole('link', { name: 'Projects' })

    fireEvent.click(link)
    fireEvent.click(link)
    expect(navigation.push).toHaveBeenCalledOnce()

    navigation.pathname = '/projects'
    rerender(<PortalLinkFixture href="/contact" />)
    fireEvent.click(screen.getByRole('link', { name: 'Projects' }))

    expect(navigation.push).toHaveBeenCalledTimes(2)
    expect(navigation.push).toHaveBeenLastCalledWith('/contact')
  })

  it('suppresses a same-route navigation after normalizing its URL', () => {
    navigation.pathname = '/projects'
    render(<StandardLinkFixture href="/projects/?view=index" />)

    fireEvent.click(screen.getByRole('link', { name: 'Projects' }))

    expect(navigation.push).not.toHaveBeenCalled()
  })

  it('prewarms every gateway destination while the home page is active', async () => {
    render(<PortalLinkFixture />)

    await waitFor(() => {
      expect(navigation.prefetch).toHaveBeenCalledTimes(4)
    })
    expect(navigation.prefetch.mock.calls.map(([href]) => href)).toEqual([
      '/experience',
      '/projects',
      '/skills',
      '/contact',
    ])
  })

  it('dispatches the route-change event for browser history without adding an overlay', async () => {
    const routeChange = vi.fn()
    window.addEventListener('atlas:route-change', routeChange)
    navigation.pathname = '/projects'
    const { rerender } = render(
      <PageTransitionProvider>
        <main>Projects route</main>
      </PageTransitionProvider>,
    )

    navigation.pathname = '/'
    rerender(
      <PageTransitionProvider>
        <main>Home route</main>
      </PageTransitionProvider>,
    )

    await waitFor(() => expect(routeChange).toHaveBeenCalledOnce())
    expect(routeChange).toHaveBeenCalledWith(expect.objectContaining({
      detail: { pathname: '/' },
    }))
    expect(screen.queryByTestId('page-transition-overlay')).not.toBeInTheDocument()
    window.removeEventListener('atlas:route-change', routeChange)
  })

  it('leaves a transition link native when no provider is mounted', () => {
    render(<TransitionLink href="/projects">Projects</TransitionLink>)

    fireEvent.click(screen.getByRole('link', { name: 'Projects' }))

    expect(navigation.push).not.toHaveBeenCalled()
  })
})
