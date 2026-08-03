import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/** Settings shell sidebar (not wallpaper layout `<aside>` nodes). */
export function settingsSidebar(page: Page) {
  return page.locator('aside').filter({ has: page.getByRole('button', { name: 'General' }) })
}

/** Settings shell ready: not loading, sidebar or wizard resolved. */
export async function waitForSettingsReady(page: Page): Promise<void> {
  await page.waitForLoadState('load')
  await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 20_000 }).catch(() => {})
}

export async function completeSetupWizardIfNeeded(page: Page): Promise<void> {
  const wizard = page.locator('text=First-time Setup Wizard')
  if (await wizard.isVisible().catch(() => false)) {
    await page.locator('input[type="password"]').fill('test-api-key')
    await page.locator('button:has-text("Start Murmur")').click()
    await settingsSidebar(page).waitFor({ state: 'visible', timeout: 15_000 })
  }
  await expect(settingsSidebar(page)).toBeVisible({ timeout: 15_000 })
}

export async function openSettingsTab(page: Page, tabLabel: string): Promise<void> {
  const tab = settingsSidebar(page).getByRole('button', { name: tabLabel })
  await expect(tab).toBeVisible({ timeout: 10_000 })
  await tab.click()
}
