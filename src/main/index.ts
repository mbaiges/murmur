import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { configureAppBranding } from './configureAppBranding'
import { resolveBrandIconPath } from '../shared/resolveBrandIcon'
import { shouldRegeneratePhraseAfterConfigSave } from '../shared/appearanceRegenerate'
import { existsSync, readFileSync } from 'fs'
import { FastXmlRssFetcherAdapter } from '../adapters/rss/FastXmlRssFetcherAdapter'
import { GeminiPhraseGeneratorAdapter } from '../adapters/gemini/GeminiPhraseGeneratorAdapter'
import { NodeCanvasWallpaperPainterAdapter } from '../adapters/canvas/NodeCanvasWallpaperPainterAdapter'
import { WinDesktopWallpaperAdapter } from '../adapters/wallpaper/WinDesktopWallpaperAdapter'
import { MacDesktopWallpaperAdapter } from '../adapters/wallpaper/MacDesktopWallpaperAdapter'
import { JsonConfigStoreAdapter } from '../adapters/config/JsonConfigStoreAdapter'
import { JsonHistoryStoreAdapter } from '../adapters/history/JsonHistoryStoreAdapter'
import { ElectronTrayAdapter } from '../adapters/tray/ElectronTrayAdapter'
import { WinStartupAdapter } from '../adapters/startup/WinStartupAdapter'
import { MacStartupAdapter } from '../adapters/startup/MacStartupAdapter'
import { MurmurService } from '../domain/MurmurService'
import { Scheduler } from '../domain/Scheduler'
import { MurmurState } from '../domain/types'
import { IRssFetcher } from '../ports/IRssFetcher'
import { IStartupIntegration } from '../ports/IStartupIntegration'

configureAppBranding()

// Disable GPU acceleration globally to allow Electron windows to render reliably inside WorkerW
app.disableHardwareAcceleration()
import { IPhraseGenerator } from '../ports/IPhraseGenerator'
import { IWallpaperRenderer } from '../ports/IWallpaperRenderer'

let settingsWindow: BrowserWindow | null = null
const bgWindows = new Map<string, BrowserWindow>()
let isQuitting = false
/** When false in dev, skip restore on electron-vite hot reload (not a real user quit). */
let userRequestedWallpaperRestore = false

let state: MurmurState = {
  isPaused: false,
  lastRefreshTime: undefined,
  lastPhrases: {},
  lastHeadlines: {},
  lastSources: {}
}

const configStore = new JsonConfigStoreAdapter()
const historyStore = new JsonHistoryStoreAdapter()
const wallpaperPainter = new NodeCanvasWallpaperPainterAdapter()
const trayAdapter = new ElectronTrayAdapter()

let startupAdapter: IStartupIntegration
if (process.platform === 'win32') {
  startupAdapter = new WinStartupAdapter()
} else if (process.platform === 'darwin') {
  startupAdapter = new MacStartupAdapter()
} else {
  startupAdapter = {
    enable: async () => {},
    disable: async () => {},
    isEnabled: async () => false
  }
}

let rssFetcher: IRssFetcher
let phraseGenerator: IPhraseGenerator
let wallpaperRenderer: IWallpaperRenderer

function loadE2eFixturePhrase(): string | null {
  const fixturePath =
    process.env.MURMUR_E2E_FIXTURE_PHRASE_PATH ||
    join(process.cwd(), 'tests/e2e/fixtures/captured-phrase.json')
  if (!existsSync(fixturePath)) {
    return null
  }
  try {
    const parsed = JSON.parse(readFileSync(fixturePath, 'utf8')) as { phrase?: string }
    return parsed.phrase?.trim() || null
  } catch {
    return null
  }
}

if (process.env.MURMUR_E2E === 'true') {
  const fixturePhrase = loadE2eFixturePhrase()
  console.log(
    fixturePhrase
      ? 'MURMUR: E2E mode with captured fixture phrase (no live Gemini on layout changes)'
      : 'MURMUR: Running in Playwright E2E Mode with stubs'
  )
  rssFetcher = {
    fetchAll: async () => [
      { title: 'Stub Headline 1', source: 'Stub Source', feedUrl: 'http://stub.com' },
      { title: 'Stub Headline 2', source: 'Stub Source', feedUrl: 'http://stub.com' }
    ]
  }
  phraseGenerator = {
    generate: async () => fixturePhrase || 'stubbed surreal phrase'
  }
  wallpaperRenderer = {
    getScreens: async () => [{ id: 'stub-monitor', width: 800, height: 600 }],
    set: async () => {},
    backup: async () => {},
    restore: async () => {}
  }
} else {
  rssFetcher = new FastXmlRssFetcherAdapter()
  phraseGenerator = new GeminiPhraseGeneratorAdapter(configStore)
  if (process.platform === 'win32') {
    wallpaperRenderer = new WinDesktopWallpaperAdapter()
  } else if (process.platform === 'darwin') {
    wallpaperRenderer = new MacDesktopWallpaperAdapter()
  } else {
    wallpaperRenderer = {
      getScreens: async () => [{ id: 'mock', width: 1920, height: 1080 }],
      set: async () => {},
      backup: async () => {},
      restore: async () => {}
    }
  }
}

const murmurService = new MurmurService(
  rssFetcher,
  phraseGenerator,
  wallpaperPainter,
  wallpaperRenderer,
  configStore,
  historyStore,
  trayAdapter
)

const scheduler = new Scheduler(async () => {
  if (state.isPaused) return
  await murmurService.refresh()
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
      if (process.platform === 'win32' && typeof (wallpaperRenderer as any).inject === 'function') {
        const hwndBuffer = bgWindow.getNativeWindowHandle()
        const hwndVal = process.arch === 'x64'
          ? hwndBuffer.readBigInt64LE(0).toString()
          : hwndBuffer.readInt32LE(0).toString()

        console.log(`Injecting live window for display ${screenInfo.id} (HWND: ${hwndVal}) into WorkerW container...`)
        await (wallpaperRenderer as any).inject(hwndVal)
      }
    } catch (err) {
      console.error(`Failed to inject window for display ${screenInfo.id} into desktop`, err)
    }
  })

  bgWindows.set(screenInfo.id, bgWindow)
}

function setupIpc() {
  ipcMain.handle('config:get', () => configStore.get())
  ipcMain.handle('config:save', async (_event, config) => {
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
        win.webContents.send('config:updated', newConfig)
      }
    })
    settingsWindow?.webContents.send('config:updated', newConfig)

    if (newConfig.geminiApiKey) {
      const appearanceChanged = shouldRegeneratePhraseAfterConfigSave(prevConfig, newConfig)
      const hasCachedPhrase = Object.values(state.lastPhrases || {}).some((p) => p && p.trim())
      if (newConfig.animation === 'Instant' && hasCachedPhrase) {
        await murmurService.updateClockWallpapers(state)
      }
      if (appearanceChanged) {
        await murmurService.refresh()
      } else if (newConfig.animation !== 'Instant') {
        await murmurService.updateClockWallpapers(state)
      }
    }
  })

  ipcMain.handle('history:get', (_event, monitorId) => historyStore.get(monitorId))
  ipcMain.handle('history:clear', (_event, monitorId) => historyStore.clear(monitorId))
  ipcMain.handle('action:refresh', () => murmurService.refresh())
  ipcMain.handle('action:previewTheme', (_event, monitorId, theme) =>
    murmurService.previewTheme(monitorId, theme)
  )
  ipcMain.handle('state:get', () => state)
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

    for (const s of screens) {
      const history = await historyStore.get(s.id)
      initialPhrases[s.id] = history[0] || ''
      if (shouldSpawnBg) {
        const display = displays.find((d) => String(d.id) === s.id) || displays[0]
        const bounds = display ? display.bounds : { x: 0, y: 0, width: 1920, height: 1080 }
        createBackgroundWindow({ id: s.id, width: bounds.width, height: bounds.height }, bounds.x, bounds.y)
      }
    }
    state = {
      ...state,
      lastPhrases: initialPhrases
    }
  } catch (err) {
    console.error('Failed to pre-initialize active screens and background windows', err)
  }

  const config = await configStore.get()
  
  const customTrayAdapterUpdate = trayAdapter.updateState.bind(trayAdapter)
  trayAdapter.updateState = (newState: MurmurState) => {
    state = { ...state, ...newState }
    customTrayAdapterUpdate(state)
    settingsWindow?.webContents.send('state:updated', state)
    bgWindows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send('state:updated', state)
      }
    })
  }

  trayAdapter.init(
    async () => {
      await murmurService.refresh()
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

  if (config.geminiApiKey || process.env.MURMUR_E2E === 'true') {
    scheduler.start(config.refreshIntervalMinutes)
  }
  
  startClockScheduler()

  if (!app.isPackaged || !config.geminiApiKey || process.env.MURMUR_E2E === 'true') {
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
        process.env.MURMUR_E2E !== 'true' &&
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
