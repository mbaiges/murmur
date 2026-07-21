import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  expect: {
    timeout: 10_000
  },
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  use: {
    screenshot: 'on',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  }
})
