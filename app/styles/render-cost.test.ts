import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import postcss, { type Root } from 'postcss'
import { describe, expect, it } from 'vitest'

const stylesDirectory = resolve(process.cwd(), 'app/styles')

function parseStylesheet(fileName: string): Root {
  return postcss.parse(readFileSync(resolve(stylesDirectory, fileName), 'utf8'))
}

const stylesheets = readdirSync(stylesDirectory)
  .filter((fileName) => fileName.endsWith('.css'))
  .map((fileName) => ({ fileName, root: parseStylesheet(fileName) }))

describe('render-cost budget', () => {
  it('does not paint a full-viewport blended overlay above the page', () => {
    const overlays: string[] = []
    stylesheets.forEach(({ fileName, root }) => {
      root.walkRules((rule) => {
        if (rule.selectors.includes('body::before')) overlays.push(`${fileName}: ${rule.selector}`)
      })
      root.walkAtRules('keyframes', (atRule) => {
        if (atRule.params === 'atlas-live-grain') overlays.push(`${fileName}: @keyframes ${atRule.params}`)
      })
    })

    expect(overlays).toEqual([])
  })

  it('keeps floating controls above WebGL canvases free of per-frame backdrop blurs', () => {
    const blurredRules: string[] = []
    ;['header.css', 'projects.css'].forEach((fileName) => {
      parseStylesheet(fileName).walkDecls(/^(-webkit-)?backdrop-filter$/, (declaration) => {
        if (declaration.value === 'none') return
        const parent = declaration.parent
        const selector = parent && 'selector' in parent ? String(parent.selector) : 'unknown'
        blurredRules.push(`${fileName}: ${selector}`)
      })
    })

    expect(blurredRules).toEqual([])
  })
})
