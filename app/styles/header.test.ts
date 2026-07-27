import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss, { type AtRule, type Root } from 'postcss'
import { describe, expect, it } from 'vitest'

const stylesheet = readFileSync(resolve(process.cwd(), 'app/styles/header.css'), 'utf8')
const root = postcss.parse(stylesheet)

function declarations(source: Root | AtRule, selector: string) {
  const values: Record<string, string> = {}
  source.walkRules(selector, (rule) => {
    if (rule.parent !== source) return
    rule.walkDecls((declaration) => {
      values[declaration.prop] = declaration.value
    })
  })
  return values
}

describe('Atlas Corners navigation', () => {
  it('floats the Home control and optional route index without a persistent top bar', () => {
    expect(declarations(root, '.site-header')).toMatchObject({
      position: 'fixed',
      'pointer-events': 'none',
    })
    expect(declarations(root, '.atlas-home-link')).toMatchObject({
      position: 'fixed',
      'min-height': '44px',
      'min-width': '5.5rem',
    })
    expect(declarations(root, '.atlas-home-link__arrow')).toMatchObject({
      display: 'block',
      height: '1.15rem',
      width: '1.15rem',
    })
    expect(declarations(root, '.atlas-route-index')).toMatchObject({
      position: 'fixed',
      'list-style': 'none',
    })
    expect(declarations(root, '.site-header[data-current="home"] .atlas-route-index')).toMatchObject({
      top: 'auto',
      bottom: 'clamp(7rem, 14vh, 9rem)',
    })
    expect(declarations(root, '.site-header[data-current="skills"] .atlas-route-index')).toMatchObject({
      position: 'relative',
      'grid-template-columns': 'repeat(4, max-content)',
      'min-width': '0',
    })
    expect(declarations(root, '.site-header[data-current="skills"] .site-nav')).toMatchObject({
      position: 'fixed',
      display: 'flex',
    })
    expect(declarations(root, '.site-header[data-current="skills"] .atlas-home-link')).toMatchObject({
      position: 'relative',
      width: '44px',
      'min-width': '44px',
    })
    expect(declarations(root, '.site-header[data-current="skills"] .atlas-route-link')).toMatchObject({
      'grid-template-columns': 'max-content max-content',
    })
    expect(stylesheet).not.toContain('.nav-name')
    expect(stylesheet).not.toContain('.nav-links')
    expect(stylesheet).not.toContain('.sun-arc')
  })

  it('uses the same solar marker for the current page and selected Home destination', () => {
    expect(declarations(
      root,
      '.atlas-route-link[aria-current]::before,\n.atlas-route-link[data-active-destination="true"]::before',
    )).toMatchObject({
      background: 'var(--solar)',
      opacity: '1',
    })
  })

  it('keeps Home destination-only, Skills complete, and other screens minimal at phone width', () => {
    let mobile: AtRule | undefined
    root.walkAtRules('media', (rule) => {
      if (rule.params.includes('max-width: 720px')) mobile = rule
    })

    expect(mobile).toBeDefined()
    expect(declarations(mobile as AtRule, '.site-nav')).toMatchObject({
      display: 'grid',
      'grid-template-columns': '44px minmax(0, 1fr)',
    })
    expect(declarations(mobile as AtRule, '.atlas-home-link')).toMatchObject({
      position: 'relative',
    })
    expect(declarations(mobile as AtRule, '.atlas-route-index')).toMatchObject({
      position: 'relative',
      display: 'grid',
      'grid-template-columns': 'repeat(4, minmax(0, 1fr))',
    })
    expect(
      declarations(
        mobile as AtRule,
        '.site-header[data-current="home"] .site-nav',
      ),
    ).toMatchObject({
      'grid-template-columns': 'minmax(0, 1fr)',
    })
    expect(
      declarations(
        mobile as AtRule,
        '.site-header[data-current="skills"] .site-nav',
      ),
    ).toMatchObject({
      position: 'absolute',
      display: 'grid',
      'grid-template-columns': '44px minmax(0, 1fr)',
    })
    expect(
      declarations(
        mobile as AtRule,
        '.site-header[data-current="skills"] .atlas-route-index',
      ),
    ).toMatchObject({
      'grid-template-columns': 'repeat(4, minmax(0, 1fr))',
    })
    expect(
      declarations(mobile as AtRule, '.site-header[data-index-visible="false"]'),
    ).toMatchObject({
      top: '0',
      bottom: 'auto',
      height: '0',
      background: 'none',
    })
    expect(
      declarations(
        mobile as AtRule,
        '.site-header[data-index-visible="false"] .atlas-home-link',
      ),
    ).toMatchObject({
      position: 'fixed',
    })
  })
})
