import { mkdirSync } from 'fs'
import { join } from 'path'
import { test, expect, _electron as electron, ElectronApplication } from '@playwright/test'
import { e2eElectronLaunchOptions } from './helpers/e2eLaunch'
import { applyDocsHeroStyle, captureDocsHeroScreenshot } from './helpers/docsHeroSetup'

const DOCS_SCREENSHOTS_DIR = join(process.cwd(), 'assets', 'screenshots')
/** Match default Settings window (`settings-window.ts`: 900×700). */
const SETTINGS_WINDOW = { width: 900, height: 700 }

function docScreenshot(filename: string): string {
  mkdirSync(DOCS_SCREENSHOTS_DIR, { recursive: true })
  return join(DOCS_SCREENSHOTS_DIR, filename)
}

/** Playwright viewport alone does not resize Electron BrowserWindow — match shipped defaults. */
async function resizeSettingsBrowserWindow(app: ElectronApplication) {
  await app.evaluate(
    ({ BrowserWindow }, size: { width: number; height: number }) => {
      for (const win of BrowserWindow.getAllWindows()) {
        const url = win.webContents.getURL()
        if (url.includes('view=wallpaper')) continue
        win.setSize(size.width, size.height)
      }
    },
    SETTINGS_WINDOW
  )
}

async function shotSettingsChrome(page: import('@playwright/test').Page, filename: string) {
  const shell = page.locator('div.flex.flex-col.h-screen.max-h-screen').first()
  await shell.waitFor({ state: 'visible', timeout: 10_000 })
  await shell.screenshot({ path: docScreenshot(filename) })
}

let electronApp: ElectronApplication

test.describe('README documentation screenshots', () => {
  test.beforeAll(async () => {
    electronApp = await electron.launch(e2eElectronLaunchOptions())
  })

  test.afterAll(async () => {
    await electronApp.close()
  })

  test('capture committed assets under assets/screenshots/', async () => {
    test.setTimeout(120_000)

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

    await resizeSettingsBrowserWindow(electronApp)
    await page.waitForLoadState('load')
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15_000 })
    await page.waitForTimeout(300)

    const wizardHeader = page.locator('text=First-time Setup Wizard')
    const sidebar = page.locator('aside')
    await Promise.race([
      wizardHeader.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {}),
      sidebar.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})
    ])

    if (await wizardHeader.isVisible()) {
      const wizardCard = page.locator('.max-w-md').first()
      await wizardCard.screenshot({ path: docScreenshot('setup-wizard.png') })
      await page.locator('input[type="password"]').fill('test-api-key')
      await page.locator('button:has-text("Start Murmur")').click()
      await sidebar.waitFor({ state: 'visible', timeout: 10_000 })
      await resizeSettingsBrowserWindow(electronApp)
      await page.waitForTimeout(300)
    } else {
      throw new Error('Expected first-run setup wizard for setup-wizard.png (fresh E2E userData)')
    }

    await expect(page.locator('button:has-text("General")')).toBeVisible()
    await shotSettingsChrome(page, 'settings-general.png')

    await page.locator('button:has-text("News sources")').click()
    await page.waitForTimeout(400)
    await shotSettingsChrome(page, 'settings-news.png')

    await page.locator('button:has-text("Voice & prompts")').click()
    await page.waitForTimeout(400)
    await page.getByRole('button', { name: 'Vulgar' }).click()
    await page.locator('label:has-text("Output language")').locator('..').locator('select').selectOption('Argentinian Spanish')
    await page.waitForTimeout(200)
    await shotSettingsChrome(page, 'settings-voice.png')

    await page.locator('button:has-text("Style")').click()
    await page.waitForTimeout(400)
    await page.locator('main').evaluate((el) => {
      el.scrollTop = 0
    })
    await shotSettingsChrome(page, 'settings-style-moods.png')

    await page.locator('button:has-text("History")').click()
    await page.waitForTimeout(400)
    await shotSettingsChrome(page, 'settings-history.png')

    await applyDocsHeroStyle(page)

    await page.locator('button:has-text("Refresh Now")').click()
    await page.waitForTimeout(3000)

    expect(
      electronApp.windows().some((w) => w.url().includes('view=wallpaper')),
      'wallpaper overlay window for hero capture'
    ).toBeTruthy()
    await captureDocsHeroScreenshot(electronApp)
  })
})
