import { test, expect, _electron as electron, ElectronApplication } from '@playwright/test'
import { phraseToPlainText } from '../../src/core/lib/phrase/phrasePlainText'
import {
  CAPTURED_PHRASE_FIXTURE_PATH,
  ensureCapturedPhraseFixture
} from './helpers/captureLivePhrase'
import { e2eScreenshotPath } from './helpers/screenshotPaths'
import { validateScreenshotImage } from './helpers/validateScreenshot'
import { getSettingsPage, getWallpaperWindow } from './helpers/electronSettingsPage'
import { e2eElectronLaunchOptions } from './helpers/e2eLaunch'

test.describe.serial('Magazine layouts with one live-captured phrase', () => {
  let electronApp: ElectronApplication
  let fixturePlain = ''

  test.beforeAll(async () => {
    test.setTimeout(120_000)
    const fixture = await ensureCapturedPhraseFixture()
    fixturePlain = phraseToPlainText(fixture.phrase).toLowerCase()
    expect(fixturePlain.length, 'captured phrase should be non-empty').toBeGreaterThan(15)
    console.log('[live-phrase layouts] Using fixture:', CAPTURED_PHRASE_FIXTURE_PATH)
    console.log('[live-phrase layouts] Preview:', fixturePlain.slice(0, 100))
  })

  test.beforeAll(async () => {
    const base = e2eElectronLaunchOptions()
    electronApp = await electron.launch({
      ...base,
      env: {
        ...base.env,
        MURMUR_E2E_REUSE_CAPTURED_PHRASE: 'true',
        MURMUR_E2E_FIXTURE_PHRASE_PATH: CAPTURED_PHRASE_FIXTURE_PATH
      }
    })
  })

  test.afterAll(async () => {
    await electronApp.close()
  })

  test('hydrate wallpaper with fixture phrase (one stub refresh at startup)', async () => {
    test.setTimeout(90_000)
    const page = await getSettingsPage(electronApp)
    await page.waitForLoadState('load')
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15_000 }).catch(() => {})

    if (await page.locator('text=First-time Setup Wizard').isVisible().catch(() => false)) {
      await page.locator('input[type="password"]').fill('test-api-key')
      await page.locator('button:has-text("Start Murmur")').click()
      await page.locator('aside').waitFor({ state: 'visible', timeout: 10_000 })
    }

    await page.waitForTimeout(5000)
    const wallpaper = getWallpaperWindow(electronApp)
    const bodyPlain = phraseToPlainText(
      await wallpaper.evaluate(() => document.body.innerText)
    ).toLowerCase()
    expect(bodyPlain).not.toContain('stubbed surreal phrase')
    expect(bodyPlain.length).toBeGreaterThan(20)
    const firstWord = fixturePlain.split(/\s+/)[0]
    if (firstWord.length > 3) {
      expect(bodyPlain).toContain(firstWord)
    }
  })

  test('split-spread with live phrase', async () => {
    test.setTimeout(60_000)
    const page = await getSettingsPage(electronApp)
    await page.locator('button:has-text("Style")').click()
    await page.waitForTimeout(400)
    await page.locator('select').nth(4).selectOption('split-spread')
    await page.waitForTimeout(2000)

    const wallpaper = getWallpaperWindow(electronApp)
    const combined = phraseToPlainText(
      await wallpaper.evaluate(() => document.body.innerText)
    ).toLowerCase()
    expect(combined.replace(/\s+/g, ' ')).toContain(fixturePlain.slice(0, 20).split(/\s+/)[0])

    const shot = e2eScreenshotPath('magazine-layouts-live-phrase-split-spread', 'wallpaper.png')
    await wallpaper.screenshot({ path: shot })
    await validateScreenshotImage(shot, 'live split-spread')
    console.log('Screenshot:', shot)
  })

  test('tabloid-stack with live phrase', async () => {
    test.setTimeout(60_000)
    const page = await getSettingsPage(electronApp)
    await page.locator('button:has-text("Style")').click()
    await page.waitForTimeout(400)
    await page.locator('select').nth(4).selectOption('tabloid-stack')
    await page.waitForTimeout(2000)

    const wallpaper = getWallpaperWindow(electronApp)
    await expect(wallpaper.getByTestId('layout-tabloid-headline')).toBeVisible()

    const shot = e2eScreenshotPath('magazine-layouts-live-phrase-tabloid-stack', 'wallpaper.png')
    await wallpaper.screenshot({ path: shot })
    await validateScreenshotImage(shot, 'live tabloid-stack')
    console.log('Screenshot:', shot)
  })

  test('pull-quote with live phrase', async () => {
    test.setTimeout(60_000)
    const page = await getSettingsPage(electronApp)
    await page.locator('button:has-text("Style")').click()
    await page.waitForTimeout(400)
    await page.locator('select').nth(4).selectOption('pull-quote')
    await page.waitForTimeout(2000)

    const wallpaper = getWallpaperWindow(electronApp)
    await expect(wallpaper.getByTestId('layout-pull-quote')).toBeVisible()

    const shot = e2eScreenshotPath('magazine-layouts-live-phrase-pull-quote', 'wallpaper.png')
    await wallpaper.screenshot({ path: shot })
    await validateScreenshotImage(shot, 'live pull-quote')
    console.log('Screenshot:', shot)
  })
})
