'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react'
import type {
  ComponentProps,
  ReactNode,
  RefObject,
} from 'react'

import { ATLAS_ROUTE_CHANGE_EVENT } from '@/lib/atlas-events'

type PageTransitionKind = 'portal' | 'standard'
type BeginNavigation = (href: string) => void

const NavigationContext = createContext<BeginNavigation | null>(null)
const PORTFOLIO_DESTINATIONS = [
  '/experience',
  '/projects',
  '/skills',
  '/contact',
] as const

function pathsMatch(left: string, right: string) {
  const normalize = (value: string) => {
    const pathname = value.split(/[?#]/, 1)[0]
    return pathname === '/' ? pathname : pathname.replace(/\/+$/, '')
  }

  return normalize(left) === normalize(right)
}

export function PageTransitionProvider({ children }: { readonly children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const lockedRef = useRef(false)
  const previousPathRef = useRef(pathname)
  const prefetch = router.prefetch

  useEffect(() => {
    if (pathname !== '/') return
    PORTFOLIO_DESTINATIONS.forEach((href) => prefetch(href))
  }, [pathname, prefetch])

  useEffect(() => {
    const previousPath = previousPathRef.current
    if (previousPath === pathname) return

    previousPathRef.current = pathname
    lockedRef.current = false
    window.dispatchEvent(new CustomEvent(ATLAS_ROUTE_CHANGE_EVENT, {
      detail: { pathname },
    }))
  }, [pathname])

  const navigate = useCallback<BeginNavigation>((href) => {
    if (lockedRef.current || pathsMatch(pathname, href)) return

    lockedRef.current = true
    router.push(href)
  }, [pathname, router])

  return (
    <NavigationContext.Provider value={navigate}>
      {children}
    </NavigationContext.Provider>
  )
}

interface PortalTransition {
  readonly image: string
  readonly label: string
  readonly sourceRef: RefObject<HTMLElement | null>
}

type TransitionLinkProps = Omit<
  ComponentProps<typeof Link>,
  'href' | 'onNavigate'
> & {
  readonly href: string
  readonly portal?: PortalTransition
  readonly transition?: PageTransitionKind
}

export function TransitionLink({
  children,
  href,
  portal: _portal,
  transition: _transition,
  ...props
}: TransitionLinkProps) {
  const navigate = useContext(NavigationContext)

  return (
    <Link
      {...props}
      href={href}
      onNavigate={(event) => {
        if (!navigate) return
        event.preventDefault()
        navigate(href)
      }}
    >
      {children}
    </Link>
  )
}
