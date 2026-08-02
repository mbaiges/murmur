import type { MurmurConfig, MurmurState, ThemeName } from '@core/domain/types'

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
}

declare global {
  interface Window {
    api?: MurmurWindowApi
  }
}

export {}
