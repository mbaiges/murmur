import { app } from 'electron'
import { IStartupIntegration } from '../../core/ports/IStartupIntegration'

export class MacStartupAdapter implements IStartupIntegration {
  public async enable(): Promise<void> {
    try {
      app.setLoginItemSettings({
        openAtLogin: true,
        path: app.getPath('exe')
      })
    } catch (err) {
      console.error('Failed to enable macOS launch at login', err)
      throw err
    }
  }

  public async disable(): Promise<void> {
    try {
      app.setLoginItemSettings({
        openAtLogin: false
      })
    } catch (err) {
      console.error('Failed to disable macOS launch at login', err)
      throw err
    }
  }

  public async isEnabled(): Promise<boolean> {
    try {
      return app.getLoginItemSettings().openAtLogin
    } catch (err) {
      console.error('Failed to query macOS launch at login state', err)
      return false
    }
  }
}
