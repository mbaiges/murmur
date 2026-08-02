import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { _electron as electron, ElectronApplication } from '@playwright/test'
import { getSettingsPage } from './electronSettingsPage'

export const CAPTURED_PHRASE_FIXTURE_PATH = join(
  process.cwd(),
  'tests/e2e/fixtures/captured-phrase.json'
)

export interface CapturedPhraseFixture {
  phrase: string
  capturedAt: string
  source: 'live-refresh'
}

export function readCapturedPhraseFixture(): CapturedPhraseFixture | null {
  if (!existsSync(CAPTURED_PHRASE_FIXTURE_PATH)) {
    return null
  }
  try {
    return JSON.parse(readFileSync(CAPTURED_PHRASE_FIXTURE_PATH, 'utf8')) as CapturedPhraseFixture
  } catch {
    return null
  }
}

export function writeCapturedPhraseFixture(phrase: string): CapturedPhraseFixture {
  mkdirSync(join(process.cwd(), 'tests/e2e/fixtures'), { recursive: true })
  const payload: CapturedPhraseFixture = {
    phrase,
    capturedAt: new Date().toISOString(),
    source: 'live-refresh'
  }
  writeFileSync(CAPTURED_PHRASE_FIXTURE_PATH, JSON.stringify(payload, null, 2), 'utf8')
  return payload
}

/**
 * Launches the real app (no E2E stubs), runs one Refresh Now, returns the first monitor phrase.
 * Uses your saved config, feeds, and Gemini key — exactly one generation call.
 */
export async function captureLivePhraseOnce(): Promise<string> {
  const env = { ...process.env }
  delete env.MURMUR_E2E
  delete env.MURMUR_E2E_REUSE_CAPTURED_PHRASE
  delete env.MURMUR_E2E_FIXTURE_PHRASE_PATH
  delete env.ELECTRON_RUN_AS_NODE

  let electronApp: ElectronApplication | null = null
  try {
    electronApp = await electron.launch({ args: ['.'], env })
    const page = await getSettingsPage(electronApp)
    await page.waitForLoadState('load')
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 20_000 }).catch(() => {})

    if (await page.locator('text=First-time Setup Wizard').isVisible().catch(() => false)) {
      throw new Error('No Gemini API key in user config — complete setup wizard first.')
    }

    await page.locator('button:has-text("Refresh Now")').click()
    await page.waitForTimeout(45_000)

    const state = await page.evaluate(async () => {
      const api = (window as any).api
      return api.getState()
    })

    const phrases = Object.values(state.lastPhrases || {}) as string[]
    const phrase = phrases.find((p) => p && p.trim().length > 10)
    if (!phrase) {
      throw new Error('Refresh finished but no phrase in state — check API key, feeds, and network.')
    }

    console.log('[capture] phrase length:', phrase.length)
    console.log('[capture] preview:', phrase.slice(0, 120).replace(/\n/g, ' '))

    return phrase
  } finally {
    if (electronApp) {
      await electronApp.close()
    }
  }
}

export async function ensureCapturedPhraseFixture(): Promise<CapturedPhraseFixture> {
  const existing = readCapturedPhraseFixture()
  if (existing?.phrase?.trim() && process.env.MURMUR_RECAPTURE_PHRASE !== '1') {
    console.log('[capture] Reusing fixture from', CAPTURED_PHRASE_FIXTURE_PATH)
    return existing
  }

  console.log('[capture] Running one live Refresh Now against your config/feeds…')
  const phrase = await captureLivePhraseOnce()
  return writeCapturedPhraseFixture(phrase)
}
