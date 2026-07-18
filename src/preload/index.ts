import { contextBridge, ipcRenderer } from 'electron'
import { MurmurConfig, MurmurState, ThemeName } from '../domain/types'

contextBridge.exposeInMainWorld('api', {
  getConfig: (): Promise<MurmurConfig> => ipcRenderer.invoke('config:get'),
  saveConfig: (config: Partial<MurmurConfig>): Promise<void> => ipcRenderer.invoke('config:save', config),
  getHistory: (monitorId: string): Promise<string[]> => ipcRenderer.invoke('history:get', monitorId),
  clearHistory: (monitorId: string): Promise<void> => ipcRenderer.invoke('history:clear', monitorId),
  refreshWallpaper: (): Promise<void> => ipcRenderer.invoke('action:refresh'),
  previewTheme: (monitorId: string, theme: ThemeName): Promise<void> => ipcRenderer.invoke('action:previewTheme', monitorId, theme),
  getState: (): Promise<MurmurState> => ipcRenderer.invoke('state:get'),
  onStateUpdated: (callback: (state: MurmurState) => void) => {
    const listener = (_event: any, state: MurmurState) => callback(state)
    ipcRenderer.on('state:updated', listener)
    return () => ipcRenderer.removeListener('state:updated', listener)
  },
  onConfigUpdated: (callback: (config: MurmurConfig) => void) => {
    const listener = (_event: any, config: MurmurConfig) => callback(config)
    ipcRenderer.on('config:updated', listener)
    return () => ipcRenderer.removeListener('config:updated', listener)
  }
})
