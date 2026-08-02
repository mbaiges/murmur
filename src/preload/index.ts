import { contextBridge, ipcRenderer } from 'electron'
import { MurmurConfig, MurmurState, ThemeName } from '../core/domain/types'
import { IpcChannel } from '../shared/ipc-contract'

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
  getConfig: (): Promise<MurmurConfig> => ipcRenderer.invoke(IpcChannel.configGet),
  saveConfig: (config: Partial<MurmurConfig>): Promise<void> => ipcRenderer.invoke(IpcChannel.configSave, config),
  getHistory: (monitorId: string): Promise<string[]> => ipcRenderer.invoke(IpcChannel.historyGet, monitorId),
  clearHistory: (monitorId: string): Promise<void> => ipcRenderer.invoke(IpcChannel.historyClear, monitorId),
  refreshWallpaper: (): Promise<void> => ipcRenderer.invoke(IpcChannel.actionRefresh),
  previewTheme: (monitorId: string, theme: ThemeName): Promise<void> =>
    ipcRenderer.invoke(IpcChannel.actionPreviewTheme, monitorId, theme),
  getState: (): Promise<MurmurState> => ipcRenderer.invoke(IpcChannel.stateGet),
  onStateUpdated: (callback: (state: MurmurState) => void) => {
    const listener = (_event: any, state: MurmurState) => callback(state)
    ipcRenderer.on(IpcChannel.stateUpdated, listener)
    return () => ipcRenderer.removeListener(IpcChannel.stateUpdated, listener)
  },
  onConfigUpdated: (callback: (config: MurmurConfig) => void) => {
    const listener = (_event: any, config: MurmurConfig) => callback(config)
    ipcRenderer.on(IpcChannel.configUpdated, listener)
    return () => ipcRenderer.removeListener(IpcChannel.configUpdated, listener)
  }
})
