import { test, expect, _electron as electron, ElectronApplication } from '@playwright/test'
import { e2eScreenshotPath } from './helpers/screenshotPaths'
import { validateScreenshotImage } from './helpers/validateScreenshot'
import { getSettingsPage, getWallpaperWindow } from './helpers/electronSettingsPage'
import { e2eElectronLaunchOptions } from './helpers/e2eLaunch'
import { selectLayoutStyle } from './helpers/styleSettings'

const CASE = 'magazine-layouts-editorial'

test.describe.serial('Editorial structured layouts (feature opener, sidebar, byline)', () => {
  let electronApp: ElectronApplication

  test.beforeAll(async () => {
    electronApp = await electron.launch(e2eElectronLaunchOptions())
  })

  test.afterAll(async () => {
    await electronApp.close()
  })

  async function prepareWithRefresh() {
    const page = await getSettingsPage(electronApp)
    await page.waitForLoadState('load')
    const wizard = page.locator('text=First-time Setup Wizard')
    if (await wizard.isVisible().catch(() => false)) {
      await page.locator('input[type="password"]').fill('test-api-key')
      await page.locator('button:has-text("Start Murmur")').click()
      await page.locator('aside').waitFor({ state: 'visible', timeout: 10_000 })
    }
    await page.locator('button:has-text("Refresh Now")').click()
    await page.waitForTimeout(2500)
    return page
  }

  async function selectLayout(page: Awaited<ReturnType<typeof getSettingsPage>>, value: string) {
    await selectLayoutStyle(page, value)
    await page.locator('button:has-text("Refresh Now")').click()
    await page.waitForTimeout(2500)
  }

  test('feature-opener: section, headline, deck', async () => {
    test.setTimeout(60_000)
    const page = await prepareWithRefresh()
    await selectLayout(page, 'feature-opener')

    const wallpaper = getWallpaperWindow(electronApp)
    await expect(wallpaper.getByTestId('layout-feature-opener')).toBeVisible()
    await expect(wallpaper.getByTestId('layout-feature-opener-section')).toHaveText(/Feature/i)
    await expect(wallpaper.getByTestId('layout-feature-opener-headline')).toContainText(/STUBBED SURREAL/i)
    await expect(wallpaper.getByTestId('layout-feature-opener-deck')).toContainText(/magazine spread/i)

    const shot = e2eScreenshotPath(CASE, '01-feature-opener.png')
    await wallpaper.screenshot({ path: shot })
    await validateScreenshotImage(shot, 'feature-opener')
    console.log('Screenshot:', shot)
  })

  test('sidebar-rail: main column and margin sidebar', async () => {
    test.setTimeout(60_000)
    const page = await getSettingsPage(electronApp)
    await selectLayout(page, 'sidebar-rail')

    const wallpaper = getWallpaperWindow(electronApp)
    await expect(wallpaper.getByTestId('layout-sidebar-rail')).toBeVisible()
    const text = await wallpaper.evaluate(() => ({
      main: document.querySelector('[data-testid="layout-sidebar-rail-main"]')?.textContent?.trim() || '',
      sidebar: document.querySelector('[data-testid="layout-sidebar-rail-sidebar"]')?.textContent?.trim() || ''
    }))
    expect(text.main.toLowerCase()).toContain('main column')
    expect(text.sidebar.toLowerCase()).toContain('margin note')

    const shot = e2eScreenshotPath(CASE, '02-sidebar-rail.png')
    await wallpaper.screenshot({ path: shot })
    await validateScreenshotImage(shot, 'sidebar-rail')
    console.log('Screenshot:', shot)
  })

  test('byline-lede: headline, byline, lede', async () => {
    test.setTimeout(60_000)
    const page = await getSettingsPage(electronApp)
    await selectLayout(page, 'byline-lede')

    const wallpaper = getWallpaperWindow(electronApp)
    await expect(wallpaper.getByTestId('layout-byline-lede')).toBeVisible()
    await expect(wallpaper.getByTestId('layout-byline-lede-headline')).toContainText(/Stubbed Surreal/i)
    await expect(wallpaper.getByTestId('layout-byline-lede-byline')).toHaveText(/Murmur Desk/i)
    await expect(wallpaper.getByTestId('layout-byline-lede-lede')).toContainText(/lede carries/i)

    const shot = e2eScreenshotPath(CASE, '03-byline-lede.png')
    await wallpaper.screenshot({ path: shot })
    await validateScreenshotImage(shot, 'byline-lede')
    console.log('Screenshot:', shot)
  })
})
