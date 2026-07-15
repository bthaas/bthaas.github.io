import { initializeAtlas } from './runtime'

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initializeAtlas(), { once: true })
} else {
  initializeAtlas()
}
