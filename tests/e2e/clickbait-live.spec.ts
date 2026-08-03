import { test, expect, _electron as electron } from '@playwright/test'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { e2eScreenshotPath } from './helpers/screenshotPaths'
import { getSettingsPage, getWallpaperWindow } from './helpers/electronSettingsPage'
import { applySettingsChanges, clickMoodCard, primaryMonitorProfile } from './helpers/styleSettings'

/**
 * Uses real user config (no MURMUR_E2E stubs). Skipped in CI by default.
 */
test('live app: Clickbait Press shows phrase on desktop overlay', async () => {
  test.setTimeout(120_000)
  test.skip(process.platform !== 'darwin', 'macOS live overlay test')
  test.skip(!!process.env.CI, 'live test uses local user config')

  const env = { ...process.env }
  delete env.MURMUR_E2E
  delete env.ELECTRON_RUN_AS_NODE

  const electronApp = await electron.launch({ args: ['.'], env })

  try {
    const page = await getSettingsPage(electronApp)
    await page.waitForLoadState('load')
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 20_000 }).catch(() => {})

    const wizard = page.locator('text=First-time Setup Wizard')
    if (await wizard.isVisible().catch(() => false)) {
      test.skip(true, 'No saved API key in user config')
    }
    await expect(page.locator('aside')).toBeVisible({ timeout: 15_000 })

    await clickMoodCard(page, 'mood-card-clickbait-press')

    const wallpaper = getWallpaperWindow(electronApp)
    const text = await wallpaper.evaluate(() => document.body.innerText.trim())
    expect(text.length).toBeGreaterThan(10)

    const overlayShot = e2eScreenshotPath('clickbait-live-overlay', 'wallpaper.png')
    await wallpaper.screenshot({ path: overlayShot })
    console.log('Screenshot:', overlayShot)

    const settingsShot = e2eScreenshotPath('clickbait-live-overlay', 'settings.png')
    await page.screenshot({ path: settingsShot })
    console.log('Screenshot:', settingsShot)

    const userData = join(process.env.HOME || '', 'Library/Application Support/Murmur/murmur.config.json')
    if (existsSync(userData)) {
      const cfg = JSON.parse(readFileSync(userData, 'utf8'))
      const profile = primaryMonitorProfile(cfg) as { animation?: string }
      expect(profile.animation).toBe('Fade')
    }
  } finally {
    await electronApp.close()
  }
})
