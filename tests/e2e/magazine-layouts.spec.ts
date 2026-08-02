import { test, expect, _electron as electron, ElectronApplication } from '@playwright/test'
import { e2eScreenshotPath } from './helpers/screenshotPaths'
import { validateScreenshotImage } from './helpers/validateScreenshot'
import { getSettingsPage, getWallpaperWindow } from './helpers/electronSettingsPage'
import { e2eElectronLaunchOptions } from './helpers/e2eLaunch'

const STUB_PHRASE = 'stubbed surreal phrase'

test.describe.serial('Magazine layout styles E2E', () => {
  let electronApp: ElectronApplication

  test.beforeAll(async () => {
    electronApp = await electron.launch(e2eElectronLaunchOptions())
  })

  test.afterAll(async () => {
    await electronApp.close()
  })

  test('prepare dashboard with stub phrase on wallpaper', async () => {
    test.setTimeout(60_000)
    const page = await getSettingsPage(electronApp)
    await page.waitForLoadState('load')
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15_000 }).catch(() => {})

    const wizard = page.locator('text=First-time Setup Wizard')
    if (await wizard.isVisible().catch(() => false)) {
      await page.locator('input[type="password"]').fill('test-api-key')
      await page.locator('button:has-text("Start Murmur")').click()
      await page.locator('aside').waitFor({ state: 'visible', timeout: 10_000 })
    }

    await page.locator('button:has-text("Refresh Now")').click()
    await page.waitForTimeout(3000)

    const wallpaper = getWallpaperWindow(electronApp)
    const text = await wallpaper.evaluate(() => document.body.innerText.toLowerCase())
    expect(text).toContain('stubbed')
  })

  test('split-spread layout: DOM structure, text split, screenshot', async () => {
    test.setTimeout(60_000)
    const page = await getSettingsPage(electronApp)
    await page.locator('button:has-text("Style")').click()
    await page.waitForTimeout(400)

    await page.locator('select').nth(4).selectOption('split-spread')
    await page.waitForTimeout(2000)

    const wallpaper = getWallpaperWindow(electronApp)
    await expect(wallpaper.getByTestId('layout-split-spread')).toBeVisible()
    await expect(wallpaper.getByTestId('layout-split-spread-left')).toBeVisible()
    await expect(wallpaper.getByTestId('layout-split-spread-right')).toBeVisible()

    const splitCheck = await wallpaper.evaluate(() => {
      const left = document.querySelector('[data-testid="layout-split-spread-left"]')?.textContent?.trim() || ''
      const right = document.querySelector('[data-testid="layout-split-spread-right"]')?.textContent?.trim() || ''
      const leftAlign = window.getComputedStyle(document.querySelector('[data-testid="layout-split-spread-left"]')!).textAlign
      const rightAlign = window.getComputedStyle(document.querySelector('[data-testid="layout-split-spread-right"]')!).textAlign
      return { left, right, leftAlign, rightAlign, combined: `${left} ${right}`.replace(/\s+/g, ' ').trim() }
    })

    expect(splitCheck.left.length).toBeGreaterThan(0)
    expect(splitCheck.right.length).toBeGreaterThan(0)
    expect(splitCheck.combined.toLowerCase()).toContain(STUB_PHRASE)
    expect(splitCheck.leftAlign).toBe('left')
    expect(splitCheck.rightAlign).toBe('right')
    expect(splitCheck.left.toLowerCase()).toContain('stubbed')
    expect(splitCheck.right.toLowerCase()).toMatch(/surreal|phrase/)

    const shot = e2eScreenshotPath('magazine-layouts-split-spread', 'wallpaper.png')
    await wallpaper.screenshot({ path: shot })
    await validateScreenshotImage(shot, 'split-spread')
    console.log('Screenshot:', shot)
  })

  test('tabloid-stack layout: headline + deck, screenshot', async () => {
    test.setTimeout(60_000)
    const page = await getSettingsPage(electronApp)
    await page.locator('button:has-text("Style")').click()
    await page.waitForTimeout(400)

    await page.locator('select').nth(4).selectOption('tabloid-stack')
    await page.waitForTimeout(2000)

    const wallpaper = getWallpaperWindow(electronApp)
    await expect(wallpaper.getByTestId('layout-tabloid-stack')).toBeVisible()
    await expect(wallpaper.getByTestId('layout-tabloid-headline')).toBeVisible()
    await expect(wallpaper.getByTestId('layout-tabloid-deck')).toBeVisible()

    const tabloid = await wallpaper.evaluate(() => {
      const headline = document.querySelector('[data-testid="layout-tabloid-headline"]') as HTMLElement
      const deck = document.querySelector('[data-testid="layout-tabloid-deck"]') as HTMLElement
      const headlineSize = parseFloat(window.getComputedStyle(headline).fontSize)
      const deckSize = parseFloat(window.getComputedStyle(deck).fontSize)
      return {
        headline: headline.textContent?.trim() || '',
        deck: deck.textContent?.trim() || '',
        headlineSize,
        deckSize
      }
    })

    expect(tabloid.headline.length).toBeGreaterThan(0)
    expect(tabloid.deck.length).toBeGreaterThan(0)
    expect(tabloid.headlineSize).toBeGreaterThan(tabloid.deckSize)
    expect((tabloid.headline + ' ' + tabloid.deck).toLowerCase()).toMatch(/stubbed/)

    const shot = e2eScreenshotPath('magazine-layouts-tabloid-stack', 'wallpaper.png')
    await wallpaper.screenshot({ path: shot })
    await validateScreenshotImage(shot, 'tabloid-stack')
    console.log('Screenshot:', shot)
  })

  test('pull-quote layout: blockquote rule, screenshot', async () => {
    test.setTimeout(60_000)
    const page = await getSettingsPage(electronApp)
    await page.locator('button:has-text("Style")').click()
    await page.waitForTimeout(400)

    await page.locator('select').nth(4).selectOption('pull-quote')
    await page.waitForTimeout(2000)

    const wallpaper = getWallpaperWindow(electronApp)
    await expect(wallpaper.getByTestId('layout-pull-quote')).toBeVisible()

    const quote = await wallpaper.evaluate(() => {
      const el = document.querySelector('[data-testid="layout-pull-quote"]') as HTMLElement
      const style = window.getComputedStyle(el)
      return {
        text: el.textContent?.trim() || '',
        borderLeftWidth: style.borderLeftWidth,
        paddingLeft: style.paddingLeft,
        fontSize: parseFloat(style.fontSize)
      }
    })

    expect(quote.text.toLowerCase()).toContain(STUB_PHRASE)
    expect(parseFloat(quote.borderLeftWidth)).toBeGreaterThan(0)
    expect(parseFloat(quote.paddingLeft)).toBeGreaterThan(10)
    expect(quote.fontSize).toBeGreaterThan(16)

    const shot = e2eScreenshotPath('magazine-layouts-pull-quote', 'wallpaper.png')
    await wallpaper.screenshot({ path: shot })
    await validateScreenshotImage(shot, 'pull-quote')
    console.log('Screenshot:', shot)
  })
})
