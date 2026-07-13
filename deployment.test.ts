import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('GitHub Pages export', () => {
  it('disables Jekyll processing so Next.js _next assets are served', () => {
    expect(existsSync(resolve(process.cwd(), 'public/.nojekyll'))).toBe(true)
  })
})
