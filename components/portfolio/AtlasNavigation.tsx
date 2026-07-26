import { TransitionLink } from '@/components/motion/PageTransitionProvider'

export type AtlasRouteName = 'home' | 'experience' | 'projects' | 'skills' | 'contact'

const routes = [
  { href: '/experience', index: '01', label: 'Experience', name: 'experience' },
  { href: '/projects', index: '02', label: 'Projects', name: 'projects' },
  { href: '/skills', index: '03', label: 'Skills', name: 'skills' },
  { href: '/contact', index: '04', label: 'Contact', name: 'contact' },
] as const

export function AtlasNavigation({
  current,
}: {
  readonly current: AtlasRouteName
}) {
  return (
    <header className="site-header" data-current={current}>
      <nav className="site-nav" aria-label="Primary navigation">
        <TransitionLink
          className="atlas-home-link"
          href="/"
          aria-current={current === 'home' ? 'page' : undefined}
        >
          <img
            className="atlas-home-link__mark"
            src="/original-wing-filled.png"
            alt=""
            width="128"
            height="128"
            aria-hidden="true"
          />
          <span className="atlas-home-link__label">Home</span>
        </TransitionLink>

        <ol className="atlas-route-index">
          {routes.map((route) => (
            <li key={route.name}>
              <TransitionLink
                className="atlas-route-link"
                href={route.href}
                aria-current={current === route.name ? 'page' : undefined}
              >
                <span className="atlas-route-link__index" aria-hidden="true">
                  {route.index}
                </span>
                <span className="atlas-route-link__label">{route.label}</span>
              </TransitionLink>
            </li>
          ))}
        </ol>
      </nav>
    </header>
  )
}
