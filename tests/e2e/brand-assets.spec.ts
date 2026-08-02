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

test('Brand assets — settings title bar and sidebar logo', async () => {
  test.setTimeout(90000)
  const caseSlug = 'brand-assets'

  const page = await openSettingsDashboard(electronApp)

  const titleBarLogo = page.locator('header img[src*="logo"]').first()
  await expect(titleBarLogo).toBeVisible()
  const nw = await titleBarLogo.evaluate((img: HTMLImageElement) => img.naturalWidth)
  expect(nw).toBeGreaterThan(0)

  const sidebarLogo = page.locator('aside img[src*="logo"]').first()
  await expect(sidebarLogo).toBeVisible()

  await page.screenshot({ path: e2eScreenshotPath(caseSlug, '01-settings-chrome.png'), fullPage: true })

  const titleBox = await titleBarLogo.boundingBox()
  const sidebarBox = await sidebarLogo.boundingBox()
  expect(titleBox?.width).toBeGreaterThan(8)
  expect(sidebarBox?.width).toBeGreaterThan(24)

  await titleBarLogo.screenshot({ path: e2eScreenshotPath(caseSlug, '02-titlebar-logo.png') })
  await sidebarLogo.screenshot({ path: e2eScreenshotPath(caseSlug, '03-sidebar-logo.png') })
})
