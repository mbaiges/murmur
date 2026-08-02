import { app } from 'electron'
import { execSync } from 'child_process'
import { IStartupIntegration } from '../../../core/ports/IStartupIntegration'

export class WinStartupAdapter implements IStartupIntegration {
  private keyName = 'Murmur'
  private regPath = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'

  public async enable(): Promise<void> {
    if (process.platform !== 'win32') return

    if (!app.isPackaged) {
      console.log('WinStartupAdapter: App is not packaged. Startup registry write bypassed.')
      return
    }

    const execPath = app.getPath('exe')
    try {
      const cmd = `reg add "${this.regPath}" /v "${this.keyName}" /t REG_SZ /d "\\"${execPath}\\" --minimized" /f`
      execSync(cmd)
      console.log('WinStartupAdapter: Startup registry key set successfully')
    } catch (error) {
      console.error('WinStartupAdapter: Failed to set registry key', error)
      throw error
    }
  }

  public async disable(): Promise<void> {
    if (process.platform !== 'win32') return

    if (!app.isPackaged) {
      console.log('WinStartupAdapter: App is not packaged. Startup registry delete bypassed.')
      return
    }

    try {
      const cmd = `reg delete "${this.regPath}" /v "${this.keyName}" /f`
      execSync(cmd)
      console.log('WinStartupAdapter: Startup registry key removed successfully')
    } catch (error) {
      console.log('WinStartupAdapter: Startup key already removed or not found.')
    }
  }

  public async isEnabled(): Promise<boolean> {
    if (process.platform !== 'win32') return false

    if (!app.isPackaged) {
      return false
    }

    try {
      const cmd = `reg query "${this.regPath}" /v "${this.keyName}"`
      const output = execSync(cmd).toString()
      return output.includes(this.keyName)
    } catch (error) {
      return false
    }
  }
}
