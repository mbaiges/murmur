import { test, expect, _electron as electron, ElectronApplication } from '@playwright/test'
import { existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { e2eScreenshotPath } from './helpers/screenshotPaths'
import { getSettingsPage, getWallpaperWindow } from './helpers/electronSettingsPage'
import { e2eElectronLaunchOptions } from './helpers/e2eLaunch'

/**
 * Diagnoses settings preview vs wallpaper overlay vs painted PNG cache.
 * Run: npx playwright test tests/e2e/wallpaper-desktop-debug.spec.ts
 */
test.describe.serial('Wallpaper desktop debug', () => {
  let electronApp: ElectronApplication

  test.beforeAll(async () => {
    electronApp = await electron.launch(e2eElectronLaunchOptions())
  })

  test.afterAll(async () => {
    await electronApp.close()
  })

  test('capture settings preview, overlay, and report paint/set state', async () => {
    test.setTimeout(120_000)
    const caseSlug = 'wallpaper-desktop-debug'
    const page = await getSettingsPage(electronApp)

    await page.waitForLoadState('load')
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15_000 }).catch(() => {})

    const wizardHeader = page.locator('text=First-time Setup Wizard')
    if (await wizardHeader.isVisible().catch(() => false)) {
      await page.locator('input[type="password"]').fill('test-api-key')
      await page.locator('input[type="url"]').fill('http://stub.com/feed')
      await page.locator('button:has-text("Start Murmur")').click()
      await page.locator('aside').waitFor({ state: 'visible', timeout: 10_000 })
    }

    await page.locator('button:has-text("Style")').click()
    await page.waitForTimeout(800)

    const clickbait = page.getByTestId('mood-card-clickbait-press')
    if (await clickbait.isVisible().catch(() => false)) {
      await clickbait.click()
      await page.waitForTimeout(500)
      const apply = page.getByRole('button', { name: /Apply changes/i })
      if (await apply.isVisible().catch(() => false)) {
        await apply.click()
        await page.waitForTimeout(1500)
      }
    }

    await page.screenshot({ path: e2eScreenshotPath(caseSlug, '01-settings-style.png'), fullPage: true })

    await page.locator('button:has-text("Refresh Now")').click()
    await page.waitForTimeout(4000)

    const windows = electronApp.windows().map((w) => ({
      url: w.url(),
      title: ''
    }))
    for (let i = 0; i < electronApp.windows().length; i++) {
      windows[i].title = await electronApp.windows()[i].title().catch(() => '')
    }

    let overlayText = ''
    let overlayShot = ''
    const wallpaperWins = electronApp.windows().filter((w) => w.url().includes('view=wallpaper'))
    if (wallpaperWins.length > 0) {
      const wallpaper = wallpaperWins[0]
      await wallpaper.waitForTimeout(1000)
      overlayText = await wallpaper.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim())
      overlayShot = e2eScreenshotPath(caseSlug, '02-wallpaper-overlay.png')
      await wallpaper.screenshot({ path: overlayShot })
    }

    const state = await page.evaluate(async () => {
      const api = (window as unknown as { api?: { getState: () => Promise<unknown>; getScreens: () => Promise<unknown>; getConfig: () => Promise<unknown> } }).api
      if (!api) return null
      const [st, screens, config] = await Promise.all([api.getState(), api.getScreens(), api.getConfig()])
      return { state: st, screens, config }
    })

    const cacheDir = join(homedir(), 'Library/Application Support/Murmur/wallpaper_cache')
    const cacheFiles = existsSync(cacheDir)
      ? readdirSync(cacheDir).map((name) => {
          const p = join(cacheDir, name)
          const st = statSync(p)
          return { name, bytes: st.size, mtime: st.mtime.toISOString() }
        })
      : []

    const report = {
      windowCount: electronApp.windows().length,
      windows,
      wallpaperOverlayCount: wallpaperWins.length,
      overlayTextPreview: overlayText.slice(0, 240),
      overlayTextLength: overlayText.length,
      screens: state && typeof state === 'object' ? (state as { screens: unknown }).screens : null,
      monitorIds:
        state && typeof state === 'object'
          ? ((state as { config?: { monitors?: { id: string }[] } }).config?.monitors ?? []).map((m) => m.id)
          : [],
      lastPhraseKeys:
        state && typeof state === 'object'
          ? Object.keys((state as { state?: { lastPhrases?: Record<string, string> } }).state?.lastPhrases ?? {})
          : [],
      lastPhrases:
        state && typeof state === 'object'
          ? (state as { state?: { lastPhrases?: Record<string, string> } }).state?.lastPhrases
          : {},
      cacheFiles
    }

    console.log('WALLPAPER_DEBUG_REPORT', JSON.stringify(report, null, 2))

    await page.screenshot({ path: e2eScreenshotPath(caseSlug, '03-settings-after-refresh.png'), fullPage: true })

    expect(wallpaperWins.length, 'expected at least one wallpaper overlay on macOS/E2E').toBeGreaterThan(0)
    expect(overlayText.length, 'overlay should contain phrase text').toBeGreaterThan(5)
  })
})
