import { test, expect, _electron as electron, ElectronApplication } from '@playwright/test'
import { phraseToPlainText } from '../../src/core/lib/phrase/phrasePlainText'
import {
  CAPTURED_PHRASE_FIXTURE_PATH,
  ensureCapturedPhraseFixture
} from './helpers/captureLivePhrase'
import { e2eScreenshotPath } from './helpers/screenshotPaths'
import { validateScreenshotImage } from './helpers/validateScreenshot'
import { getSettingsPage, expectWallpaperLayout, waitForWallpaperWindow } from './helpers/electronSettingsPage'
import { e2eElectronLaunchOptions } from './helpers/e2eLaunch'
import { selectLayoutStyle } from './helpers/styleSettings'
import { completeSetupWizardIfNeeded, waitForSettingsReady } from './helpers/settingsFlow'

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
    await waitForSettingsReady(page)
    await completeSetupWizardIfNeeded(page)

    const wallpaper = await waitForWallpaperWindow(electronApp)
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
    await waitForSettingsReady(page)
    await completeSetupWizardIfNeeded(page)
    await selectLayoutStyle(page, 'split-spread')
    await page.locator('button:has-text("Refresh Now")').click()
    await page.waitForTimeout(3500)

    const wallpaper = await expectWallpaperLayout(electronApp, 'layout-split-spread')
    const combined = phraseToPlainText(await wallpaper.evaluate(() => document.body.innerText)).toLowerCase()
    const anchorWords = fixturePlain.split(/\s+/).filter((w) => w.replace(/[^\w]/g, '').length > 4)
    expect(anchorWords.some((w) => combined.includes(w.replace(/[^\w]/g, '')))).toBe(true)

    const shot = e2eScreenshotPath('magazine-layouts-live-phrase-split-spread', 'wallpaper.png')
    await wallpaper.screenshot({ path: shot })
    await validateScreenshotImage(shot, 'live split-spread')
    console.log('Screenshot:', shot)
  })

  test('tabloid-stack with live phrase', async () => {
    test.setTimeout(60_000)
    const page = await getSettingsPage(electronApp)
    await selectLayoutStyle(page, 'tabloid-stack')

    const wallpaper = await expectWallpaperLayout(electronApp, 'layout-tabloid-stack')

    const shot = e2eScreenshotPath('magazine-layouts-live-phrase-tabloid-stack', 'wallpaper.png')
    await wallpaper.screenshot({ path: shot })
    await validateScreenshotImage(shot, 'live tabloid-stack')
    console.log('Screenshot:', shot)
  })

  test('pull-quote with live phrase', async () => {
    test.setTimeout(60_000)
    const page = await getSettingsPage(electronApp)
    await selectLayoutStyle(page, 'pull-quote')

    const wallpaper = await expectWallpaperLayout(electronApp, 'layout-pull-quote')

    const shot = e2eScreenshotPath('magazine-layouts-live-phrase-pull-quote', 'wallpaper.png')
    await wallpaper.screenshot({ path: shot })
    await validateScreenshotImage(shot, 'live pull-quote')
    console.log('Screenshot:', shot)
  })
})
