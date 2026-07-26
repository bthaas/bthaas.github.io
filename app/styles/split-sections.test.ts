import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss, { type AtRule, type Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

function declarationsFor(
  stylesheet: string,
  selector: string,
  mediaQuery?: string,
): Record<string, string> {
  const root = postcss.parse(stylesheet)
  const declarations: Record<string, string> = {}

  root.walkRules(selector, (rule: Rule) => {
    const parent = rule.parent
    const parentMedia = parent?.type === 'atrule' && (parent as AtRule).name === 'media'
      ? (parent as AtRule).params
      : undefined

    if (parentMedia !== mediaQuery) return
    rule.walkDecls((declaration) => {
      declarations[declaration.prop] = declaration.value
    })
  })

  return declarations
}

describe('Experience flight path and Skills split board', () => {
  it('keeps the experience chapters readable by default and horizontal only when enhanced', () => {
    const experienceStyles = readFileSync(
      resolve(process.cwd(), 'app/styles/experience.css'),
      'utf8',
    )
    const craftStyles = readFileSync(resolve(process.cwd(), 'app/styles/craft.css'), 'utf8')

    expect(declarationsFor(experienceStyles, '.experience-flight__chapters')).toMatchObject({
      display: 'grid',
      gap: '1rem',
    })
    expect(declarationsFor(
      experienceStyles,
      '[data-experience-flight-enhanced] .experience-flight__chapters',
      '(min-width: 960px)',
    )).toMatchObject({
      display: 'flex',
      width: 'max-content',
    })
    expect(declarationsFor(craftStyles, '.craft-board')).toMatchObject({
      display: 'grid',
      'grid-template-areas': '"copy artwork"',
      'grid-template-columns': 'repeat(2, minmax(0, 1fr))',
    })
    expect(declarationsFor(craftStyles, '.craft-panel')).toMatchObject({
      'grid-area': 'copy',
    })
    expect(declarationsFor(craftStyles, '.craft-plate')).toMatchObject({
      'grid-area': 'artwork',
    })
    expect(declarationsFor(craftStyles, '.craft-plate--inset')).toMatchObject({
      margin: 'clamp(1rem, 1.5vw, 1.75rem)',
      'border-radius': 'clamp(1rem, 1.8vw, 1.6rem)',
    })
  })

  it('keeps skills stacked and experience in normal document flow on narrow screens', () => {
    const mediaQuery = '(max-width: 720px)'
    const experienceStyles = readFileSync(
      resolve(process.cwd(), 'app/styles/experience.css'),
      'utf8',
    )
    const craftStyles = readFileSync(resolve(process.cwd(), 'app/styles/craft.css'), 'utf8')

    expect(declarationsFor(experienceStyles, '.experience-flight__viewport')).toMatchObject({
      position: 'relative',
      width: 'var(--shell)',
    })
    expect(declarationsFor(craftStyles, '.craft-board', mediaQuery)).toMatchObject({
      'grid-template-areas': '"artwork" "copy"',
      'grid-template-columns': '1fr',
    })
  })
})
