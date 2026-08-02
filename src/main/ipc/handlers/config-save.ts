import { screen } from 'electron'
import type { MurmurConfig } from '@core/domain/types'
import type { MurmurState } from '@core/domain/types'
import { shouldRegeneratePhraseAfterConfigSave } from '@core/lib/appearanceRegenerate'
import type { IConfigStore } from '@core/ports/IConfigStore'
import type { IStartupIntegration } from '@core/ports/IStartupIntegration'
import type { IWallpaperRenderer } from '@core/ports/IWallpaperRenderer'
import type { MurmurService } from '@core/domain/MurmurService'
import type { Scheduler } from '@core/domain/Scheduler'
import { IpcChannel } from '@shared/ipc'
import {
  createBackgroundWindow,
  destroyAllBackgroundWindows,
  forEachBackgroundWindow,
  hasBackgroundWindow
} from '../../windows/background-windows'
import { getSettingsWindow } from '../../windows/settings-window'

export type ConfigSaveHandlerDeps = {
  configStore: IConfigStore
  startupAdapter: IStartupIntegration
  scheduler: Scheduler
  wallpaperRenderer: IWallpaperRenderer
  murmurService: MurmurService
  getState: () => MurmurState
  isQuitting: () => boolean
}

export async function handleConfigSave(
  deps: ConfigSaveHandlerDeps,
  config: MurmurConfig
): Promise<void> {
  const { configStore, startupAdapter, scheduler, wallpaperRenderer, murmurService, getState, isQuitting } =
    deps

  const prevConfig = await configStore.get()
  await configStore.set(config)
  const newConfig = await configStore.get()

  if (newConfig.launchAtLogin !== prevConfig.launchAtLogin) {
    if (newConfig.launchAtLogin) {
      await startupAdapter.enable()
    } else {
      await startupAdapter.disable()
    }
  }

  if (
    newConfig.refreshIntervalMinutes !== prevConfig.refreshIntervalMinutes ||
    (newConfig.geminiApiKey && !prevConfig.geminiApiKey)
  ) {
    if (newConfig.geminiApiKey) {
      scheduler.start(newConfig.refreshIntervalMinutes)
    } else {
      scheduler.stop()
    }
  }

  const useNativeStaticOnly = newConfig.animation === 'Instant' && process.platform !== 'darwin'
  if (useNativeStaticOnly) {
    destroyAllBackgroundWindows()
  } else {
    const screens = await wallpaperRenderer.getScreens()
    const displays = screen.getAllDisplays()
    for (const s of screens) {
      if (!hasBackgroundWindow(s.id)) {
        const display = displays.find((d) => String(d.id) === s.id) || displays[0]
        const bounds = display ? display.bounds : { x: 0, y: 0, width: 1920, height: 1080 }
        createBackgroundWindow(
          { id: s.id, width: bounds.width, height: bounds.height },
          bounds.x,
          bounds.y,
          wallpaperRenderer,
          isQuitting
        )
      }
    }
  }

  forEachBackgroundWindow((win) => {
    win.webContents.send(IpcChannel.configUpdated, newConfig)
  })
  getSettingsWindow()?.webContents.send(IpcChannel.configUpdated, newConfig)

  const state = getState()
  if (newConfig.geminiApiKey) {
    const appearanceChanged = shouldRegeneratePhraseAfterConfigSave(prevConfig, newConfig)
    const hasCachedPhrase = Object.values(state.lastPhrases || {}).some((p) => p && p.trim())
    if (newConfig.animation === 'Instant' && hasCachedPhrase) {
      await murmurService.updateClockWallpapers(state)
    }
    if (appearanceChanged) {
      await murmurService.refresh({ lastContent: state.lastContent, lastPhrases: state.lastPhrases })
    } else if (newConfig.animation !== 'Instant') {
      await murmurService.updateClockWallpapers(state)
    }
  }
}
