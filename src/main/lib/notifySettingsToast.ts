import { IpcChannel } from '@shared/ipc'
import { getSettingsWindow, shouldShowSettingsToasts } from '../windows/settings-window'

export type SettingsToastPayload = {
  message: string
  type: 'success' | 'error'
}

export function notifySettingsToast(message: string, type: SettingsToastPayload['type'] = 'error'): void {
  if (!shouldShowSettingsToasts()) return
  getSettingsWindow()?.webContents.send(IpcChannel.settingsToast, { message, type })
}
