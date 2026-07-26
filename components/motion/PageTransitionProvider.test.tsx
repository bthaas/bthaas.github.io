import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { forwardRef, useRef } from 'react'
import type { AnchorHTMLAttributes } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigation = vi.hoisted(() => ({
  pathname: '/',
  push: vi.fn(),
}))

const motion = vi.hoisted(() => ({
  calls: [] as Array<{
    method: string
    target?: unknown
    vars?: Record<string, unknown>
  }>,
  completions: [] as Array<(() => void) | undefined>,
  kills: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
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

vi.mock('gsap', () => ({
  gsap: {
    set: (_target: unknown, vars: Record<string, unknown>) => {
      motion.calls.push({ method: 'set', target: _target, vars })
      if (_target instanceof HTMLElement) {
        if (typeof vars.display === 'string') _target.style.display = vars.display
        if (typeof vars.pointerEvents === 'string') {
          _target.style.pointerEvents = vars.pointerEvents
        }
        if (typeof vars.visibility === 'string') _target.style.visibility = vars.visibility
      }
    },
    timeline: (options: { readonly onComplete?: () => void } = {}) => {
      motion.completions.push(options.onComplete)
      const timeline = {
        fromTo: (
          _target: unknown,
          _fromVars: Record<string, unknown>,
          vars: Record<string, unknown>,
        ) => {
          motion.calls.push({ method: 'fromTo', target: _target, vars })
          return timeline
        },
        kill: motion.kills,
        set: (_target: unknown, vars: Record<string, unknown>) => {
          motion.calls.push({ method: 'set', target: _target, vars })
          return timeline
        },
        to: (_target: unknown, vars: Record<string, unknown>) => {
          motion.calls.push({ method: 'to', target: _target, vars })
          return timeline
        },
      }
      return timeline
    },
  },
}))

import {
  PageTransitionProvider,
  TransitionLink,
} from './PageTransitionProvider'

function mediaQuery(matches: boolean): MediaQueryList {
  return {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }
}

function PortalLinkFixture() {
  const sourceRef = useRef<HTMLSpanElement>(null)

  return (
    <PageTransitionProvider>
      <main>Current route</main>
      <span
        data-testid="portal-source"
        ref={(element) => {
          sourceRef.current = element
          if (!element) return
          Object.defineProperty(element, 'getBoundingClientRect', {
            configurable: true,
            value: () => ({
              bottom: 440,
              height: 320,
              left: 240,
              right: 800,
              top: 120,
              width: 560,
              x: 240,
              y: 120,
              toJSON: () => ({}),
            }),
          })
        }}
      />
      <TransitionLink
        href="/projects"
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

function MissingSourcePortalFixture() {
  const sourceRef = useRef<HTMLSpanElement>(null)

  return (
    <PageTransitionProvider>
      <TransitionLink
        href="/projects"
        portal={{
          image: '/icarus-atlas/project-courtvision-640.avif',
          label: 'Case Studies',
          sourceRef,
        }}
        transition="portal"
      >
        Case Studies
      </TransitionLink>
    </PageTransitionProvider>
  )
}

describe('PageTransitionProvider', () => {
  beforeEach(() => {
    navigation.pathname = '/'
    navigation.push.mockClear()
    motion.calls.length = 0
    motion.completions.length = 0
    motion.kills.mockClear()
    vi.spyOn(window, 'matchMedia').mockImplementation(() => mediaQuery(false))
  })

  it('dives through the selected artwork, locks rapid clicks, then reveals the routed page', async () => {
    const { rerender } = render(<PortalLinkFixture />)
    const link = screen.getByRole('link', { name: 'Projects' })

    fireEvent.click(link)
    fireEvent.click(link)

    await waitFor(() => {
      expect(screen.getByTestId('page-transition-overlay')).toHaveAttribute(
        'data-transition-state',
        'exiting',
      )
    })
    expect(screen.getByTestId('page-transition-overlay')).toHaveStyle({
      '--page-transition-image': 'url("/icarus-atlas/project-courtvision-640.avif")',
    })
    expect(motion.completions).toHaveLength(1)

    act(() => motion.completions[0]?.())
    expect(navigation.push).toHaveBeenCalledOnce()
    expect(navigation.push).toHaveBeenCalledWith('/projects')

    navigation.pathname = '/projects'
    rerender(<PortalLinkFixture />)
    await waitFor(() => {
      expect(screen.getByTestId('page-transition-overlay')).toHaveAttribute(
        'data-transition-state',
        'entering',
      )
    })
    expect(motion.completions).toHaveLength(2)

    act(() => motion.completions[1]?.())
    await waitFor(() => {
      expect(screen.getByTestId('page-transition-overlay')).toHaveAttribute(
        'data-transition-state',
        'idle',
      )
    })
    expect(screen.getByTestId('page-transition-overlay')).not.toBeVisible()
  })

  it('unspools the selected cylinder face into twelve center-out artwork ribbons', async () => {
    render(<PortalLinkFixture />)

    const ribbons = screen.getAllByTestId('page-transition-ribbon')
    expect(ribbons).toHaveLength(12)
    expect(ribbons[0]).toHaveStyle({
      '--page-transition-ribbon-index': '0',
      '--page-transition-ribbon-position': '0%',
    })
    expect(ribbons[11]).toHaveStyle({
      '--page-transition-ribbon-index': '11',
      '--page-transition-ribbon-position': '100%',
    })

    fireEvent.click(screen.getByRole('link', { name: 'Projects' }))

    await waitFor(() => {
      expect(screen.getByTestId('page-transition-overlay')).toHaveAttribute(
        'data-transition-category',
        'projects',
      )
    })
    const ribbonTween = motion.calls.find(({ method, target }) => (
      method === 'to'
      && Array.isArray(target)
      && target.length === 12
      && target.every((node) => (
        node instanceof HTMLElement
        && node.hasAttribute('data-page-transition-ribbon')
      ))
    ))
    expect(ribbonTween?.vars).toMatchObject({
      duration: 0.72,
      stagger: { amount: 0.16, from: 'center' },
    })
    expect(ribbonTween?.vars?.rotateY).toBeTypeOf('function')
    expect(ribbonTween?.vars?.xPercent).toBeTypeOf('function')
    expect(ribbonTween?.vars?.z).toBeTypeOf('function')
    const rotateY = ribbonTween?.vars?.rotateY as (index: number) => number
    const xPercent = ribbonTween?.vars?.xPercent as (index: number) => number
    const z = ribbonTween?.vars?.z as (index: number) => number
    expect(rotateY(0)).toBeLessThan(0)
    expect(rotateY(11)).toBeGreaterThan(0)
    expect(xPercent(0)).toBeLessThan(0)
    expect(xPercent(11)).toBeGreaterThan(0)
    expect(z(5)).toBeGreaterThan(z(0))
  })

  it('uses an instant, still-locked route swap when reduced motion is requested', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(() => mediaQuery(true))
    const { rerender } = render(<PortalLinkFixture />)
    const link = screen.getByRole('link', { name: 'Projects' })

    fireEvent.click(link)
    fireEvent.click(link)

    expect(navigation.push).toHaveBeenCalledOnce()
    expect(navigation.push).toHaveBeenCalledWith('/projects')
    expect(motion.completions).toHaveLength(0)
    expect(screen.getByTestId('page-transition-overlay')).toHaveAttribute(
      'data-transition-state',
      'idle',
    )

    navigation.pathname = '/projects'
    rerender(<PortalLinkFixture />)
    await waitFor(() => {
      expect(screen.getByTestId('page-transition-overlay')).toHaveAttribute(
        'data-transition-state',
        'idle',
      )
    })
    expect(document.documentElement).not.toHaveAttribute('data-page-transition')
  })

  it('uses fallback geometry when the selected face has no measurable source', async () => {
    render(<MissingSourcePortalFixture />)

    fireEvent.click(screen.getByRole('link', { name: 'Case Studies' }))

    await waitFor(() => {
      expect(screen.getByTestId('page-transition-overlay')).toHaveAttribute(
        'data-transition-category',
        'case-studies',
      )
    })
    const portalSetup = motion.calls.find(({ method, target, vars }) => (
      method === 'set'
      && target instanceof HTMLElement
      && target.classList.contains('page-transition__portal')
      && vars?.opacity === 1
    ))
    expect(portalSetup?.vars).toMatchObject({
      height: window.innerHeight * 0.48,
      left: window.innerWidth * 0.17,
      top: window.innerHeight * 0.2,
      width: window.innerWidth * 0.66,
    })
  })

  it('uses the compact veil for standard links and suppresses same-route navigation', async () => {
    const { rerender } = render(<StandardLinkFixture />)

    fireEvent.click(screen.getByRole('link', { name: 'Projects' }))
    await waitFor(() => {
      expect(screen.getByTestId('page-transition-overlay')).toHaveAttribute(
        'data-transition-state',
        'exiting',
      )
    })
    expect(screen.getByTestId('page-transition-overlay')).toHaveAttribute(
      'data-transition-kind',
      'standard',
    )
    expect(screen.getByTestId('page-transition-overlay')).not.toHaveAttribute(
      'data-transition-category',
    )

    act(() => motion.completions[0]?.())
    expect(navigation.push).toHaveBeenCalledWith('/projects')

    navigation.pathname = '/projects'
    rerender(<StandardLinkFixture href="/projects/?view=index" />)
    await waitFor(() => {
      expect(screen.getByTestId('page-transition-overlay')).toHaveAttribute(
        'data-transition-state',
        'entering',
      )
    })
    act(() => motion.completions[1]?.())
    await waitFor(() => {
      expect(screen.getByTestId('page-transition-overlay')).toHaveAttribute(
        'data-transition-state',
        'idle',
      )
    })

    fireEvent.click(screen.getByRole('link', { name: 'Projects' }))
    expect(navigation.push).toHaveBeenCalledTimes(1)
    expect(motion.completions).toHaveLength(2)
  })

  it('leaves a transition link native when no provider is mounted', () => {
    render(<TransitionLink href="/projects">Projects</TransitionLink>)

    fireEvent.click(screen.getByRole('link', { name: 'Projects' }))

    expect(navigation.push).not.toHaveBeenCalled()
    expect(motion.completions).toHaveLength(0)
  })

  it('plays the compact arrival veil when history changes outside a transition link', async () => {
    const routeChange = vi.fn()
    window.addEventListener('atlas:route-change', routeChange)
    navigation.pathname = '/projects'
    const { rerender } = render(
      <PageTransitionProvider>
        <p>Projects route</p>
      </PageTransitionProvider>,
    )

    navigation.pathname = '/'
    rerender(
      <PageTransitionProvider>
        <p>Home route</p>
      </PageTransitionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('page-transition-overlay')).toHaveAttribute(
        'data-transition-state',
        'entering',
      )
    })
    expect(screen.getByTestId('page-transition-overlay')).toHaveAttribute(
      'data-transition-kind',
      'standard',
    )
    expect(routeChange).toHaveBeenCalledOnce()
    expect(motion.calls.some(({ method }) => method === 'fromTo')).toBe(true)
    window.removeEventListener('atlas:route-change', routeChange)
  })
})
