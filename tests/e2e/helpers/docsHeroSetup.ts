import { existsSync, readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import type { ElectronApplication, Page } from '@playwright/test'
import { applySettingsChanges } from './styleSettings'
import { getWallpaperWindow } from './electronSettingsPage'

export const DOCS_HERO_SCREENSHOT = join(process.cwd(), 'assets', 'screenshots', 'hero-wallpaper.png')

/** Env var first; on macOS dev machines, fall back to the user's Murmur config (never logged). */
export function resolveGeminiKeyForDocsHero(): string | null {
  const fromEnv = process.env.GEMINI_API_KEY?.trim()
  if (fromEnv) return fromEnv
  if (process.platform !== 'darwin') return null
  const configPath = join(homedir(), 'Library/Application Support/Murmur/murmur.config.json')
  if (!existsSync(configPath)) return null
  try {
    const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as { geminiApiKey?: string }
    const key = parsed.geminiApiKey?.trim()
    return key || null
  } catch {
    return null
  }
}

const WIDGET_KEYS = ['dateTime', 'sourceCredit', 'inspiringHeadlines'] as const

export async function enableAllWallpaperWidgets(page: Page): Promise<void> {
  const section = page.getByTestId('style-section-widgets')
  await section.scrollIntoViewIfNeeded()
  for (const key of WIDGET_KEYS) {
    const chip = page.getByTestId(`widget-chip-${key}`)
    if ((await chip.getAttribute('aria-pressed')) !== 'true') {
      await chip.click()
    }
  }
}

/** Zen Study look + all overlay widgets for README hero. */
export async function applyDocsHeroStyle(page: Page): Promise<void> {
  await page.locator('button:has-text("Style")').click()
  await page.waitForTimeout(400)
  await page.locator('main').evaluate((el) => {
    el.scrollTop = 0
  })

  const zenCard = page.getByTestId('mood-card-zen-study')
  if (await zenCard.isVisible()) {
    await zenCard.click()
    await page.waitForTimeout(300)
  }

  await enableAllWallpaperWidgets(page)
  await applySettingsChanges(page, { required: true })
  await page.waitForTimeout(400)
}

/** Absurd proverb voice in English (live Gemini). */
export async function applyDocsHeroVoiceEnglish(page: Page): Promise<void> {
  await page.locator('button:has-text("Voice & prompts")').click()
  await page.waitForTimeout(400)

  await page.getByRole('button', { name: 'None', exact: true }).click()

  const preset = page.locator('label:has-text("Preset")').locator('..').locator('select')
  await preset.selectOption('Absurd Proverb')

  await page
    .locator('label:has-text("Output language")')
    .locator('..')
    .locator('select')
    .selectOption('English')

  await applySettingsChanges(page, { required: true })
  await page.waitForTimeout(400)
}

export async function waitForLivePhrase(page: Page, timeoutMs = 120_000): Promise<string> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const state = await page.evaluate(async () => {
      const api = (window as { api?: { getState: () => Promise<{ lastPhrases?: Record<string, string> }> } })
        .api
      return api?.getState()
    })
    const phrases = Object.values(state?.lastPhrases || {}) as string[]
    const phrase = phrases.find((p) => p && p.trim().length > 10)
    if (phrase && !/stubbed surreal phrase/i.test(phrase)) {
      return phrase
    }
    await page.waitForTimeout(750)
  }
  throw new Error('Timed out waiting for live Gemini phrase on wallpaper')
}

export async function captureDocsHeroScreenshot(electronApp: ElectronApplication): Promise<void> {
  const wallpaperWin = getWallpaperWindow(electronApp)
  await wallpaperWin.waitForTimeout(800)
  await wallpaperWin.screenshot({ path: DOCS_HERO_SCREENSHOT })
}
