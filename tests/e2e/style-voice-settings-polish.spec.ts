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

  const background = page.getByTestId('style-section-background')
  await background.locator('button').nth(1).click()
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
  await expect(page.getByText('Primary display · 4:3')).toBeVisible()
  const frame = page.getByTestId('style-mini-preview-frame')
  const box = await frame.boundingBox()
  expect(box).not.toBeNull()
  if (box) {
    expect(box.width / box.height).toBeCloseTo(4 / 3, 1)
  }
  await page.screenshot({ path: shot('01-style-preview.png'), fullPage: true })
})

test('Style preview can be hidden', async () => {
  test.setTimeout(60000)
  const page = await openSettingsDashboard(electronApp)
  await page.locator('button:has-text("Style")').click()
  await page.getByTestId('style-mini-preview-hide').click()
  await expect(page.getByTestId('style-mini-preview-collapsed')).toBeVisible()
  await page.getByTestId('style-mini-preview-show').click()
  await expect(page.getByTestId('style-mini-preview')).toBeVisible()
})

test('Visual-only Apply does not increment E2E generation counter', async () => {
  test.setTimeout(90000)
  const page = await openSettingsDashboard(electronApp)

  await page.evaluate(async () => {
    await window.api?.resetE2eGenerationCount?.()
  })

  await page.locator('button:has-text("Style")').click()
  const background = page.getByTestId('style-section-background')
  await background.locator('button').nth(2).click()
  await background.locator('button').nth(3).click()

  const countBeforeApply = await page.evaluate(async () => window.api?.getE2eGenerationCount?.())

  await page.getByTestId('settings-apply-changes').click()
  await page.waitForTimeout(800)

  const countAfterApply = await page.evaluate(async () => window.api?.getE2eGenerationCount?.())
  expect(countBeforeApply).toBe(0)
  expect(countAfterApply).toBe(0)
})
