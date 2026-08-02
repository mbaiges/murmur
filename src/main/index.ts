import { app, screen } from 'electron'
import { configureAppBranding } from './configureAppBranding'
import { MurmurState } from '@core/domain/types'
import { IpcChannel } from '@shared/ipc'
import { parseHistoryEntry } from '@core/lib/layout/layoutContentParse'
import { payloadToPlainSummary } from '@core/lib/phrase/payloadToPlainSummary'
import { getLayoutContentSpec } from '@core/lib/layout/layoutContentSpecs'
import { buildAppContext, createRefreshScheduler } from './bootstrap/composition-root'
import { isMurmurE2eMode } from './bootstrap/e2e-overrides'
import { registerIpcHandlers } from './ipc/register-ipc'
import { ElectronTrayAdapter } from './infrastructure/tray/ElectronTrayAdapter'
import { createBackgroundWindow } from './windows/background-windows'
import { forEachBackgroundWindow } from './windows/background-windows'
import { getSettingsWindow, showSettingsWindow } from './windows/settings-window'

configureAppBranding()

app.disableHardwareAcceleration()

const ctx = buildAppContext()
const {
  configStore,
  historyStore,
  trayAdapter,
  startupAdapter,
  wallpaperRenderer,
  murmurService
} = ctx

let isQuitting = false
let userRequestedWallpaperRestore = false

let state: MurmurState = {
  isPaused: false,
  lastRefreshTime: undefined,
  lastPhrases: {},
  lastContent: {},
  lastHeadlines: {},
  lastSources: {}
}

const scheduler = createRefreshScheduler(murmurService, {
  isPaused: () => state.isPaused,
  getLastContent: () => state.lastContent,
  getLastPhrases: () => state.lastPhrases
})

function startClockScheduler() {
  // Disabled main process background clock ticker to eliminate the Win32 SetWallpaper screen blinks/flickers.
  // The React clock widget handles UI updates smoothly on screen in Chromium.
}

app.whenReady().then(async () => {
  registerIpcHandlers({
    configStore,
    historyStore,
    startupAdapter,
    scheduler,
    wallpaperRenderer,
    murmurService,
    getState: () => state,
    isQuitting: () => isQuitting
  })

  await wallpaperRenderer.backup()

  try {
    const screens = await wallpaperRenderer.getScreens()
    const initialPhrases: Record<string, string> = {}
    const displays = screen.getAllDisplays()

    const configTemp = await configStore.get()
    // Same rule as before per-monitor: macOS always keeps a desktop overlay; Windows only
    // when any monitor is not Instant. Style fields now live on monitor profiles.
    const shouldSpawnBg =
      process.platform === 'darwin' ||
      configTemp.monitors.some((m) => m.profile.animation !== 'Instant')
    const layoutForHistory = configTemp.monitors[0]?.profile.layoutStyle ?? 'centered'

    for (const s of screens) {
      const history = await historyStore.get(s.id)
      const raw = history[0] || ''
      if (raw) {
        const envelope = parseHistoryEntry(raw, layoutForHistory)
        initialPhrases[s.id] = payloadToPlainSummary(getLayoutContentSpec(envelope.layoutStyle), envelope.payload)
        state.lastContent[s.id] = envelope
      } else {
        initialPhrases[s.id] = ''
      }
      if (shouldSpawnBg) {
        const display = displays.find((d) => String(d.id) === s.id) || displays[0]
        const bounds = display ? display.bounds : { x: 0, y: 0, width: 1920, height: 1080 }
        createBackgroundWindow(
          { id: s.id, width: bounds.width, height: bounds.height },
          bounds.x,
          bounds.y,
          wallpaperRenderer,
          () => isQuitting
        )
      }
    }
    state = {
      ...state,
      lastPhrases: initialPhrases,
      lastContent: { ...state.lastContent }
    }
  } catch (err) {
    console.error('Failed to pre-initialize active screens and background windows', err)
  }

  const config = await configStore.get()

  const tray = trayAdapter as ElectronTrayAdapter
  const customTrayAdapterUpdate = tray.updateState.bind(tray)
  tray.updateState = (newState: MurmurState) => {
    state = { ...state, ...newState }
    customTrayAdapterUpdate(state)
    getSettingsWindow()?.webContents.send(IpcChannel.stateUpdated, state)
    forEachBackgroundWindow((win) => {
      win.webContents.send(IpcChannel.stateUpdated, state)
    })
  }

  tray.init(
    async () => {
      await murmurService.refresh({ lastContent: state.lastContent, lastPhrases: state.lastPhrases })
    },
    () => {
      showSettingsWindow()
    },
    () => {
      userRequestedWallpaperRestore = true
      app.quit()
    }
  )

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
      userRequestedWallpaperRestore = true
      app.quit()
    })
  }

  if (config.geminiApiKey || isMurmurE2eMode()) {
    scheduler.start(config.refreshIntervalMinutes)
  }

  startClockScheduler()

  if (!app.isPackaged || !config.geminiApiKey || isMurmurE2eMode()) {
    showSettingsWindow()
  }
})

app.on('activate', () => {
  showSettingsWindow()
})

app.on('window-all-closed', () => {
  // running in tray
})

app.on('before-quit', async (event) => {
  if (!isQuitting) {
    event.preventDefault()
    isQuitting = true
    try {
      const shouldRestore =
        !isMurmurE2eMode() &&
        (app.isPackaged || userRequestedWallpaperRestore)
      if (shouldRestore) {
        console.log('Restoring original wallpapers before quit...')
        await wallpaperRenderer.restore()
      } else if (!app.isPackaged) {
        console.log(
          'Dev relaunch: wallpaper left unchanged (use tray Quit or stop the dev server to restore).'
        )
      }
    } catch (err) {
      console.error('Failed to restore wallpapers on quit:', err)
    } finally {
      app.exit(0)
    }
  }
})
