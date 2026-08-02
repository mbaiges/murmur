import { app, screen } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { IWallpaperRenderer } from '../../../core/ports/IWallpaperRenderer'

const execAsync = promisify(exec)

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

  private getHelperPath(): string {
    const pathsToSearch = [
      join(process.resourcesPath || '', 'bin/WallpaperHelper.exe'),
      join(process.resourcesPath || '', 'resources/bin/WallpaperHelper.exe'),
      join(__dirname, '../../resources/bin/WallpaperHelper.exe'),
      join(__dirname, '../../../resources/bin/WallpaperHelper.exe'),
      join(app.getAppPath(), 'resources/bin/WallpaperHelper.exe')
    ]

    for (const p of pathsToSearch) {
      if (existsSync(p)) {
        return p
      }
    }
    return join(app.getAppPath(), 'resources/bin/WallpaperHelper.exe')
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
      const helperPath = this.getHelperPath()
      const cmd = `"${helperPath}" set ${index} "${filePath}"`
      const { stdout } = await execAsync(cmd)
      console.log(`WinDesktopWallpaperAdapter: Native helper set output: ${stdout.trim()}`)
    } catch (error) {
      console.error(`WinDesktopWallpaperAdapter: Native helper set failed`, error)
      throw error
    }
  }

  public async backup(): Promise<void> {
    if (process.platform !== 'win32') return
    if (existsSync(this.backupFile)) return

    try {
      const helperPath = this.getHelperPath()
      const cmd = `"${helperPath}" backup "${this.backupFile}"`
      const { stdout } = await execAsync(cmd)
      console.log(`WinDesktopWallpaperAdapter: Native helper backup output: ${stdout.trim()}`)
    } catch (error) {
      console.error('WinDesktopWallpaperAdapter: Backup failed', error)
    }
  }

  public async restore(): Promise<void> {
    if (process.platform !== 'win32') return
    if (!existsSync(this.backupFile)) return

    try {
      const helperPath = this.getHelperPath()
      const cmd = `"${helperPath}" restore "${this.backupFile}"`
      const { stdout } = await execAsync(cmd)
      console.log(`WinDesktopWallpaperAdapter: Native helper restore output: ${stdout.trim()}`)
      
      try {
        unlinkSync(this.backupFile)
      } catch (err) {
        console.error('Failed to delete wallpaper backup file:', err)
      }
    } catch (error) {
      console.error('WinDesktopWallpaperAdapter: Restore failed', error)
    }
  }

  public async inject(windowTitle: string): Promise<void> {
    if (process.platform !== 'win32') return

    try {
      const helperPath = this.getHelperPath()
      const cmd = `"${helperPath}" inject "${windowTitle}"`
      const { stdout } = await execAsync(cmd)
      console.log(`WinDesktopWallpaperAdapter: Native helper inject output: ${stdout.trim()}`)
    } catch (error) {
      console.error('WinDesktopWallpaperAdapter: Inject failed', error)
      throw error
    }
  }
}
