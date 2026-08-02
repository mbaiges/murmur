import { test, expect, _electron as electron, ElectronApplication } from '@playwright/test'
import { e2eScreenshotPath } from './helpers/screenshotPaths'
import { getSettingsPage, getWallpaperWindow } from './helpers/electronSettingsPage'
import { e2eElectronLaunchOptions } from './helpers/e2eLaunch'

test.describe.serial('Clickbait Press diagnostics', () => {
  let electronApp: ElectronApplication

  test.beforeAll(async () => {
    electronApp = await electron.launch(e2eElectronLaunchOptions())
  })

  test.afterAll(async () => {
    await electronApp.close()
  })

  test('Fade Clickbait shows phrase in wallpaper window', async () => {
    test.setTimeout(90_000)
    const page = await getSettingsPage(electronApp)
    await page.waitForLoadState('load')
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15_000 }).catch(() => {})

    const wizardHeader = page.locator('text=First-time Setup Wizard')
    if (await wizardHeader.isVisible().catch(() => false)) {
      await page.locator('input[type="password"]').fill('test-api-key')
      await page.locator('button:has-text("Start Murmur")').click()
      await page.locator('aside').waitFor({ state: 'visible', timeout: 10_000 })
    }

    await page.locator('button:has-text("Style")').click()
    await page.waitForTimeout(500)

    const clickbaitCard = page.getByTestId('mood-card-clickbait-press')
    await clickbaitCard.click()
    await page.waitForTimeout(2500)

    expect(await page.locator('select').nth(2).inputValue()).toBe('Fade')

    const wallpaper = getWallpaperWindow(electronApp)
    await wallpaper.waitForTimeout(1500)

    const bodyText = await wallpaper.evaluate(() => document.body.innerText.trim())
    expect(bodyText.length).toBeGreaterThan(5)
    expect(bodyText.toLowerCase()).toContain('stubbed')

    const shot = e2eScreenshotPath('clickbait-diagnostics-fade', 'wallpaper.png')
    await wallpaper.screenshot({ path: shot })
    console.log('Screenshot:', shot)
  })

  test('Instant animation removes overlay (explains blank desktop if native paint fails)', async () => {
    test.setTimeout(90_000)
    const page = await getSettingsPage(electronApp)
    await page.locator('button:has-text("Style")').click()
    await page.waitForTimeout(300)

    await page.locator('select').nth(2).selectOption('Instant')
    await page.waitForTimeout(2500)

    const wins = electronApp.windows().filter((w) => w.url().includes('view=wallpaper'))
    if (process.platform === 'darwin') {
      expect(wins.length, 'macOS keeps overlay even on Instant Cut').toBeGreaterThan(0)
    } else {
      expect(wins.length, 'Windows drops overlay on Instant Cut').toBe(0)
    }

    const settingsShot = e2eScreenshotPath('clickbait-diagnostics-instant', 'settings-appearance.png')
    await page.screenshot({ path: settingsShot })
    console.log('Screenshot:', settingsShot)

    await page.locator('button:has-text("Displays")').click()
    await page.waitForTimeout(500)
    const monitorsText = await page.locator('main').innerText()
    expect(monitorsText.toLowerCase()).toContain('stubbed')

    const monitorsShot = e2eScreenshotPath('clickbait-diagnostics-instant', 'monitors-phrase.png')
    await page.screenshot({ path: monitorsShot })
    console.log('Screenshot:', monitorsShot)
  })
})
