'use client'

import { useEffect, useState } from 'react'

import { TransitionLink } from '@/components/motion/PageTransitionProvider'
import { ArrowIcon } from '@/components/ui/ArrowIcon'
import {
  ATLAS_GATEWAY_SELECTION_EVENT,
  type AtlasDestinationName,
  type AtlasGatewaySelectionDetail,
} from '@/lib/atlas-events'

export type AtlasRouteName = 'home' | 'experience' | 'projects' | 'skills' | 'contact'

const routes = [
  { href: '/experience', index: '01', label: 'Experience', name: 'experience' },
  { href: '/projects', index: '02', label: 'Projects', name: 'projects' },
  { href: '/skills', index: '03', label: 'Skills', name: 'skills' },
  { href: '/contact', index: '04', label: 'Contact', name: 'contact' },
] as const

function isAtlasDestinationName(value: unknown): value is AtlasDestinationName {
  return routes.some((route) => route.name === value)
}

export function AtlasNavigation({
  current,
}: {
  readonly current: AtlasRouteName
}) {
  const [selectedDestination, setSelectedDestination] = useState<AtlasDestinationName>(
    'experience',
  )
  const showHomeControl = current !== 'home'
  const showRouteIndex = current !== 'projects'

  useEffect(() => {
    if (current !== 'home') return

    const handleGatewaySelection = (event: Event) => {
      const route = (event as CustomEvent<AtlasGatewaySelectionDetail>).detail?.route
      if (isAtlasDestinationName(route)) setSelectedDestination(route)
    }

    window.addEventListener(ATLAS_GATEWAY_SELECTION_EVENT, handleGatewaySelection)
    return () => {
      window.removeEventListener(ATLAS_GATEWAY_SELECTION_EVENT, handleGatewaySelection)
    }
  }, [current])

  return (
    <header
      className="site-header"
      data-current={current}
      data-index-visible={showRouteIndex ? 'true' : 'false'}
    >
      <nav className="site-nav" aria-label="Primary navigation">
        {showHomeControl && (
          <TransitionLink className="atlas-home-link" href="/">
            <ArrowIcon className="atlas-home-link__arrow" direction="left" />
            <span className="atlas-home-link__label">Home</span>
          </TransitionLink>
        )}

        {showRouteIndex && (
          <ol className="atlas-route-index">
            {routes.map((route) => (
              <li key={route.name}>
                <TransitionLink
                  className="atlas-route-link"
                  href={route.href}
                  aria-current={current === route.name ? 'page' : undefined}
                  data-active-destination={
                    current === 'home' && selectedDestination === route.name
                      ? 'true'
                      : undefined
                  }
                >
                  <span className="atlas-route-link__index" aria-hidden="true">
                    {route.index}
                  </span>
                  <span className="atlas-route-link__label">{route.label}</span>
                </TransitionLink>
              </li>
            ))}
          </ol>
        )}
      </nav>
    </header>
  )
}
