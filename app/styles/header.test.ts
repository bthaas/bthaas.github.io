import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

describe('header brand mark', () => {
  it('publishes exact desktop and mobile height tokens for viewport sections', () => {
    const stylesheet = readFileSync(resolve(process.cwd(), 'app/styles/header.css'), 'utf8')
    const root = postcss.parse(stylesheet)
    const heights: string[] = []
    const navHeights: string[] = []

    root.walkRules(':root', (rule) => {
      rule.walkDecls('--site-header-height', (declaration) => {
        heights.push(declaration.value)
      })
    })
    root.walkRules('.site-nav', (rule) => {
      rule.walkDecls('min-height', (declaration) => {
        navHeights.push(declaration.value)
      })
    })

    expect(heights).toEqual(['59px', '55px'])
    expect(navHeights).toEqual(['58px', '54px'])
  })

  it('renders the centered favicon one pixel larger than the approved size', () => {
    const stylesheet = readFileSync(resolve(process.cwd(), 'app/styles/header.css'), 'utf8')
    const root = postcss.parse(stylesheet)
    let filter: string | undefined
    let height: string | undefined
    let transform: string | undefined
    let width: string | undefined

    root.walkRules('.nav-name__mark', (rule) => {
      rule.walkDecls('filter', (declaration) => {
        filter = declaration.value
      })
      rule.walkDecls('height', (declaration) => {
        height = declaration.value
      })
      rule.walkDecls('transform', (declaration) => {
        transform = declaration.value
      })
      rule.walkDecls('width', (declaration) => {
        width = declaration.value
      })
    })

    expect(filter).toBeUndefined()
    expect({ height, transform, width }).toEqual({
      height: 'calc(1.4rem + 1px)',
      transform: undefined,
      width: 'calc(1.4rem + 1px)',
    })
  })

  it('keeps mobile navigation links above the animated sun control', () => {
    const stylesheet = readFileSync(resolve(process.cwd(), 'app/styles/motion.css'), 'utf8')
    const root = postcss.parse(stylesheet)
    let mobileNavZIndex: string | undefined

    root.walkAtRules('media', (atRule) => {
      if (!atRule.params.includes('max-width: 720px')) return
      atRule.walkRules('.nav-links', (rule) => {
        rule.walkDecls('z-index', (declaration) => {
          mobileNavZIndex = declaration.value
        })
      })
    })

    expect(mobileNavZIndex).toBe('4')
  })
})
