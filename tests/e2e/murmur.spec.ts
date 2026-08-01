import { test, expect, _electron as electron, ElectronApplication } from '@playwright/test'
import { e2eScreenshotPath } from './helpers/screenshotPaths'

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
  const caseSlug = 'settings-dashboard'

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

  await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 })

  const logShot = (name: string) => {
    const path = e2eScreenshotPath(caseSlug, name)
    console.log('Screenshot:', path)
    return path
  }

  await page.screenshot({ path: logShot('01-wizard-or-dashboard.png') })

  const wizardHeader = page.locator('text=First-time Setup Wizard')
  const sidebar = page.locator('aside')

  await Promise.race([
    wizardHeader.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
    sidebar.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
  ])

  const isWizard = await wizardHeader.isVisible()
  if (isWizard) {
    await page.locator('input[type="password"]').fill('test-api-key')
    await page.screenshot({ path: logShot('02-filled-wizard.png') })
    await page.locator('button:has-text("Start Murmur")').click()
    await sidebar.waitFor({ state: 'visible', timeout: 10000 })
  }

  await expect(sidebar).toBeVisible()

  await page.screenshot({ path: logShot('03-main-dashboard-feeds.png') })

  await page.locator('button:has-text("Appearance")').click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: logShot('04-appearance-tab.png') })

  await page.locator('button:has-text("Monitors")').click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: logShot('05-monitors-tab.png') })

  await page.locator('button:has-text("Phrase History")').click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: logShot('06-history-tab.png') })
})
