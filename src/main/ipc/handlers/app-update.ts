import { ipcMain } from 'electron'
import type { AppUpdater } from '../../infrastructure/update/createAppUpdater'
import { IpcChannel } from '@shared/ipc'

export function registerAppUpdateHandlers(updater: AppUpdater): void {
  ipcMain.handle(IpcChannel.updateGet, () => updater.getInfo())
  ipcMain.handle(IpcChannel.updateCheck, () => updater.check())
  ipcMain.handle(IpcChannel.updateQuitAndInstall, () => {
    updater.quitAndInstall()
  })
}
