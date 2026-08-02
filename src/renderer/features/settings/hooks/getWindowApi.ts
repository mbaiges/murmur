import type { MurmurConfig, MurmurState, ThemeName } from '@core/domain/types'

export type MurmurWindowApi = {
  platform: string
  getConfig: () => Promise<MurmurConfig>
  saveConfig: (config: Partial<MurmurConfig>) => Promise<void>
  getHistory: (monitorId: string) => Promise<string[]>
  clearHistory: (monitorId: string) => Promise<void>
  refreshWallpaper: () => Promise<void>
  previewTheme: (monitorId: string, theme: ThemeName) => Promise<void>
  getState: () => Promise<MurmurState>
  onStateUpdated: (callback: (state: MurmurState) => void) => () => void
  onConfigUpdated: (callback: (config: MurmurConfig) => void) => () => void
}

export function getWindowApi(): MurmurWindowApi | undefined {
  return (window as { api?: MurmurWindowApi }).api
}
