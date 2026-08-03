export type UpdateReadyNotification = {
  version: string
}

export interface IUpdateReadyNotifier {
  notifyReadyToInstall(payload: UpdateReadyNotification): void
  setActivationHandler(handler: () => void): void
}
