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

async function openSettingsDashboard(electronApp: ElectronApplication) {
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
    await page.locator('input[type="url"]').fill('http://stub.com/feed')
    await page.locator('button:has-text("Start Murmur")').click()
    await sidebar.waitFor({ state: 'visible', timeout: 10000 })
  }

  return page
}

test('Per-monitor settings — display selector; sync chips hidden with one display', async () => {
  test.setTimeout(90000)
  const caseSlug = 'per-monitor-settings'

  const page = await openSettingsDashboard(electronApp)
  await page.locator('button:has-text("Refresh Now")').click()
  await page.waitForTimeout(2500)

  await expect(page.getByTestId('settings-display-select')).toBeVisible()
  await page.screenshot({ path: e2eScreenshotPath(caseSlug, '01-display-selector.png') })

  await page.locator('button:has-text("News sources")').click()
  await expect(page.getByTestId('settings-sync-tab-news')).toBeHidden()
  await page.screenshot({ path: e2eScreenshotPath(caseSlug, '02-news-scoped.png') })

  await page.locator('button:has-text("Voice & prompts")').click()
  await expect(page.getByTestId('settings-sync-tab-voice')).toBeHidden()
  await expect(page.getByTestId('settings-sync-all-tabs')).toBeHidden()
})
