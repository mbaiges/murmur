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
    await page.locator('button:has-text("Start Murmur")').click()
    await sidebar.waitFor({ state: 'visible', timeout: 10000 })
  }

  return page
}

test('Style & Voice polish — draft Apply bar', async () => {
  test.setTimeout(90000)
  const caseSlug = 'style-voice-settings-polish'
  const shot = (name: string) => e2eScreenshotPath(caseSlug, name)
  const page = await openSettingsDashboard(electronApp)

  await page.locator('button:has-text("Style")').click()
  await page.waitForTimeout(300)

  const themeSelect = page.locator('label:has-text("Default Theme")').locator('..').locator('select')
  await themeSelect.selectOption({ index: 1 })
  await page.waitForTimeout(300)

  await expect(page.getByTestId('settings-apply-bar')).toBeVisible()
  await page.screenshot({ path: shot('02-apply-bar.png'), fullPage: true })

  await page.locator('button:has-text("Voice & prompts")').click()
  await expect(page.getByTestId('settings-apply-bar')).toBeVisible()
  await page.screenshot({ path: shot('03-voice-tone-row.png'), fullPage: true })
})

test('Style & Voice polish — baseline Style tab', async () => {
  test.setTimeout(90000)
  const caseSlug = 'style-voice-settings-polish'
  const shot = (name: string) => e2eScreenshotPath(caseSlug, name)
  const page = await openSettingsDashboard(electronApp)

  await page.locator('button:has-text("Style")').click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: shot('01-style-preview.png'), fullPage: true })
})
