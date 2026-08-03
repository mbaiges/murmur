import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  expect: {
    timeout: 10_000
  },
  reporter: process.env.CI ? [['line']] : [['html', { outputFolder: 'playwright-report' }]],
  use: {
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
    screenshot: 'on',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  }
})
