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

test('Settings IA — five tabs with screenshots', async () => {
  test.setTimeout(90000)
  const caseSlug = 'settings-ui-reorg'

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

  const shot = (name: string) => e2eScreenshotPath(caseSlug, name)

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

  await expect(page.locator('button:has-text("General")')).toBeVisible()

  await page.screenshot({ path: shot('01-general.png'), fullPage: true })

  await page.locator('button:has-text("News sources")').click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: shot('02-news.png'), fullPage: true })

  await page.locator('button:has-text("Voice & prompts")').click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: shot('03-voice.png'), fullPage: true })

  await page.locator('button:has-text("Style")').click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: shot('04-style.png'), fullPage: true })

  await page.locator('button:has-text("Displays")').click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: shot('05-displays-monitors.png'), fullPage: true })

  await page.locator('button:has-text("History")').click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: shot('06-displays-history.png'), fullPage: true })
})
