import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { test, expect, _electron as electron } from '@playwright/test'
import { getSettingsPage, getWallpaperWindow } from './helpers/electronSettingsPage'
import {
  applyDocsHeroStyle,
  applyDocsHeroVoiceEnglish,
  captureDocsHeroScreenshot,
  resolveGeminiKeyForDocsHero,
  waitForLivePhrase
} from './helpers/docsHeroSetup'

/**
 * One live Gemini refresh for README hero-wallpaper.png (all widgets, English absurd proverb).
 * Requires GEMINI_API_KEY; skipped in CI.
 */
test.describe('README hero wallpaper (live Gemini)', () => {
  test('capture hero-wallpaper.png with real AI', async () => {
    test.setTimeout(180_000)
    test.skip(!!process.env.CI, 'live hero uses Gemini and network')
    const geminiKey = resolveGeminiKeyForDocsHero()
    test.skip(!geminiKey, 'Set GEMINI_API_KEY or save a key in Murmur settings')

    const userDataDir = mkdtempSync(join(tmpdir(), 'murmur-docs-hero-'))
    const env = { ...process.env }
    delete env.MURMUR_E2E
    delete env.ELECTRON_RUN_AS_NODE

    const electronApp = await electron.launch({
      args: ['.', `--user-data-dir=${userDataDir}`],
      env
    })

    try {
      const page = await getSettingsPage(electronApp)
      await page.waitForLoadState('load')
      await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 20_000 }).catch(() => {})

      const wizardHeader = page.locator('text=First-time Setup Wizard')
      if (!(await wizardHeader.isVisible().catch(() => false))) {
        throw new Error('Expected first-run wizard in isolated userData for live hero capture')
      }

      await page.locator('input[type="password"]').fill(geminiKey!)
      const feedInput = page.locator('input[type="url"]')
      if (await feedInput.isVisible()) {
        await feedInput.fill('https://feeds.bbci.co.uk/news/rss.xml')
      }
      await page.locator('button:has-text("Start Murmur")').click()
      await page.locator('aside').filter({ has: page.getByRole('button', { name: 'General' }) }).waitFor({
        state: 'visible',
        timeout: 15_000
      })
      await page.waitForTimeout(400)

      await applyDocsHeroStyle(page)
      await applyDocsHeroVoiceEnglish(page)

      await page.locator('button:has-text("Refresh Now")').click()
      const phrase = await waitForLivePhrase(page)
      console.log('[docs-hero-live] phrase preview:', phrase.slice(0, 160).replace(/\n/g, ' '))

      await captureDocsHeroScreenshot(electronApp)

      const wallpaperText = await getWallpaperWindow(electronApp).evaluate(() => document.body.innerText)

      expect(wallpaperText.toLowerCase()).not.toContain('stubbed surreal phrase')
      expect(wallpaperText).toMatch(/concepts sampled/i)
      expect(wallpaperText).toMatch(/sources contributed/i)
    } finally {
      await electronApp.close()
    }
  })
})
