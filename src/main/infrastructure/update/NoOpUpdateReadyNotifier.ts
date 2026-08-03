import type { IUpdateReadyNotifier, UpdateReadyNotification } from '@core/ports/IUpdateReadyNotifier'

export class NoOpUpdateReadyNotifier implements IUpdateReadyNotifier {
  notifyReadyToInstall(_payload: UpdateReadyNotification): void {}
  setActivationHandler(_handler: () => void): void {}
}
