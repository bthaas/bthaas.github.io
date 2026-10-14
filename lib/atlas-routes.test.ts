import { describe, expect, it } from 'vitest'

import { isPortfolioScreenPath } from './atlas-routes'

describe('isPortfolioScreenPath', () => {
  it('matches the home gateway and the four portfolio screens', () => {
    for (const pathname of ['/', '/experience', '/projects', '/skills', '/contact']) {
      expect(isPortfolioScreenPath(pathname)).toBe(true)
    }
  })

  it('tolerates trailing slashes, queries, and hashes', () => {
    expect(isPortfolioScreenPath('/projects/')).toBe(true)
    expect(isPortfolioScreenPath('/skills?stats=1')).toBe(true)
    expect(isPortfolioScreenPath('/contact#contact')).toBe(true)
  })

  it('excludes editorial pages, case studies, and unknown routes', () => {
    for (const pathname of ['/about', '/privacy', '/projects/courtvision', '/missing', '']) {
      expect(isPortfolioScreenPath(pathname)).toBe(false)
    }
  })
})
