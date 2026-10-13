import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const config = readFileSync(resolve(process.cwd(), 'edge/wrangler.toml'), 'utf8')

describe('agent gateway Wrangler config', () => {
  it('routes only the canonical host through the Worker entry point', () => {
    expect(config).toMatch(/^main = "worker\.ts"$/m)
    expect(config).toContain('{ pattern = "www.bretthaas.com/*", zone_name = "bretthaas.com" }')
    expect(config).toMatch(/^workers_dev = false$/m)
  })

  it('keeps request logging off to honor the privacy policy', () => {
    expect(config).toMatch(/^\[observability\]\nenabled = false$/m)
  })
})
