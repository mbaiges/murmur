import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5000
  },
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  use: {
    screenshot: 'on',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  }
})
