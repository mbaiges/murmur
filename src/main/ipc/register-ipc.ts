import { ipcMain } from 'electron'
import type { MurmurState } from '@core/domain/types'
import type { IConfigStore } from '@core/ports/IConfigStore'
import type { IHistoryStore } from '@core/ports/IHistoryStore'
import type { MurmurService } from '@core/domain/MurmurService'
import { IpcChannel } from '@shared/ipc'
import { handleConfigSave, type ConfigSaveHandlerDeps } from './handlers/config-save'
import { handleOpenExternal } from './handlers/open-external'
import { getE2eGenerationCallCount, resetE2eGenerationCallCount } from '../e2e/e2eGenerationCounter'
import { isMurmurE2eMode } from '../bootstrap/e2e-overrides'

export type RegisterIpcDeps = ConfigSaveHandlerDeps & {
  historyStore: IHistoryStore
  murmurService: MurmurService
  getState: () => MurmurState
}

export function registerIpcHandlers(deps: RegisterIpcDeps): void {
  const { configStore, historyStore, murmurService, getState, wallpaperRenderer } = deps

  ipcMain.handle(IpcChannel.configGet, () => configStore.get())
  ipcMain.handle(IpcChannel.configSave, (_event, config) => handleConfigSave(deps, config))

  ipcMain.handle(IpcChannel.historyGet, (_event, monitorId) => historyStore.get(monitorId))
  ipcMain.handle(IpcChannel.historyClear, (_event, monitorId) => historyStore.clear(monitorId))
  ipcMain.handle(IpcChannel.actionRefresh, () => {
    const state = getState()
    return murmurService.refresh({ lastContent: state.lastContent, lastPhrases: state.lastPhrases })
  })
  ipcMain.handle(IpcChannel.actionPreviewTheme, (_event, monitorId, theme) =>
    murmurService.previewTheme(monitorId, theme)
  )
  ipcMain.handle(IpcChannel.stateGet, () => getState())
  ipcMain.handle(IpcChannel.screensGet, () => wallpaperRenderer.getScreens())
  if (isMurmurE2eMode()) {
    ipcMain.handle(IpcChannel.e2eGenerationCountGet, () => getE2eGenerationCallCount())
    ipcMain.handle(IpcChannel.e2eGenerationCountReset, () => {
      resetE2eGenerationCallCount()
    })
  }
  ipcMain.handle(IpcChannel.shellOpenExternal, (_event, url: string) => handleOpenExternal(url))
}
