import { test, expect, _electron as electron, ElectronApplication } from '@playwright/test'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

let electronApp: ElectronApplication

test.beforeAll(async () => {
  electronApp = await electron.launch({
    args: ['.'],
    env: { ...process.env, MURMUR_E2E: 'true' }
  })
})

test.afterAll(async () => {
  await electronApp.close()
})

test('AI System Prompt Presets and Custom Apply flow', async () => {
  test.setTimeout(60000)

  // Wait for settings window to be active
  let page = await electronApp.firstWindow()
  
  for (let attempt = 0; attempt < 25; attempt++) {
    const windows = electronApp.windows()
    let found = false
    for (const win of windows) {
      const url = win.url()
      if (url && !url.includes('view=wallpaper')) {
        page = win
        found = true
        break
      }
    }
    if (found) break
    await page.waitForTimeout(200)
  }

  await page.waitForLoadState('load')

  // Wait for loading spinner to detach
  await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 })

  const screenshotsDir = 'tests/e2e/artifacts/screenshots'
  if (!existsSync(screenshotsDir)) {
    mkdirSync(screenshotsDir, { recursive: true })
  }

  // Wait for either the Wizard header or the Dashboard sidebar to appear
  const wizardHeader = page.locator('text=First-time Setup Wizard')
  const sidebar = page.locator('aside')
  
  await Promise.race([
    wizardHeader.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
    sidebar.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
  ])

  const isWizard = await wizardHeader.isVisible()
  if (isWizard) {
    await page.locator('input[type="password"]').fill('test-api-key')
    await page.locator('button:has-text("Start Murmur")').click()
    await sidebar.waitFor({ state: 'visible', timeout: 10000 })
  }

  // 1. Navigate to Ingestion & Feeds (which contains the Prompt template)
  await expect(sidebar).toBeVisible()

  await page.locator('button:has-text("Ingestion & Feeds")').click()
  await page.waitForTimeout(500)

  // Verify dropdown has presets and Custom option
  const dropdown = page.locator('select').first() // The first select is the Preset selector
  await expect(dropdown).toBeVisible()

  const textarea = page.locator('textarea')

  // 2. Select and verify newly added presets
  await dropdown.selectOption('Cyberpunk Terminal')
  await page.waitForTimeout(1000)
  const cyberpunkPrompt = await textarea.inputValue()
  expect(cyberpunkPrompt).toContain('You are a rogue cyberpunk terminal')

  await dropdown.selectOption('Zen Koan')
  await page.waitForTimeout(1000)
  const zenPrompt = await textarea.inputValue()
  expect(zenPrompt).toContain('You are a Zen master')

  await dropdown.selectOption('Existential Dread')
  await page.waitForTimeout(1000)
  const dreadPrompt = await textarea.inputValue()
  expect(dreadPrompt).toContain('You are a melancholic, existential machine')

  // Select "Worst News Title" preset
  await dropdown.selectOption('Worst News Title')
  await page.waitForTimeout(1500)

  // Verify textarea value has updated to the Worst News Title prompt
  const worstPromptVal = await textarea.inputValue()
  expect(worstPromptVal).toContain('You are a satirical copywriter')

  // Verify the Apply button is NOT visible (presets apply instantly)
  const applyBtn = page.locator('button:has-text("Apply")')
  await expect(applyBtn).not.toBeVisible()

  // 3. Edit prompt to become Custom
  const customText = `This is a custom test prompt guidelines ${Date.now()}.`
  await textarea.fill(customText)
  await page.waitForTimeout(500)
  
  // Verify dropdown changes to "Custom" automatically
  const dropdownVal = await dropdown.inputValue()
  expect(dropdownVal).toBe('Custom')

  // Verify the Apply button is now visible
  await expect(applyBtn).toBeVisible()

  // 4. Click Apply and verify animated transition/feedback
  await applyBtn.click()

  // Wait for success indicator
  await expect(page.locator('button:has-text("Applied!")')).toBeVisible()
  
  // Take a screenshot of the applied state
  await page.screenshot({ path: join(screenshotsDir, '07_applied_custom_prompt.png') })
  console.log('Took screenshot: 07_applied_custom_prompt.png')

  // Wait for success checkmark to fade out
  await page.waitForTimeout(2000)
  
  // The apply button should disappear since the prompt matches the saved config
  await expect(applyBtn).not.toBeVisible()
})
