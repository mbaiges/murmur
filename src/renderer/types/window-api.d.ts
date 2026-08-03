import type { MurmurConfig, MurmurState, ThemeName } from '@core/domain/types'
import type { AppUpdateInfo } from '@shared/app-update'

export interface MurmurWindowApi {
  platform: string
  getConfig: () => Promise<MurmurConfig>
  saveConfig: (config: Partial<MurmurConfig>) => Promise<void>
  getHistory: (monitorId: string) => Promise<string[]>
  clearHistory: (monitorId: string) => Promise<void>
  refreshWallpaper: () => Promise<void>
  previewTheme: (monitorId: string, theme: ThemeName) => Promise<void>
  getState: () => Promise<MurmurState>
  getScreens: () => Promise<{ id: string; width: number; height: number }[]>
  getE2eGenerationCount?: () => Promise<number>
  resetE2eGenerationCount?: () => Promise<void>
  onStateUpdated: (callback: (state: MurmurState) => void) => () => void
  onConfigUpdated: (callback: (config: MurmurConfig) => void) => () => void
  openExternal: (url: string) => Promise<void>
  getUpdateInfo: () => Promise<AppUpdateInfo>
  checkForUpdates: () => Promise<AppUpdateInfo>
  quitAndInstallUpdate: () => Promise<void>
  onUpdateStatus: (callback: (info: AppUpdateInfo) => void) => () => void
  onSettingsOpenTab: (callback: (tab: 'general') => void) => () => void
  e2eOpenSettingsTab?: (tab: 'general') => Promise<void>
}

declare global {
  interface Window {
    api?: MurmurWindowApi
  }
}

export {}
