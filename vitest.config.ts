import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/.git/**',
      '**/.claude/worktrees/**',
      '**/.next/**',
      '**/out/**',
      '**/tests/e2e/**',
    ],
    coverage: {
      exclude: [
        'components/bits/LetterGlitch.tsx',
        'components/bits/SplashCursor.tsx',
      ],
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': new URL('./', import.meta.url).pathname,
    },
  },
})
