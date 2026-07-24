import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const css = fs.readFileSync(path.join(process.cwd(), 'app/styles/projects.css'), 'utf8')

describe('project spiral styles', () => {
  it('provides the grid stage, active link, and progressive-enhancement fallback', () => {
    expect(css).toContain('.project-spiral__stage')
    expect(css).toContain('data-project-spiral-enhanced')
    expect(css).toContain('min-height: 360svh')
    expect(css).toContain('position: sticky')
    expect(css).toContain('.project-spiral__active-link')
    expect(css).toContain('repeating-linear-gradient')
  })

  it('keeps the 3D stage responsive while preserving the reduced-motion fallback', () => {
    expect(css).toContain('@media (max-width: 767px)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('.project-spiral__fallback')
    const mobileRules = css.split('@media (max-width: 767px)')[1]
      ?.split('@media (prefers-reduced-motion: reduce)')[0]
    expect(mobileRules).not.toContain('.project-spiral__stage')
    expect(mobileRules).toContain('.project-spiral__index')
  })
})
