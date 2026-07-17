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

  private runPowerShell(psCommandLines: string[]): string {
    const windir = process.env.windir || 'C:\\Windows'
    const sysnative = join(windir, 'sysnative\\WindowsPowerShell\\v1.0\\powershell.exe')
    const system32 = join(windir, 'System32\\WindowsPowerShell\\v1.0\\powershell.exe')
    
    let bin = 'powershell'
    if (existsSync(sysnative)) {
      bin = sysnative
    } else if (existsSync(system32)) {
      bin = system32
    }

    const commandString = psCommandLines.join('; ')
    const cmdLine = `"${bin}" -NoProfile -Command "${commandString.replace(/"/g, '\\"')}"`
    return execSync(cmdLine).toString()
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
      // Try IDesktopWallpaper COM first
      const psCommandLines = [
        '$wp = New-Object -ComObject DesktopWallpaper',
        `$id = $wp.GetMonitorDevicePathAt(${index})`,
        `$wp.SetWallpaper($id, '${filePath.replace(/'/g, "''")}')`
      ]
      this.runPowerShell(psCommandLines)
    } catch (error) {
      console.warn(`WinDesktopWallpaperAdapter: IDesktopWallpaper COM failed. Falling back to Win32 SystemParametersInfo.`)
      try {
        // Fallback to Win32 SystemParametersInfo API (SPI_SETDESKWALLPAPER = 0x0014)
        const psCommandLines = [
          `$code = '[DllImport("user32.dll", CharSet=CharSet.Auto)] public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);'`,
          `Add-Type -MemberDefinition $code -Name "Win32Utils" -Namespace "Win32" -ErrorAction SilentlyContinue`,
          `[Win32.Win32Utils]::SystemParametersInfo(0x0014, 0, '${filePath.replace(/'/g, "''")}', 3)`
        ]
        this.runPowerShell(psCommandLines)
      } catch (fallbackError) {
        console.error(`WinDesktopWallpaperAdapter: Fallback failed`, fallbackError)
        throw fallbackError
      }
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
      const output = this.runPowerShell(psCommandLines).trim()
      if (output) {
        writeFileSync(this.backupFile, output, 'utf8')
        console.log('WinDesktopWallpaperAdapter: Wallpaper backup saved successfully')
      }
    } catch (error) {
      console.warn('WinDesktopWallpaperAdapter: Backup failed, skipping COM backup')
    }
  }

  public async restore(): Promise<void> {
    if (process.platform !== 'win32') return
    if (!existsSync(this.backupFile)) return

    try {
      const backupData = JSON.parse(readFileSync(this.backupFile, 'utf8')) as string[]
      
      try {
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

        this.runPowerShell(psCommandLines)
        console.log('WinDesktopWallpaperAdapter: Wallpaper restored successfully')
      } catch (comError) {
        if (backupData && backupData[0]) {
          const psCommandLines = [
            `$code = '[DllImport("user32.dll", CharSet=CharSet.Auto)] public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);'`,
            `Add-Type -MemberDefinition $code -Name "Win32Utils" -Namespace "Win32" -ErrorAction SilentlyContinue`,
            `[Win32.Win32Utils]::SystemParametersInfo(0x0014, 0, '${backupData[0].replace(/'/g, "''")}', 3)`
          ]
          this.runPowerShell(psCommandLines)
          console.log('WinDesktopWallpaperAdapter: Wallpaper restored via Win32 fallback')
        }
      }
    } catch (error) {
      console.error('WinDesktopWallpaperAdapter: Restore failed', error)
    }
  }
}
