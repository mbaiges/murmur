import { Notification, Tray } from 'electron'
import type { IUpdateReadyNotifier, UpdateReadyNotification } from '@core/ports/IUpdateReadyNotifier'

const TITLE = 'Murmur update ready'

function bodyForVersion(version: string): string {
  return `Version ${version} is downloaded. Restart to install.`
}

export class WinUpdateReadyNotifierAdapter implements IUpdateReadyNotifier {
  private activationHandler: (() => void) | null = null

  constructor(private readonly getTray: () => Tray | null) {}

  setActivationHandler(handler: () => void): void {
    this.activationHandler = handler
  }

  notifyReadyToInstall(payload: UpdateReadyNotification): void {
    const body = bodyForVersion(payload.version)
    const tray = this.getTray()
    if (tray && process.platform === 'win32') {
      try {
        tray.displayBalloon({
          title: TITLE,
          content: body,
          iconType: 'info'
        })
        tray.once('balloon-click', () => {
          this.activationHandler?.()
        })
        return
      } catch (error) {
        console.warn('WinUpdateReadyNotifierAdapter: balloon failed, falling back', error)
      }
    }
    this.showElectronNotification(body)
  }

  private showElectronNotification(body: string): void {
    try {
      if (!Notification.isSupported()) {
        return
      }
      const notification = new Notification({ title: TITLE, body })
      notification.on('click', () => {
        this.activationHandler?.()
      })
      notification.show()
    } catch (error) {
      console.warn('WinUpdateReadyNotifierAdapter: notification failed', error)
    }
  }
}
