import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { completeSetupWizardIfNeeded, openSettingsTab, waitForSettingsReady } from './settingsFlow'

export async function goToStyleTab(page: Page): Promise<void> {
  await page.bringToFront()
  await waitForSettingsReady(page)
  await completeSetupWizardIfNeeded(page)
  await openSettingsTab(page, 'Style')
  await expect(page.getByTestId('style-section-phrase')).toBeVisible({ timeout: 10_000 })
}

/**
 * Commits pending Style/Voice draft. Fails fast if `required` and the apply bar never appears.
 */
export async function applySettingsChanges(page: Page, options?: { required?: boolean }): Promise<void> {
  const bar = page.getByTestId('settings-apply-bar')
  const visible = await bar.isVisible().catch(() => false)
  if (!visible) {
    if (options?.required) {
      throw new Error('Expected settings apply bar (pending draft) but it was not visible')
    }
    return
  }
  await page.getByTestId('settings-apply-changes').click()
  await expect(bar).toBeHidden({ timeout: 20_000 })
}

export async function selectLayoutStyle(page: Page, layoutValue: string): Promise<void> {
  await goToStyleTab(page)
  const layoutSelect = page.getByTestId('style-layout-select')
  await expect(layoutSelect).toBeVisible({ timeout: 10_000 })
  const before = await layoutSelect.inputValue()
  await layoutSelect.selectOption(layoutValue)
  if (before !== layoutValue) {
    await applySettingsChanges(page, { required: true })
  }
  await expect(layoutSelect).toHaveValue(layoutValue)
}

export async function selectAnimationChip(page: Page, label: string): Promise<void> {
  await goToStyleTab(page)
  const phrase = page.getByTestId('style-section-phrase')
  const chip = phrase
    .getByRole('group', { name: 'Transition animation' })
    .getByRole('button', { name: label, exact: true })
  await expect(chip).toBeVisible({ timeout: 10_000 })
  await chip.click()
  await applySettingsChanges(page, { required: true })
}

export async function expectAnimationChip(page: Page, label: string): Promise<void> {
  await goToStyleTab(page)
  const phrase = page.getByTestId('style-section-phrase')
  const chip = phrase
    .getByRole('group', { name: 'Transition animation' })
    .getByRole('button', { name: label, exact: true })
  await expect(chip).toHaveClass(/border-indigo-500/)
}

export async function expectLayoutStyle(page: Page, value: string): Promise<void> {
  await goToStyleTab(page)
  await expect(page.getByTestId('style-layout-select')).toHaveValue(value)
}

export async function expectThemeSwatch(page: Page, themeLabel: string): Promise<void> {
  const bg = page.getByTestId('style-section-background')
  const btn = bg.getByRole('button', { name: themeLabel })
  await expect(btn).toHaveClass(/border-indigo-500/)
}

export async function expectFontFamily(page: Page, font: string): Promise<void> {
  await goToStyleTab(page)
  const phrase = page.getByTestId('style-section-phrase')
  await expect(phrase.locator('select').first()).toHaveValue(font)
}

export async function clickMoodCard(page: Page, moodTestId: string, apply = true): Promise<void> {
  await goToStyleTab(page)
  const card = page.getByTestId(moodTestId)
  await expect(card).toBeVisible({ timeout: 10_000 })
  await card.click()
  if (apply) {
    await applySettingsChanges(page, { required: true })
  }
}

/** First monitor profile (post per-monitor config). */
export function primaryMonitorProfile(config: {
  monitors?: { profile: Record<string, unknown> }[]
  [key: string]: unknown
}): Record<string, unknown> {
  const profile = config.monitors?.[0]?.profile
  if (profile) return profile
  return config
}
