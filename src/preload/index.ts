import { contextBridge, ipcRenderer } from 'electron'
import { MurmurConfig, MurmurState, ThemeName } from '@core/domain/types'
import { IpcChannel } from '@shared/ipc'
import type { AppUpdateInfo } from '@shared/app-update'

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
  getScreens: (): Promise<{ id: string; width: number; height: number }[]> =>
    ipcRenderer.invoke(IpcChannel.screensGet),
  getE2eGenerationCount: (): Promise<number> => ipcRenderer.invoke(IpcChannel.e2eGenerationCountGet),
  resetE2eGenerationCount: (): Promise<void> => ipcRenderer.invoke(IpcChannel.e2eGenerationCountReset),
  getE2eBackgroundPipelineCounts: (): Promise<{ imagePrompt: number; provider: number }> =>
    ipcRenderer.invoke(IpcChannel.e2eBackgroundPipelineCountsGet),
  resetE2eBackgroundPipelineCounts: (): Promise<void> =>
    ipcRenderer.invoke(IpcChannel.e2eBackgroundPipelineCountsReset),
  pickBackgroundPhoto: (): Promise<string | null> => ipcRenderer.invoke(IpcChannel.backgroundPickPhoto),
  importBackgroundPhoto: (monitorId: string, sourcePath: string): Promise<{ relPath: string }> =>
    ipcRenderer.invoke(IpcChannel.backgroundImportPhoto, monitorId, sourcePath),
  getBackgroundDataUrl: (
    monitorId: string,
    kind: 'personal' | 'ai'
  ): Promise<string | null> => ipcRenderer.invoke(IpcChannel.backgroundDataUrlGet, monitorId, kind),
  onStateUpdated: (callback: (state: MurmurState) => void) => {
    const listener = (_event: any, state: MurmurState) => callback(state)
    ipcRenderer.on(IpcChannel.stateUpdated, listener)
    return () => ipcRenderer.removeListener(IpcChannel.stateUpdated, listener)
  },
  onConfigUpdated: (callback: (config: MurmurConfig) => void) => {
    const listener = (_event: any, config: MurmurConfig) => callback(config)
    ipcRenderer.on(IpcChannel.configUpdated, listener)
    return () => ipcRenderer.removeListener(IpcChannel.configUpdated, listener)
  },
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke(IpcChannel.shellOpenExternal, url),
  getUpdateInfo: (): Promise<AppUpdateInfo> => ipcRenderer.invoke(IpcChannel.updateGet),
  checkForUpdates: (): Promise<AppUpdateInfo> => ipcRenderer.invoke(IpcChannel.updateCheck),
  quitAndInstallUpdate: (): Promise<void> => ipcRenderer.invoke(IpcChannel.updateQuitAndInstall),
  onUpdateStatus: (callback: (info: AppUpdateInfo) => void) => {
    const listener = (_event: unknown, info: AppUpdateInfo) => callback(info)
    ipcRenderer.on(IpcChannel.updateStatus, listener)
    return () => ipcRenderer.removeListener(IpcChannel.updateStatus, listener)
  },
  onSettingsOpenTab: (callback: (tab: 'general') => void) => {
    const listener = (_event: unknown, tab: 'general') => callback(tab)
    ipcRenderer.on(IpcChannel.settingsOpenTab, listener)
    return () => ipcRenderer.removeListener(IpcChannel.settingsOpenTab, listener)
  },
  onSettingsToast: (callback: (payload: { message: string; type: 'success' | 'error' }) => void) => {
    const listener = (_event: unknown, payload: { message: string; type: 'success' | 'error' }) =>
      callback(payload)
    ipcRenderer.on(IpcChannel.settingsToast, listener)
    return () => ipcRenderer.removeListener(IpcChannel.settingsToast, listener)
  },
  e2eOpenSettingsTab: (tab: 'general'): Promise<void> =>
    ipcRenderer.invoke(IpcChannel.e2eSettingsOpenTab, tab)
})
