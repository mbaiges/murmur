import { exec } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import {
  writeFileSync,
  readFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  unlinkSync
} from 'fs'
import { app, screen } from 'electron'
import { IWallpaperRenderer } from '../../core/ports/IWallpaperRenderer'

const execAsync = promisify(exec)

interface DesktopBackupEntry {
  index: number
  originalPath: string
  backupCopyPath?: string
}

interface WallpaperBackupData {
  desktops: DesktopBackupEntry[]
}

export class MacDesktopWallpaperAdapter implements IWallpaperRenderer {
  private backupFile: string
  private backupDir: string
  private cacheDir: string
  private userDataDir: string

  constructor() {
    this.userDataDir = app.getPath('userData')
    this.cacheDir = join(this.userDataDir, 'wallpaper_cache')
    this.backupDir = join(this.userDataDir, 'wallpaper_backup')
    this.backupFile = join(this.userDataDir, 'wallpaper_backup.json')

    try {
      if (!existsSync(this.cacheDir)) {
        mkdirSync(this.cacheDir, { recursive: true })
      }
    } catch (err) {
      console.error('Failed to initialize macOS wallpaper cache directory', err)
    }
  }

  private isManagedWallpaperPath(filePath: string): boolean {
    if (!filePath) {
      return false
    }
    const normalized = filePath.toLowerCase()
    return (
      normalized.includes('/wallpaper_cache/') ||
      normalized.includes('/wallpaper_backup/') ||
      normalized.includes('\\wallpaper_cache\\') ||
      normalized.includes('\\wallpaper_backup\\')
    )
  }

  private readBackupData(): WallpaperBackupData {
    if (!existsSync(this.backupFile)) {
      return { desktops: [] }
    }
    try {
      return JSON.parse(readFileSync(this.backupFile, 'utf-8')) as WallpaperBackupData
    } catch {
      return { desktops: [] }
    }
  }

  private writeBackupData(data: WallpaperBackupData): void {
    writeFileSync(this.backupFile, JSON.stringify(data, null, 2))
  }

  private async runAppleScript(script: string): Promise<string> {
    const { stdout } = await execAsync(`osascript -e ${JSON.stringify(script)}`)
    return stdout.trim()
  }

  private runOsascriptCommand(appleScript: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      exec(`osascript -e '${appleScript}'`, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
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
    const filePath = join(this.cacheDir, `wallpaper_${monitorId}.png`)

    writeFileSync(filePath, pngBuffer)

    const escapedPath = filePath.replace(/"/g, '\\"')
    const appleScript = `tell application "System Events" to set picture of every desktop to "${escapedPath}"`

    return this.runOsascriptCommand(appleScript)
  }

  public async backup(): Promise<void> {
    try {
      mkdirSync(this.backupDir, { recursive: true })

      const countStr = await this.runAppleScript('tell application "System Events" to count of desktops')
      const desktopCount = parseInt(countStr, 10)
      if (!Number.isFinite(desktopCount) || desktopCount < 1) {
        throw new Error(`Unexpected desktop count: ${countStr}`)
      }

      const data = this.readBackupData()
      const nextDesktops: DesktopBackupEntry[] = [...data.desktops]

      for (let index = 1; index <= desktopCount; index++) {
        const currentPath = await this.runAppleScript(
          `tell application "System Events" to get picture of desktop ${index}`
        )

        const existing = nextDesktops.find((d) => d.index === index)

        if (this.isManagedWallpaperPath(currentPath)) {
          if (existing?.originalPath && !this.isManagedWallpaperPath(existing.originalPath)) {
            continue
          }
          console.warn(
            `MacDesktopWallpaperAdapter: Desktop ${index} already shows Murmur wallpaper; keeping prior backup if any.`
          )
          continue
        }

        let backupCopyPath = existing?.backupCopyPath
        if (existsSync(currentPath)) {
          const ext = currentPath.includes('.')
            ? currentPath.slice(currentPath.lastIndexOf('.'))
            : '.png'
          const copyTarget = join(this.backupDir, `desktop_${index}${ext}`)
          try {
            copyFileSync(currentPath, copyTarget)
            backupCopyPath = copyTarget
          } catch (copyErr) {
            console.warn(
              `MacDesktopWallpaperAdapter: Could not copy wallpaper file; will restore by original path (${currentPath})`,
              copyErr
            )
          }
        }

        const entry: DesktopBackupEntry = {
          index,
          originalPath: currentPath,
          ...(backupCopyPath ? { backupCopyPath } : {})
        }

        const at = nextDesktops.findIndex((d) => d.index === index)
        if (at === -1) {
          nextDesktops.push(entry)
        } else {
          nextDesktops[at] = entry
        }
      }

      if (nextDesktops.length > 0) {
        this.writeBackupData({ desktops: nextDesktops })
        console.log('MacDesktopWallpaperAdapter: Backed up current wallpaper(s)')
      }
    } catch (err) {
      console.error('MacDesktopWallpaperAdapter: Backup failed', err)
    }
  }

  private async setDesktopPicture(index: number, filePath: string): Promise<void> {
    const escapedPath = filePath.replace(/"/g, '\\"')
    const appleScript = `tell application "System Events" to set picture of desktop ${index} to "${escapedPath}"`
    await this.runOsascriptCommand(appleScript)
  }

  public async restore(): Promise<void> {
    if (!existsSync(this.backupFile)) {
      return
    }

    const data = this.readBackupData()
    let restoredAny = false

    try {
      for (const desktop of data.desktops) {
        const targets = [desktop.originalPath, desktop.backupCopyPath].filter(
          (p): p is string => !!p && existsSync(p)
        )

        if (targets.length === 0) {
          continue
        }

        let restored = false
        for (const path of targets) {
          try {
            await this.setDesktopPicture(desktop.index, path)
            restored = true
            restoredAny = true
            break
          } catch (err) {
            console.warn(`MacDesktopWallpaperAdapter: Failed to restore desktop ${desktop.index} from ${path}`, err)
          }
        }

        if (!restored) {
          console.error(`MacDesktopWallpaperAdapter: Could not restore desktop ${desktop.index}`)
        }
      }

      if (restoredAny) {
        unlinkSync(this.backupFile)
        console.log('MacDesktopWallpaperAdapter: Restored original wallpaper(s)')
      }
    } catch (err) {
      console.error('MacDesktopWallpaperAdapter: Restore failed', err)
    }
  }
}
