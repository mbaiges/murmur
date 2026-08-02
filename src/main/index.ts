import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { configureAppBranding } from './configureAppBranding'
import { resolveBrandIconPath } from './lib/resolveBrandIcon'
import { shouldRegeneratePhraseAfterConfigSave } from '../core/lib/appearanceRegenerate'
import { MurmurState } from '../core/domain/types'
import { IpcChannel } from '../shared/ipc-contract'
import { parseHistoryEntry } from '../core/lib/layoutContentParse'
import { payloadToPlainSummary } from '../core/lib/payloadToPlainSummary'
import { getLayoutContentSpec } from '../core/lib/layoutContentSpecs'
import { buildAppContext, createRefreshScheduler } from './bootstrap/composition-root'
import { isMurmurE2eMode } from './bootstrap/e2e-overrides'
import { ElectronTrayAdapter } from './infrastructure/tray/ElectronTrayAdapter'

configureAppBranding()

// Disable GPU acceleration globally to allow Electron windows to render reliably inside WorkerW
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

let settingsWindow: BrowserWindow | null = null
const bgWindows = new Map<string, BrowserWindow>()
let isQuitting = false
/** When false in dev, skip restore on electron-vite hot reload (not a real user quit). */
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

function showSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    if (settingsWindow.isMinimized()) {
      settingsWindow.restore()
    }
    settingsWindow.show()
    settingsWindow.focus()
    return
  }

  createSettingsWindow()
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    showSettingsWindow()
    return
  }

  let iconPath: string | undefined
  try {
    iconPath = resolveBrandIconPath()
  } catch {
    iconPath = undefined
  }

  settingsWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    autoHideMenuBar: true,
    show: true,
    resizable: true,
    title: 'Murmur Settings',
    icon: iconPath,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#090d16',
      symbolColor: '#94a3b8',
      height: 40
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    settingsWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    settingsWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  settingsWindow.on('ready-to-show', () => {
    settingsWindow?.show()
  })

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
}

function createBackgroundWindow(screenInfo: { id: string; width: number; height: number }, x: number, y: number) {
  const windowTitle = `Murmur Background - ${screenInfo.id}`
  const bgWindow = new BrowserWindow({
    x,
    y,
    width: screenInfo.width,
    height: screenInfo.height,
    frame: false,
    transparent: true,
    type: process.platform === 'darwin' ? 'desktop' : undefined,
    enableLargerThanScreen: true,
    skipTaskbar: true,
    title: windowTitle,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  bgWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    bgWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}?view=wallpaper&monitorId=${screenInfo.id}`)
  } else {
    bgWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { view: 'wallpaper', monitorId: screenInfo.id }
    })
  }

  bgWindow.once('ready-to-show', async () => {
    bgWindow.show()
    // Force Electron mouse events ignore for click-through support
    bgWindow.setIgnoreMouseEvents(true)

    try {
      if (process.platform === 'win32' && typeof (wallpaperRenderer as { inject?: (h: string) => Promise<void> }).inject === 'function') {
        const hwndBuffer = bgWindow.getNativeWindowHandle()
        const hwndVal =
          process.arch === 'x64'
            ? hwndBuffer.readBigInt64LE(0).toString()
            : hwndBuffer.readInt32LE(0).toString()

        console.log(`Injecting live window for display ${screenInfo.id} (HWND: ${hwndVal}) into WorkerW container...`)
        await (wallpaperRenderer as { inject: (h: string) => Promise<void> }).inject(hwndVal)
      }
    } catch (err) {
      console.error(`Failed to inject window for display ${screenInfo.id} into desktop`, err)
    }
  })

  bgWindows.set(screenInfo.id, bgWindow)
}

function setupIpc() {
  ipcMain.handle(IpcChannel.configGet, () => configStore.get())
  ipcMain.handle(IpcChannel.configSave, async (_event, config) => {
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

    // Manage background window lifecycles based on active animation preference.
    // On macOS the live desktop overlay is required for reliable phrase display; Instant only drops it on Windows.
    const useNativeStaticOnly = newConfig.animation === 'Instant' && process.platform !== 'darwin'
    if (useNativeStaticOnly) {
      bgWindows.forEach((win) => {
        if (!win.isDestroyed()) {
          win.destroy()
        }
      })
      bgWindows.clear()
    } else {
      // Ensure background windows are spawned if turning animation back on
      const screens = await wallpaperRenderer.getScreens()
      const displays = screen.getAllDisplays()
      for (const s of screens) {
        if (!bgWindows.has(s.id)) {
          const display = displays.find((d) => String(d.id) === s.id) || displays[0]
          const bounds = display ? display.bounds : { x: 0, y: 0, width: 1920, height: 1080 }
          createBackgroundWindow({ id: s.id, width: bounds.width, height: bounds.height }, bounds.x, bounds.y)
        }
      }
    }

    // Broadcast live config updates to all background windows
    bgWindows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(IpcChannel.configUpdated, newConfig)
      }
    })
    settingsWindow?.webContents.send(IpcChannel.configUpdated, newConfig)

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
  })

  ipcMain.handle(IpcChannel.historyGet, (_event, monitorId) => historyStore.get(monitorId))
  ipcMain.handle(IpcChannel.historyClear, (_event, monitorId) => historyStore.clear(monitorId))
  ipcMain.handle(IpcChannel.actionRefresh, () =>
    murmurService.refresh({ lastContent: state.lastContent, lastPhrases: state.lastPhrases })
  )
  ipcMain.handle(IpcChannel.actionPreviewTheme, (_event, monitorId, theme) =>
    murmurService.previewTheme(monitorId, theme)
  )
  ipcMain.handle(IpcChannel.stateGet, () => state)
}

function startClockScheduler() {
  // Disabled main process background clock ticker to eliminate the Win32 SetWallpaper screen blinks/flickers.
  // The React clock widget handles UI updates smoothly on screen in Chromium.
}

app.whenReady().then(async () => {
  setupIpc()
  await wallpaperRenderer.backup()

  try {
    const screens = await wallpaperRenderer.getScreens()
    const initialPhrases: Record<string, string> = {}
    const displays = screen.getAllDisplays()

    const configTemp = await configStore.get()
    const shouldSpawnBg = configTemp.animation !== 'Instant' || process.platform === 'darwin'
    const layoutForHistory = configTemp.layoutStyle

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
        createBackgroundWindow({ id: s.id, width: bounds.width, height: bounds.height }, bounds.x, bounds.y)
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
    settingsWindow?.webContents.send(IpcChannel.stateUpdated, state)
    bgWindows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(IpcChannel.stateUpdated, state)
      }
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
