import { ElectronApplication } from '@playwright/test'

export async function getSettingsPage(electronApp: ElectronApplication) {
  let page = await electronApp.firstWindow()
  for (let attempt = 0; attempt < 30; attempt++) {
    for (const win of electronApp.windows()) {
      const url = win.url()
      if (url && !url.includes('view=wallpaper')) {
        page = win
        return page
      }
    }
    await page.waitForTimeout(200)
  }
  return page
}

export function getWallpaperWindow(electronApp: ElectronApplication) {
  const wins = electronApp.windows().filter((w) => w.url().includes('view=wallpaper'))
  if (wins.length === 0) {
    throw new Error('No wallpaper overlay window found')
  }
  return wins[0]
}
