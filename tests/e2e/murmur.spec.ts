import { test, expect, _electron as electron, ElectronApplication } from '@playwright/test'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

let electronApp: ElectronApplication

test.beforeAll(async () => {
  electronApp = await electron.launch({
    args: ['.'],
    env: { ...process.env, MURMUR_E2E: 'true' }
  })
})

test.afterAll(async () => {
  await electronApp.close()
})

test('Settings Dashboard loads and saves configuration with screenshots', async () => {
  test.setTimeout(60000)

  // Wait for settings window to be active
  let page = await electronApp.firstWindow()
  
  for (let attempt = 0; attempt < 25; attempt++) {
    const windows = electronApp.windows()
    let found = false
    for (const win of windows) {
      const url = win.url()
      if (url && !url.includes('view=wallpaper')) {
        page = win
        found = true
        break
      }
    }
    if (found) break
    await page.waitForTimeout(200)
  }

  await page.waitForLoadState('load')

  const title = await page.title()
  expect(title).toBe('Murmur Settings')

  // Wait for loading spinner to detach
  await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 })

  const screenshotsDir = 'tests/e2e/artifacts/screenshots'
  if (!existsSync(screenshotsDir)) {
    mkdirSync(screenshotsDir, { recursive: true })
  }

  await page.screenshot({ path: join(screenshotsDir, '01_wizard_or_dashboard.png') })
  console.log('Took screenshot: 01_wizard_or_dashboard.png')

  // Wait for either the Wizard header or the Dashboard sidebar to appear
  const wizardHeader = page.locator('text=First-time Setup Wizard')
  const sidebar = page.locator('aside')
  
  await Promise.race([
    wizardHeader.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
    sidebar.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
  ])

  const isWizard = await wizardHeader.isVisible()
  if (isWizard) {
    await page.locator('input[type="password"]').fill('test-api-key')
    await page.screenshot({ path: join(screenshotsDir, '02_filled_wizard.png') })
    console.log('Took screenshot: 02_filled_wizard.png')

    await page.locator('button:has-text("Start Murmur")').click()
    await sidebar.waitFor({ state: 'visible', timeout: 10000 })
  }

  await expect(sidebar).toBeVisible()

  await page.screenshot({ path: join(screenshotsDir, '03_main_dashboard_feeds.png') })
  console.log('Took screenshot: 03_main_dashboard_feeds.png')

  await page.locator('button:has-text("Appearance")').click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: join(screenshotsDir, '04_appearance_tab.png') })
  console.log('Took screenshot: 04_appearance_tab.png')

  await page.locator('button:has-text("Monitors")').click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: join(screenshotsDir, '05_monitors_tab.png') })
  console.log('Took screenshot: 05_monitors_tab.png')

  await page.locator('button:has-text("Phrase History")').click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: join(screenshotsDir, '06_history_tab.png') })
  console.log('Took screenshot: 06_history_tab.png')
})
