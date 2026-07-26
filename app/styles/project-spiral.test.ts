import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const css = fs.readFileSync(path.join(process.cwd(), 'app/styles/projects.css'), 'utf8')

function rulesFor(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return css.match(new RegExp(`${escapedSelector} \\{([^}]+)\\}`))?.[1] ?? ''
}

describe('project spiral styles', () => {
  it('provides the grid stage, active link, and progressive-enhancement fallback', () => {
    expect(css).toContain('.project-spiral__stage')
    expect(css).toContain('data-project-spiral-enhanced')
    expect(css).toContain('min-height: 640svh')
    expect(css).not.toContain('min-height: 360svh')
    expect(css).toContain('position: sticky')
    expect(css).toContain('.project-spiral__active-link')
    expect(css).toContain('repeating-linear-gradient')
  })

  it('keeps the 3D stage responsive while preserving the reduced-motion fallback', () => {
    expect(css).toContain('@media (max-width: 767px)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('.project-spiral__projects')
    const mobileRules = css.split('@media (max-width: 767px)')[1]
      ?.split('@media (prefers-reduced-motion: reduce)')[0]
    expect(mobileRules).not.toContain('.project-spiral__stage')
    expect(mobileRules).toContain('.project-spiral__view-toggle')
    expect(mobileRules).toContain('.project-spiral__projects')
  })

  it('styles a visible view toggle and two layouts for the same project list', () => {
    expect(css).toContain('.project-spiral__chrome')
    expect(css).toContain('--project-chrome-top')
    expect(css).toContain('--project-nav-clearance')
    expect(css).toContain('justify-content: space-between')
    expect(rulesFor('.project-spiral__overlay-inner')).toContain('padding-top: 0')
    expect(rulesFor('.project-spiral__chrome')).toContain(
      'margin-bottom: calc(\n    var(--project-chrome-top)',
    )
    expect(css).toContain('.project-spiral__view-toggle')
    expect(css).toContain('min-height: 3.25rem')
    expect(css).toContain('.project-spiral__projects')
    expect(css).toContain('[data-project-view="spiral"]')
    expect(css).toContain('[data-project-view="index"]')
    expect(css).toContain('grid-template-columns')
    expect(css).toContain('.project-spiral__technologies')
    expect(css).not.toContain('.project-spiral__mode')
    const mobileRules = css.split('@media (max-width: 767px)')[1]
      ?.split('@media (prefers-reduced-motion: reduce)')[0] ?? ''
    expect(mobileRules).not.toMatch(
      /\.project-spiral__chrome\s*\{[^}]*margin-bottom/,
    )
  })
})
