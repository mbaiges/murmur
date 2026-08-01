import { test, expect, _electron as electron, ElectronApplication } from '@playwright/test'
import { e2eScreenshotPath } from './helpers/screenshotPaths'

test.describe.serial('AI System Prompt Presets and Aesthetic Moods E2E Suite', () => {
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
    
    const appliedShot = e2eScreenshotPath('presets-custom-prompt', 'applied-custom-prompt.png')
    await page.screenshot({ path: appliedShot })
    console.log('Screenshot:', appliedShot)

    // Wait for success checkmark to fade out
    await page.waitForTimeout(2000)
    
    // The apply button should disappear since the prompt matches the saved config
    await expect(applyBtn).not.toBeVisible()
  })

  test('Aesthetic Mood Presets (Atmospheres) selector flow', async () => {
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

    const moodCase = 'presets-aesthetic-moods'

    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()

    // 1. Navigate to Aesthetic Moods Tab
    await page.locator('button:has-text("Aesthetic Moods")').click()
    await page.waitForTimeout(500)

    // 2. Activate "Zen Study" mood via the card button using getByTestId
    const zenCard = page.getByTestId('mood-card-zen-study')
    await expect(zenCard).toBeVisible()
    await zenCard.locator('button:has-text("Activate Mood")').click()
    await page.waitForTimeout(1000)

    // Verify that the button changes to "Currently Active"
    await expect(zenCard.locator('button:has-text("Currently Active")')).toBeVisible()

    // Navigate to Appearance tab and verify options updated
    await page.locator('button:has-text("Appearance")').click()
    await page.waitForTimeout(500)

    // Selectors indexes in Appearance tab:
    // select.nth(0): Mood Preset dropdown
    // select.nth(1): Theme dropdown
    // select.nth(2): Font dropdown
    // select.nth(3): Animation dropdown
    const moodSelect = page.locator('select').first()
    expect(await moodSelect.inputValue()).toBe('Zen Study')

    const themeSelect = page.locator('select').nth(1)
    expect(await themeSelect.inputValue()).toBe('Parchment')

    const fontSelect = page.locator('select').nth(2)
    expect(await fontSelect.inputValue()).toBe('EB Garamond')

    const animationSelect = page.locator('select').nth(3)
    expect(await animationSelect.inputValue()).toBe('Fade')

    const layoutSelect = page.locator('select').nth(5)
    expect(await layoutSelect.inputValue()).toBe('book-cover')

    const noiseSelect = page.locator('select').nth(6)
    expect(await noiseSelect.inputValue()).toBe('subtle')

    const vignetteSelect = page.locator('select').nth(7)
    expect(await vignetteSelect.inputValue()).toBe('soft')



    // Take screenshot of Zen Study wallpaper view
    const zenWallpaper = electronApp.windows().find(win => win.url().includes('view=wallpaper'))
    if (zenWallpaper) {
      await page.waitForTimeout(1000)
      const path = e2eScreenshotPath(moodCase, 'zen-study-wallpaper.png')
      await zenWallpaper.screenshot({ path })
      console.log('Screenshot:', path)
    }

    // 3. Navigate back to Aesthetic Moods and select "Rogue Terminal"
    await page.locator('button:has-text("Aesthetic Moods")').click()
    await page.waitForTimeout(500)

    const terminalCard = page.getByTestId('mood-card-rogue-terminal')
    await expect(terminalCard).toBeVisible()
    await terminalCard.locator('button:has-text("Activate Mood")').click()
    await page.waitForTimeout(1000)

    // Verify the button transitions
    await expect(terminalCard.locator('button:has-text("Currently Active")')).toBeVisible()

    // Take screenshot of Rogue Terminal wallpaper view
    if (zenWallpaper) {
      await page.waitForTimeout(1000)
      const path = e2eScreenshotPath(moodCase, 'rogue-terminal-wallpaper.png')
      await zenWallpaper.screenshot({ path })
      console.log('Screenshot:', path)
    }

    // Verify "Zen Study" button is no longer active
    await expect(zenCard.locator('button:has-text("Activate Mood")')).toBeVisible()

    // 3.1 Navigate back to Aesthetic Moods and select "Gothic Novelist"
    await page.locator('button:has-text("Aesthetic Moods")').click()
    await page.waitForTimeout(500)

    const gothicCard = page.getByTestId('mood-card-gothic-novelist')
    await expect(gothicCard).toBeVisible()
    await gothicCard.locator('button:has-text("Activate Mood")').click()
    await page.waitForTimeout(1000)

    // Verify button changes to "Currently Active"
    await expect(gothicCard.locator('button:has-text("Currently Active")')).toBeVisible()

    // Navigate to Appearance tab and verify inputs
    await page.locator('button:has-text("Appearance")').click()
    await page.waitForTimeout(500)

    expect(await moodSelect.inputValue()).toBe('Gothic Novelist')
    expect(await themeSelect.inputValue()).toBe('Drift')
    expect(await fontSelect.inputValue()).toBe('Playfair Display')
    expect(await layoutSelect.inputValue()).toBe('asymmetrical')

    // Take screenshot of Gothic Novelist wallpaper view
    if (zenWallpaper) {
      await page.waitForTimeout(1000)
      const path = e2eScreenshotPath(moodCase, 'gothic-novelist-wallpaper.png')
      await zenWallpaper.screenshot({ path })
      console.log('Screenshot:', path)
    }

    // 3.2 Navigate back to Aesthetic Moods and select "Clickbait Press"
    await page.locator('button:has-text("Aesthetic Moods")').click()
    await page.waitForTimeout(500)

    const clickbaitCard = page.getByTestId('mood-card-clickbait-press')
    await expect(clickbaitCard).toBeVisible()
    await clickbaitCard.locator('button:has-text("Activate Mood")').click()
    await page.waitForTimeout(1000)

    // Verify button changes to "Currently Active"
    await expect(clickbaitCard.locator('button:has-text("Currently Active")')).toBeVisible()

    // Navigate to Appearance tab and verify inputs
    await page.locator('button:has-text("Appearance")').click()
    await page.waitForTimeout(500)

    expect(await moodSelect.inputValue()).toBe('Clickbait Press')
    expect(await themeSelect.inputValue()).toBe('Crimson')
    expect(await fontSelect.inputValue()).toBe('Outfit')
    expect(await layoutSelect.inputValue()).toBe('centered')
    expect(await animationSelect.inputValue()).toBe('Fade')

    await page.waitForTimeout(1500)

    const activeWallpaperWin = electronApp.windows().find(win => win.url().includes('view=wallpaper'))
    expect(activeWallpaperWin, 'Clickbait with Fade should keep the wallpaper overlay window').toBeDefined()
    if (activeWallpaperWin) {
      const wallpaperText = await activeWallpaperWin.evaluate(() => document.body.innerText.trim())
      expect(wallpaperText.toLowerCase()).toContain('stubbed')
      const path = e2eScreenshotPath(moodCase, 'clickbait-press-wallpaper.png')
      await activeWallpaperWin.screenshot({ path })
      console.log('Screenshot:', path)
    }

    // 4. Navigate back to Feeds tab and verify the prompt updated to Clickbait Press
    await page.locator('button:has-text("Ingestion & Feeds")').click()
    await page.waitForTimeout(500)

    const textarea = page.locator('textarea')
    const promptVal = await textarea.inputValue()
    expect(promptVal).toContain('You are a satirical copywriter')
  })
})
