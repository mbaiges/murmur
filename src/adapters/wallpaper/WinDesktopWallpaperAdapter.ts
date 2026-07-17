import { app, screen } from 'electron'
import { execSync } from 'child_process'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { IWallpaperRenderer } from '../../ports/IWallpaperRenderer'

export class WinDesktopWallpaperAdapter implements IWallpaperRenderer {
  private wallpaperDir: string
  private backupFile: string

  constructor() {
    this.wallpaperDir = join(app.getPath('userData'), 'wallpapers')
    this.backupFile = join(app.getPath('userData'), 'wallpaper_backup.json')

    if (!existsSync(this.wallpaperDir)) {
      mkdirSync(this.wallpaperDir, { recursive: true })
    }
  }

  public async getScreens(): Promise<{ id: string; width: number; height: number }[]> {
    const displays = screen.getAllDisplays()
    return displays.map((d) => {
      const width = Math.round(d.bounds.width * d.scaleFactor)
      const height = Math.round(d.bounds.height * d.scaleFactor)
      return {
        id: String(d.id),
        width,
        height
      }
    })
  }

  public async set(monitorId: string, pngBuffer: Buffer): Promise<void> {
    const displays = screen.getAllDisplays()
    const index = displays.findIndex((d) => String(d.id) === monitorId)
    if (index === -1) {
      throw new Error(`WinDesktopWallpaperAdapter: Display with ID ${monitorId} not found`)
    }

    const filePath = join(this.wallpaperDir, `wallpaper_${monitorId}.png`)
    writeFileSync(filePath, pngBuffer)

    if (process.platform !== 'win32') {
      console.log(`[Non-Windows] Set wallpaper for monitor ${monitorId} to ${filePath}`)
      return
    }

    try {
      const psCommandLines = [
        '$wp = New-Object -ComObject DesktopWallpaper',
        `$id = $wp.GetMonitorDevicePathAt(${index})`,
        `$wp.SetWallpaper($id, '${filePath.replace(/'/g, "''")}')`
      ]
      execSync(`powershell -NoProfile -Command "${psCommandLines.join('; ')}"`)
    } catch (error) {
      console.error(`WinDesktopWallpaperAdapter: Failed to set wallpaper via PowerShell`, error)
      throw error
    }
  }

  public async backup(): Promise<void> {
    if (process.platform !== 'win32') return
    if (existsSync(this.backupFile)) return

    try {
      const psCommandLines = [
        '$wp = New-Object -ComObject DesktopWallpaper',
        '$count = $wp.GetMonitorDevicePathCount()',
        '$paths = @()',
        'for ($i = 0; $i -lt $count; $i++) { $id = $wp.GetMonitorDevicePathAt($i); $paths += $wp.GetWallpaper($id) }',
        '$paths | ConvertTo-Json -Compress'
      ]
      const output = execSync(`powershell -NoProfile -Command "${psCommandLines.join('; ')}"`).toString().trim()
      if (output) {
        writeFileSync(this.backupFile, output, 'utf8')
        console.log('WinDesktopWallpaperAdapter: Wallpaper backup saved successfully')
      }
    } catch (error) {
      console.error('WinDesktopWallpaperAdapter: Backup failed', error)
    }
  }

  public async restore(): Promise<void> {
    if (process.platform !== 'win32') return
    if (!existsSync(this.backupFile)) return

    try {
      const backupData = JSON.parse(readFileSync(this.backupFile, 'utf8')) as string[]
      const psCommandLines = [
        '$wp = New-Object -ComObject DesktopWallpaper',
        `$backup = '${JSON.stringify(backupData).replace(/'/g, "''")}' | ConvertFrom-Json`
      ]

      backupData.forEach((path, i) => {
        if (path) {
          psCommandLines.push(`$id = $wp.GetMonitorDevicePathAt(${i})`)
          psCommandLines.push(`$wp.SetWallpaper($id, '${path.replace(/'/g, "''")}')`)
        }
      })

      execSync(`powershell -NoProfile -Command "${psCommandLines.join('; ')}"`)
      console.log('WinDesktopWallpaperAdapter: Wallpaper restored successfully')
    } catch (error) {
      console.error('WinDesktopWallpaperAdapter: Restore failed', error)
    }
  }
}
