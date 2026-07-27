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

describe('Experience timeline', () => {
  it('lays career stops across a horizontal rail as upright columns', () => {
    const experienceStyles = readFileSync(
      resolve(process.cwd(), 'app/styles/experience.css'),
      'utf8',
    )

    expect(declarationsFor(experienceStyles, '.experience-timeline__list')).toMatchObject({
      display: 'grid',
      position: 'relative',
    })
    expect(declarationsFor(
      experienceStyles,
      '.experience-timeline__rail',
      '(min-width: 960px)',
    )).toMatchObject({
      'overflow-x': 'auto',
      'scroll-snap-type': 'x proximity',
    })
    expect(declarationsFor(
      experienceStyles,
      '.experience-timeline__list',
      '(min-width: 960px)',
    )).toMatchObject({
      'grid-template-columns': 'repeat(var(--experience-stop-count), minmax(0, 1fr))',
      'min-width': 'calc(var(--experience-stop-count) * 15rem)',
    })
    expect(declarationsFor(
      experienceStyles,
      '.experience-timeline__stop-header',
      '(min-width: 960px)',
    )).toMatchObject({
      display: 'grid',
      'grid-template-columns': 'minmax(0, 1fr)',
    })
    expect(declarationsFor(
      experienceStyles,
      '.experience-timeline__stop::before',
      '(min-width: 960px)',
    )).toMatchObject({
      height: '1px',
      left: '0',
      right: '0',
    })
    expect(declarationsFor(
      experienceStyles,
      '.experience-timeline__stop details:not([open]) > .experience-timeline__details',
    )).toMatchObject({
      display: 'none',
    })
  })

  it('draws one dominant axis, three tight sub-lines, and an education star above', () => {
    const experienceStyles = readFileSync(
      resolve(process.cwd(), 'app/styles/experience.css'),
      'utf8',
    )

    expect(declarationsFor(
      experienceStyles,
      '.experience-timeline__spine-line',
    )).toMatchObject({
      height: '3px',
      position: 'absolute',
    })
    expect(declarationsFor(
      experienceStyles,
      '.experience-timeline__duration-line',
    )).toMatchObject({
      left: 'var(--experience-lane-start)',
      right: 'calc(100% - var(--experience-lane-end))',
      position: 'absolute',
      top: 'calc(var(--experience-lane-index) * 1.65rem)',
    })
    expect(declarationsFor(
      experienceStyles,
      '.experience-timeline__milestone',
    )).toMatchObject({
      bottom: 'calc(100% + 0.35rem)',
      left: 'var(--experience-position)',
      position: 'absolute',
    })
    expect(declarationsFor(
      experienceStyles,
      '.experience-timeline__line-tooltip',
    )).toMatchObject({
      opacity: '0',
      'pointer-events': 'none',
    })
    expect(declarationsFor(
      experienceStyles,
      '.experience-timeline__duration-link:is(:hover, :focus) .experience-timeline__line-tooltip',
    )).toMatchObject({
      opacity: '1',
    })
    expect(declarationsFor(
      experienceStyles,
      [
        ".experience-timeline__stop[data-timeline-highlighted='true']",
        '.experience-timeline__stop:is(:hover, :focus-within)',
      ].join(',\n'),
    )).toMatchObject({
      'background-color': 'rgb(255 253 245 / 92%)',
      'box-shadow': expect.stringContaining('var(--experience-gold)'),
      'z-index': '2',
    })
  })

  it('uses an intentional stacked route at 390px', () => {
    const experienceStyles = readFileSync(
      resolve(process.cwd(), 'app/styles/experience.css'),
      'utf8',
    )

    expect(declarationsFor(
      experienceStyles,
      '.experience-timeline__rail',
      '(max-width: 959px)',
    )).toMatchObject({
      'overflow-x': 'visible',
      'scroll-snap-type': 'none',
    })
    expect(declarationsFor(
      experienceStyles,
      '.experience-timeline__list',
      '(max-width: 959px)',
    )).toMatchObject({
      'grid-auto-flow': 'row',
      'grid-template-columns': '1fr',
      'overflow-x': 'visible',
      'scroll-snap-type': 'none',
    })
    expect(declarationsFor(
      experienceStyles,
      '.experience-timeline__stop-header',
      '(max-width: 640px)',
    )).toMatchObject({
      'grid-template-columns': '3rem minmax(0, 1fr) auto',
    })
  })
})
