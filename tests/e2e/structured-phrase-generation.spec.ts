import { test, expect, _electron as electron, ElectronApplication } from '@playwright/test'
import { e2eScreenshotPath } from './helpers/screenshotPaths'
import { getSettingsPage } from './helpers/electronSettingsPage'
import { e2eElectronLaunchOptions } from './helpers/e2eLaunch'

test.describe('Structured phrase generation — history UI', () => {
  let electronApp: ElectronApplication

  test.beforeAll(async () => {
    electronApp = await electron.launch(e2eElectronLaunchOptions())
  })

  test.afterAll(async () => {
    await electronApp.close()
  })

  test('history preview and raw JSON toggle after refresh', async () => {
    test.setTimeout(60_000)
    const page = await getSettingsPage(electronApp)
    await page.waitForLoadState('load')
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15_000 }).catch(() => {})

    const wizard = page.locator('text=First-time Setup Wizard')
    if (await wizard.isVisible().catch(() => false)) {
      await page.locator('input[type="password"]').fill('test-api-key')
      await page.locator('button:has-text("Start Murmur")').click()
      await page.locator('aside').waitFor({ state: 'visible', timeout: 10_000 })
    }

    await page.locator('button:has-text("Refresh Now")').click()
    await page.waitForTimeout(2500)

    await page.locator('button:has-text("Displays")').click()
    await page.waitForTimeout(400)
    await page.locator('button:has-text("History")').click()
    await page.waitForTimeout(500)

    await expect(page.getByRole('button', { name: 'Preview' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Raw JSON' })).toBeVisible()

    const previewShot = e2eScreenshotPath('structured-phrase-generation', '01-history-preview.png')
    await page.screenshot({ path: previewShot })
    console.log('Screenshot:', previewShot)

    await expect(page.getByText(/stubbed|surreal/i).first()).toBeVisible()

    await page.getByRole('button', { name: 'Raw JSON' }).click()
    await page.waitForTimeout(300)

    const rawText = await page.locator('pre').first().innerText()
    expect(rawText).toMatch(/"(phrase|quote|headline|left)"/)

    const rawShot = e2eScreenshotPath('structured-phrase-generation', '02-history-raw-json.png')
    await page.screenshot({ path: rawShot })
    console.log('Screenshot:', rawShot)
  })
})
