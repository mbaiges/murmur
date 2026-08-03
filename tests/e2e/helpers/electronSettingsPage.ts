import { ElectronApplication, expect } from '@playwright/test'

export async function getSettingsPage(electronApp: ElectronApplication) {
  let page = await electronApp.firstWindow()
  for (let attempt = 0; attempt < 40; attempt++) {
    for (const win of electronApp.windows()) {
      const url = win.url()
      if (url && !url.includes('view=wallpaper')) {
        return win
      }
    }
    await page.waitForTimeout(250)
  }
  throw new Error('Settings window not found (no non-wallpaper BrowserWindow within ~10s)')
}

export function getWallpaperWindow(electronApp: ElectronApplication) {
  const wins = electronApp.windows().filter((w) => w.url().includes('view=wallpaper'))
  if (wins.length === 0) {
    throw new Error('No wallpaper overlay window found')
  }
  return wins[0]
}

/** Poll until overlay exists (startup / animation). */
export async function waitForWallpaperWindow(electronApp: ElectronApplication) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const wins = electronApp.windows().filter((w) => w.url().includes('view=wallpaper'))
    if (wins.length > 0) {
      return wins[0]
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('No wallpaper overlay window found within ~10s')
}

export async function expectWallpaperLayout(electronApp: ElectronApplication, layoutTestId: string) {
  const wallpaper = await waitForWallpaperWindow(electronApp)
  await expect(wallpaper.getByTestId(layoutTestId)).toBeVisible({ timeout: 15_000 })
  return wallpaper
}
