import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss, { type Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

const stylesheetPath = resolve(process.cwd(), 'app/styles/page-flow.css')

function declarationsFor(stylesheet: string, selector: string): Record<string, string> {
  const declarations: Record<string, string> = {}

  postcss.parse(stylesheet).walkRules((rule: Rule) => {
    if (!rule.selectors.includes(selector)) return
    rule.walkDecls((declaration) => {
      declarations[declaration.prop] = declaration.value
    })
  })

  return declarations
}

describe('continuous page color system', () => {
  it('uses the opening cream and one shared hairline across every homepage chapter', () => {
    expect(existsSync(stylesheetPath)).toBe(true)
    const stylesheet = readFileSync(stylesheetPath, 'utf8')
    const root = declarationsFor(stylesheet, ':root')

    expect(root).toMatchObject({
      '--page-accent': '#8e6810',
      '--page-rule': 'rgb(17 19 15 / 14%)',
      '--page-surface': 'var(--cream)',
    })

    for (const selector of [
      '.hero-section',
      '.experience-section',
      '.projects-section',
      '.craft-section',
      '.contact-section',
    ]) {
      expect(declarationsFor(stylesheet, selector)).toMatchObject({
        'background-color': 'var(--page-surface)',
        color: 'var(--ink)',
      })
      expect(declarationsFor(stylesheet, selector)['background-image']).toContain(
        'var(--page-rule)',
      )
    }
  })

  it('removes the dark experience wash and keeps its text readable on cream', () => {
    expect(existsSync(stylesheetPath)).toBe(true)
    const stylesheet = readFileSync(stylesheetPath, 'utf8')

    expect(declarationsFor(stylesheet, '.experience-section::before')).toMatchObject({
      content: 'none',
    })
    expect(declarationsFor(stylesheet, '.experience-intro .section-heading h2')).toMatchObject({
      color: 'var(--ink)',
    })
    expect(declarationsFor(stylesheet, '.experience-kicker')).toMatchObject({
      color: 'var(--muted)',
    })
  })

  it('uses the same cream surface and soft rules through skills and contact', () => {
    expect(existsSync(stylesheetPath)).toBe(true)
    const stylesheet = readFileSync(stylesheetPath, 'utf8')

    expect(declarationsFor(stylesheet, '.skill-sphere')).toMatchObject({
      'background-color': 'var(--page-surface)',
      'border-bottom-color': 'var(--page-rule)',
    })
    expect(declarationsFor(stylesheet, '.craft-board')).toMatchObject({
      'border-bottom-color': 'var(--page-rule)',
    })
    expect(declarationsFor(stylesheet, '.contact-board')).toMatchObject({
      'border-top-color': 'var(--page-rule)',
    })
  })
})
