import { Notification } from 'electron'
import type { IUpdateReadyNotifier, UpdateReadyNotification } from '@core/ports/IUpdateReadyNotifier'

const TITLE = 'Murmur update ready'

function bodyForVersion(version: string): string {
  return `Version ${version} is downloaded. Restart to install.`
}

export class MacUpdateReadyNotifierAdapter implements IUpdateReadyNotifier {
  private activationHandler: (() => void) | null = null

  setActivationHandler(handler: () => void): void {
    this.activationHandler = handler
  }

  notifyReadyToInstall(payload: UpdateReadyNotification): void {
    try {
      if (!Notification.isSupported()) {
        return
      }
      const notification = new Notification({
        title: TITLE,
        body: bodyForVersion(payload.version)
      })
      notification.on('click', () => {
        this.activationHandler?.()
      })
      notification.show()
    } catch (error) {
      console.warn('MacUpdateReadyNotifierAdapter: failed to show notification', error)
    }
  }
}
