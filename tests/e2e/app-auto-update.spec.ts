import { test, expect, _electron as electron, ElectronApplication } from '@playwright/test'
import { e2eScreenshotPath } from './helpers/screenshotPaths'
import { e2eElectronLaunchOptions } from './helpers/e2eLaunch'

let electronApp: ElectronApplication

test.beforeAll(async () => {
  electronApp = await electron.launch(e2eElectronLaunchOptions())
})

test.afterAll(async () => {
  await electronApp.close()
})

async function getSettingsPage(electronApp: ElectronApplication) {
  let page = await electronApp.firstWindow()
  for (let attempt = 0; attempt < 25; attempt++) {
    for (const win of electronApp.windows()) {
      const url = win.url()
      if (url && !url.includes('view=wallpaper')) {
        page = win
        break
      }
    }
    await page.waitForTimeout(200)
  }
  await page.waitForLoadState('load')
  await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 })

  const wizardHeader = page.locator('text=First-time Setup Wizard')
  const sidebar = page.locator('aside')
  await Promise.race([
    wizardHeader.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
    sidebar.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
  ])

  if (await wizardHeader.isVisible()) {
    await page.locator('input[type="password"]').fill('test-api-key')
    await page.locator('button:has-text("Start Murmur")').click()
    await sidebar.waitFor({ state: 'visible', timeout: 10000 })
  }

  await page.locator('button:has-text("General")').click()
  await page.waitForTimeout(300)
  return page
}

test('App updates — General section and settings tab IPC', async () => {
  test.setTimeout(90000)
  const featureSlug = 'app-auto-update'
  const shot = (name: string) => e2eScreenshotPath(featureSlug, name)

  const page = await getSettingsPage(electronApp)

  const section = page.getByTestId('app-update-section')
  await expect(section).toBeVisible()
  await expect(page.getByTestId('app-update-status')).toContainText(/installed builds|update/i)
  await expect(page.getByTestId('app-update-check-btn')).toBeDisabled()

  await page.screenshot({ path: shot('01-general-app-updates.png'), fullPage: true })

  await page.locator('button:has-text("News sources")').click()
  await page.waitForTimeout(300)

  await page.evaluate(async () => {
    await window.api?.e2eOpenSettingsTab?.('general')
  })
  await page.waitForTimeout(400)

  await expect(page.locator('button:has-text("General")')).toHaveClass(/bg-indigo|text-white|font/)
  await expect(section).toBeVisible()
  await page.screenshot({ path: shot('02-settings-open-tab-general.png'), fullPage: true })
})
