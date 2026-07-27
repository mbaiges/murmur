import { exec } from 'child_process'
import { join } from 'path'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { app, screen } from 'electron'
import { IWallpaperRenderer } from '../../ports/IWallpaperRenderer'

export class MacDesktopWallpaperAdapter implements IWallpaperRenderer {
  constructor() {
    try {
      const appData = app.getPath('userData')
      const cacheDir = join(appData, 'wallpaper_cache')
      if (!existsSync(cacheDir)) {
        mkdirSync(cacheDir, { recursive: true })
      }
    } catch (err) {
      console.error('Failed to initialize macOS wallpaper cache directory', err)
    }
  }

  public async getScreens(): Promise<{ id: string; width: number; height: number }[]> {
    const displays = screen.getAllDisplays()
    return displays.map((d) => ({
      id: String(d.id),
      width: d.bounds.width,
      height: d.bounds.height
    }))
  }

  public async set(monitorId: string, pngBuffer: Buffer): Promise<void> {
    const appData = app.getPath('userData')
    const filePath = join(appData, 'wallpaper_cache', `wallpaper_${monitorId}.png`)
    
    writeFileSync(filePath, pngBuffer)

    const escapedPath = filePath.replace(/"/g, '\\"')
    const appleScript = `tell application "System Events" to set picture of every desktop to "${escapedPath}"`
    
    return new Promise<void>((resolve, reject) => {
      exec(`osascript -e '${appleScript}'`, (err) => {
        if (err) {
          console.error(`Failed to set macOS desktop wallpaper via AppleScript`, err)
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  public async backup(): Promise<void> {
    // macOS backup placeholder
  }

  public async restore(): Promise<void> {
    // macOS restore placeholder
  }
}
