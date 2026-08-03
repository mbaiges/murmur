import { readFileSync } from 'fs'
import { join } from 'path'
import { test, expect, _electron as electron, ElectronApplication } from '@playwright/test'
import { e2eScreenshotPath } from './helpers/screenshotPaths'
import { validateScreenshotImage } from './helpers/validateScreenshot'
import { getSettingsPage, getWallpaperWindow } from './helpers/electronSettingsPage'
import { e2eSemanticsDemoLaunchOptions } from './helpers/e2eLaunch'
import { selectLayoutStyle } from './helpers/styleSettings'
import { completeSetupWizardIfNeeded, waitForSettingsReady } from './helpers/settingsFlow'
import { splitPlainPhraseHeadlineDeck } from '../../src/core/lib/phrase/phraseLayoutSplit'
import { phraseToPlainText } from '../../src/core/lib/phrase/phrasePlainText'

const CASE = 'structured-layout-semantics'
const FIXTURE_PATH = join(process.cwd(), 'tests/e2e/fixtures/structured-semantics-demo.json')

interface SemanticsFixture {
  fullPhraseIfLegacy: string
  layouts: {
    'split-spread': { left: string; right: string }
    'tabloid-stack': { headline: string; deck: string; kicker?: string }
    'pull-quote': { quote: string; attribution?: string }
    centered: { phrase: string }
  }
}

function loadFixture(): SemanticsFixture {
  return JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as SemanticsFixture
}

/** Legacy split-spread used ~half the words of one flat string (see phraseLayoutSplit). */
function legacyWordMidpointHalves(phrase: string): { left: string; right: string } {
  const words = phrase.trim().split(/\s+/)
  const splitAt = Math.max(1, Math.ceil(words.length / 2))
  return {
    left: words.slice(0, splitAt).join(' '),
    right: words.slice(splitAt).join(' ')
  }
}

async function completeWizardIfNeeded(page: Awaited<ReturnType<typeof getSettingsPage>>) {
  const wizard = page.locator('text=First-time Setup Wizard')
  if (await wizard.isVisible().catch(() => false)) {
    await page.locator('input[type="password"]').fill('test-api-key')
    await page.locator('button:has-text("Start Murmur")').click()
    await page.locator('aside').waitFor({ state: 'visible', timeout: 10_000 })
  }
}

async function selectLayout(page: Awaited<ReturnType<typeof getSettingsPage>>, layout: string) {
  await selectLayoutStyle(page, layout)
}

test.describe.serial('Structured layout semantics vs legacy heuristics', () => {
  let electronApp: ElectronApplication
  const fixture = loadFixture()

  test.beforeAll(async () => {
    electronApp = await electron.launch(e2eSemanticsDemoLaunchOptions())
  })

  test.afterAll(async () => {
    await electronApp.close()
  })

  test('01 — refresh with structured demo payload', async () => {
    test.setTimeout(60_000)
    const page = await getSettingsPage(electronApp)
    await page.waitForLoadState('load')
    await completeWizardIfNeeded(page)
    await page.locator('button:has-text("Refresh Now")').click()
    await page.waitForTimeout(2500)

    const wallpaper = getWallpaperWindow(electronApp)
    const shot = e2eScreenshotPath(CASE, '01-centered-structured-phrase.png')
    await wallpaper.screenshot({ path: shot })
    await validateScreenshotImage(shot, 'centered-structured')
    console.log('Screenshot:', shot)

    const text = await wallpaper.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim())
    expect(text.toLowerCase()).toContain('early bird')
    expect(text.toLowerCase()).toContain('worm')
  })

  test('02 — split-spread: clause halves (not word midpoint)', async () => {
    test.setTimeout(60_000)
    const page = await getSettingsPage(electronApp)
    await selectLayout(page, 'split-spread')

    const expected = fixture.layouts['split-spread']
    const legacy = legacyWordMidpointHalves(fixture.fullPhraseIfLegacy)

    const wallpaper = getWallpaperWindow(electronApp)
    const dom = await wallpaper.evaluate(() => {
      const left = document.querySelector('[data-testid="layout-split-spread-left"]')?.textContent?.trim() || ''
      const right = document.querySelector('[data-testid="layout-split-spread-right"]')?.textContent?.trim() || ''
      return { left, right }
    })

    expect(dom.left).toBe(expected.left)
    expect(dom.right).toBe(expected.right)
    expect(dom.left).not.toBe(legacy.left)
    expect(dom.left).not.toContain(' but')

    const shot = e2eScreenshotPath(CASE, '02-split-spread-semantic-halves.png')
    await wallpaper.screenshot({ path: shot })
    await validateScreenshotImage(shot, 'split-spread-semantic')
    console.log('Screenshot:', shot)
    console.log('[semantics] structured left:', expected.left)
    console.log('[semantics] legacy midpoint left would be:', legacy.left)
  })

  test('03 — tabloid: headline + deck fields (not 45% word cut)', async () => {
    test.setTimeout(60_000)
    const page = await getSettingsPage(electronApp)
    await selectLayout(page, 'tabloid-stack')

    const expected = fixture.layouts['tabloid-stack']
    const legacy = splitPlainPhraseHeadlineDeck(fixture.fullPhraseIfLegacy)

    const wallpaper = getWallpaperWindow(electronApp)
    const dom = await wallpaper.evaluate(() => {
      const headline = document.querySelector('[data-testid="layout-tabloid-headline"]')?.textContent?.trim() || ''
      const deck = document.querySelector('[data-testid="layout-tabloid-deck"]')?.textContent?.trim() || ''
      const kicker = document.querySelector('[data-testid="layout-tabloid-stack"]')?.textContent || ''
      return { headline, deck, hasKicker: kicker.includes('Surreal Dispatch') }
    })

    expect(dom.headline.toUpperCase()).toContain('WORM CATCHES BACK')
    expect(dom.deck).toContain('early bird')
    expect(dom.headline).not.toBe(legacy.headline)
    expect(expected.kicker).toBeTruthy()
    expect(dom.hasKicker).toBe(true)

    const shot = e2eScreenshotPath(CASE, '03-tabloid-structured-headline-deck.png')
    await wallpaper.screenshot({ path: shot })
    await validateScreenshotImage(shot, 'tabloid-semantic')
    console.log('Screenshot:', shot)
    console.log('[semantics] structured headline:', expected.headline)
    console.log('[semantics] legacy heuristic headline:', legacy.headline)
  })

  test('04 — pull-quote: quote field + markdown emphasis', async () => {
    test.setTimeout(60_000)
    const page = await getSettingsPage(electronApp)
    await selectLayout(page, 'pull-quote')

    const expected = fixture.layouts['pull-quote']
    const wallpaper = getWallpaperWindow(electronApp)

    const dom = await wallpaper.evaluate(() => {
      const block = document.querySelector('[data-testid="layout-pull-quote"]') as HTMLElement | null
      if (!block) {
        return { text: '' }
      }
      return { text: block.innerText.replace(/\s+/g, ' ').trim() }
    })

    expect(dom.text.toLowerCase()).toContain(phraseToPlainText('early bird').toLowerCase())
    expect(dom.text).toContain('Murmur Semantics Demo')
    expect(phraseToPlainText(expected.quote).toLowerCase()).toContain('early bird')

    const shot = e2eScreenshotPath(CASE, '04-pull-quote-structured-markdown.png')
    await wallpaper.screenshot({ path: shot })
    await validateScreenshotImage(shot, 'pull-quote-semantic')
    console.log('Screenshot:', shot)
  })

  test('05 — history raw JSON shows structured fields', async () => {
    test.setTimeout(60_000)
    const page = await getSettingsPage(electronApp)
    await waitForSettingsReady(page)
    await completeSetupWizardIfNeeded(page)
    await selectLayoutStyle(page, 'pull-quote')
    await page.locator('button:has-text("Refresh Now")').click()
    await page.waitForTimeout(2500)

    await page.locator('button:has-text("History")').click()
    await page.waitForTimeout(800)
    await page.getByRole('button', { name: 'Raw JSON' }).click()
    await page.waitForTimeout(300)

    const allRaw = await page.locator('pre').allTextContents()
    const combined = allRaw.join('\n')
    expect(combined).toMatch(/"(left|headline|quote|deck)"/)

    const shot = e2eScreenshotPath(CASE, '05-history-raw-structured-json.png')
    await page.screenshot({ path: shot })
    console.log('Screenshot:', shot)
  })
})
