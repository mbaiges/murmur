import { test, expect, _electron as electron, ElectronApplication } from '@playwright/test'
import { e2eScreenshotPath } from './helpers/screenshotPaths'
import { e2eElectronLaunchOptions } from './helpers/e2eLaunch'
import { applyAestheticMood, AESTHETIC_MOOD_IDS, isAestheticMoodActive } from '../../src/core/lib/presets/aestheticMoods'
import type { MonitorProfile } from '../../src/core/domain/types'
import { primaryMonitorProfile } from './helpers/styleSettings'

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

test('Style preview compacts on scroll and expands from chip', async () => {
  test.setTimeout(60000)
  const page = await openSettingsDashboard(electronApp)
  await page.locator('button:has-text("Style")').click()
  await expect(page.getByTestId('style-mini-preview-frame')).toBeVisible()
  await page.locator('main').evaluate((el) => {
    el.scrollTop = 480
  })
  await page.waitForTimeout(300)
  await expect(page.getByTestId('style-mini-preview-compact')).toBeVisible()
  await page.getByTestId('style-mini-preview-compact').click()
  await expect(page.getByTestId('style-mini-preview-floating')).toBeVisible()
  await page.getByTestId('style-mini-preview-floating-close').click()
  await expect(page.getByTestId('style-mini-preview-compact')).toBeVisible()
})

test('Draft persists across tabs without native confirm', async () => {
  test.setTimeout(60000)
  const page = await openSettingsDashboard(electronApp)
  await page.locator('button:has-text("Style")').click()
  await page.getByTestId('style-section-background').locator('button').nth(1).click()
  await page.locator('button:has-text("General")').click()
  await expect(page.getByTestId('settings-apply-bar')).toBeVisible()
})

test('Content Apply increments generation counter once', async () => {
  test.setTimeout(90000)
  const page = await openSettingsDashboard(electronApp)

  await page.evaluate(async () => {
    await window.api?.resetE2eGenerationCount?.()
  })

  await page.locator('button:has-text("Voice & prompts")').click()
  await page.getByRole('group', { name: 'Tone preset' }).getByRole('button', { name: 'Pro' }).click()
  await page.getByTestId('settings-apply-changes').click()
  await page.waitForTimeout(800)

  const count = await page.evaluate(async () => window.api?.getE2eGenerationCount?.())
  expect(count).toBe(1)
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

test('Mood-only Apply commits applyAestheticMood bundle', async () => {
  test.setTimeout(90000)
  const page = await openSettingsDashboard(electronApp)
  if (await page.getByTestId('settings-apply-bar').isVisible()) {
    await page.getByRole('button', { name: 'Reset' }).click()
    await page.waitForTimeout(200)
  }
  await page.locator('button:has-text("Style")').click()

  let moodId = AESTHETIC_MOOD_IDS[0]
  for (const id of AESTHETIC_MOOD_IDS) {
    const slug = id.toLowerCase().replace(/\s+/g, '-')
    const card = page.getByTestId(`mood-card-${slug}`)
    if (!(await card.locator('text=Active').isVisible())) {
      moodId = id
      await card.click()
      break
    }
  }

  await expect(page.getByTestId('settings-apply-bar')).toBeVisible()
  await page.getByTestId('settings-apply-changes').click()
  await expect
    .poll(async () => {
      const cfg = await page.evaluate(async () => window.api?.getConfig?.())
      if (!cfg) return false
      const profile = primaryMonitorProfile(cfg) as MonitorProfile
      return isAestheticMoodActive(profile, moodId)
    })
    .toBe(true)

  const after = await page.evaluate(async () => window.api?.getConfig?.())
  expect(after).toBeTruthy()
  const profile = primaryMonitorProfile(after!) as MonitorProfile
  const moodPatch = applyAestheticMood(moodId)
  for (const key of Object.keys(moodPatch) as (keyof MonitorProfile)[]) {
    expect(profile[key]).toEqual(moodPatch[key])
  }
})
