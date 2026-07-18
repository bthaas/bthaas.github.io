import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './artifacts/playwright',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['line']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run serve:deployment',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { height: 1200, width: 1600 } },
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'], viewport: { height: 1200, width: 1600 } },
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'], viewport: { height: 1200, width: 1600 } },
    },
    {
      name: 'webkit-iphone',
      use: { ...devices['iPhone 13'] },
    },
  ],
})
