import { test, expect, _electron as electron, ElectronApplication } from '@playwright/test'
import { join } from 'path'
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

test('Background image — modes, Cloudflare general, AI refresh stubs', async () => {
  test.setTimeout(120000)
  const caseSlug = 'background-image'

  const page = await openSettingsDashboard(electronApp)

  await page.locator('button:has-text("General")').click()
  await expect(page.getByTestId('general-cloudflare-section')).toBeVisible()
  await page.screenshot({ path: e2eScreenshotPath(caseSlug, '00-general-cloudflare.png') })

  await page.locator('button:has-text("Style")').click()
  const backgroundSection = page.getByTestId('style-section-background')
  await expect(backgroundSection).toBeVisible()
  await backgroundSection.scrollIntoViewIfNeeded()
  await expect(page.getByTestId('style-background-mode-gradient')).toBeVisible()
  await page.screenshot({ path: e2eScreenshotPath(caseSlug, '01-style-gradient.png') })

  await page.getByTestId('style-background-mode-ai').click()
  await backgroundSection.scrollIntoViewIfNeeded()
  await expect(page.getByTestId('style-background-ai-panel')).toBeVisible()
  await expect(page.getByTestId('style-background-prompt-template')).toBeVisible()
  await expect(page.getByTestId('style-background-ai-preset-select')).toBeVisible()
  await page.getByRole('button', { name: 'Apply changes' }).click()
  await page.waitForTimeout(1500)

  await page.evaluate(async () => {
    await window.api?.resetE2eBackgroundPipelineCounts?.()
  })

  await page.locator('button:has-text("Refresh Now")').click()
  await page.waitForTimeout(3500)

  const counts = await page.evaluate(async () => window.api?.getE2eBackgroundPipelineCounts?.())
  expect(counts?.imagePrompt).toBeGreaterThanOrEqual(1)
  expect(counts?.provider).toBeGreaterThanOrEqual(1)
  await backgroundSection.scrollIntoViewIfNeeded()
  await page.screenshot({ path: e2eScreenshotPath(caseSlug, '03-ai-refresh.png') })

  const fixturePath = join(process.cwd(), 'tests/e2e/fixtures/sample-bg.png')
  await page.evaluate(async (path) => {
    const cfg = await window.api!.getConfig()
    const monitorId = cfg.monitors[0]?.id
    if (!monitorId || !window.api?.importBackgroundPhoto) return
    const { relPath } = await window.api.importBackgroundPhoto(monitorId, path)
    const monitors = cfg.monitors.map((m) =>
      m.id === monitorId
        ? {
            ...m,
            profile: { ...m.profile, backgroundMode: 'photo' as const, backgroundPhotoRelPath: relPath }
          }
        : m
    )
    await window.api.saveConfig({ monitors })
  }, fixturePath)

  await page.getByTestId('style-background-mode-photo').click()
  await backgroundSection.scrollIntoViewIfNeeded()
  await page.waitForTimeout(800)
  await page.screenshot({ path: e2eScreenshotPath(caseSlug, '02-photo-applied.png') })
})
