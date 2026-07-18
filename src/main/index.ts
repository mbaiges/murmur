import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { FastXmlRssFetcherAdapter } from '../adapters/rss/FastXmlRssFetcherAdapter'
import { GeminiPhraseGeneratorAdapter } from '../adapters/gemini/GeminiPhraseGeneratorAdapter'
import { NodeCanvasWallpaperPainterAdapter } from '../adapters/canvas/NodeCanvasWallpaperPainterAdapter'
import { WinDesktopWallpaperAdapter } from '../adapters/wallpaper/WinDesktopWallpaperAdapter'
import { JsonConfigStoreAdapter } from '../adapters/config/JsonConfigStoreAdapter'
import { JsonHistoryStoreAdapter } from '../adapters/history/JsonHistoryStoreAdapter'
import { ElectronTrayAdapter } from '../adapters/tray/ElectronTrayAdapter'
import { WinStartupAdapter } from '../adapters/startup/WinStartupAdapter'
import { MurmurService } from '../domain/MurmurService'
import { Scheduler } from '../domain/Scheduler'
import { MurmurState } from '../domain/types'
import { IRssFetcher } from '../ports/IRssFetcher'
import { IPhraseGenerator } from '../ports/IPhraseGenerator'
import { IWallpaperRenderer } from '../ports/IWallpaperRenderer'

let settingsWindow: BrowserWindow | null = null
const bgWindows = new Map<string, BrowserWindow>()
let isQuitting = false

let state: MurmurState = {
  isPaused: false,
  lastRefreshTime: undefined,
  lastPhrases: {}
}

const configStore = new JsonConfigStoreAdapter()
const historyStore = new JsonHistoryStoreAdapter()
const wallpaperPainter = new NodeCanvasWallpaperPainterAdapter()
const trayAdapter = new ElectronTrayAdapter()
const startupAdapter = new WinStartupAdapter()

let rssFetcher: IRssFetcher
let phraseGenerator: IPhraseGenerator
let wallpaperRenderer: IWallpaperRenderer

if (process.env.MURMUR_E2E === 'true') {
  console.log('MURMUR: Running in Playwright E2E Mode with stubs')
  rssFetcher = {
    fetchAll: async () => [
      { title: 'Stub Headline 1', source: 'Stub Source', feedUrl: 'http://stub.com' },
      { title: 'Stub Headline 2', source: 'Stub Source', feedUrl: 'http://stub.com' }
    ]
  }
  phraseGenerator = {
    generate: async () => 'stubbed surreal phrase'
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
  wallpaperRenderer = new WinDesktopWallpaperAdapter()
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

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus()
    return
  }

  const iconPath = existsSync(join(__dirname, '../../resources/icon.png'))
    ? join(__dirname, '../../resources/icon.png')
    : join(__dirname, '../../../resources/icon.png')

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
    enableLargerThanScreen: true,
    skipTaskbar: true,
    type: 'desktop',
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
      if (typeof wallpaperRenderer.inject === 'function') {
        console.log(`Injecting live window for display ${screenInfo.id} into WorkerW container...`)
        await wallpaperRenderer.inject(windowTitle)
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

    // Broadcast live config updates to all background windows
    bgWindows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send('config:updated', newConfig)
      }
    })
    settingsWindow?.webContents.send('config:updated', newConfig)

    if (newConfig.geminiApiKey) {
      await murmurService.updateClockWallpapers()
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
  const tickClock = async () => {
    if (!state.isPaused) {
      await murmurService.updateClockWallpapers()
    }
  }

  const now = new Date()
  const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
  
  setTimeout(() => {
    tickClock()
    setInterval(tickClock, 60 * 1000)
  }, msUntilNextMinute)
}

app.whenReady().then(async () => {
  setupIpc()
  await wallpaperRenderer.backup()

  try {
    const screens = await wallpaperRenderer.getScreens()
    const initialPhrases: Record<string, string> = {}
    const displays = screen.getAllDisplays()

    for (const s of screens) {
      initialPhrases[s.id] = ''
      const display = displays.find((d) => String(d.id) === s.id) || displays[0]
      const bounds = display ? display.bounds : { x: 0, y: 0, width: 1920, height: 1080 }
      
      // Expand bounds slightly to prevent visual gaps at edges from rounding/scaling errors
      const expandedX = bounds.x - 4
      const expandedY = bounds.y - 4
      const expandedWidth = bounds.width + 8
      const expandedHeight = bounds.height + 8

      createBackgroundWindow({ id: s.id, width: expandedWidth, height: expandedHeight }, expandedX, expandedY)
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
      createSettingsWindow()
    }
  )

  if (config.geminiApiKey || process.env.MURMUR_E2E === 'true') {
    scheduler.start(config.refreshIntervalMinutes)
  }
  
  startClockScheduler()

  if (!app.isPackaged || !config.geminiApiKey || process.env.MURMUR_E2E === 'true') {
    createSettingsWindow()
  }
})

app.on('window-all-closed', () => {
  // running in tray
})

app.on('before-quit', async (event) => {
  if (!isQuitting) {
    event.preventDefault()
    isQuitting = true
    try {
      console.log('Restoring original wallpapers before quit...')
      await wallpaperRenderer.restore()
    } catch (err) {
      console.error('Failed to restore wallpapers on quit:', err)
    } finally {
      app.exit(0)
    }
  }
})
