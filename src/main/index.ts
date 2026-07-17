import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
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

let settingsWindow: BrowserWindow | null = null
let state: MurmurState = {
  isPaused: false,
  lastRefreshTime: undefined,
  lastPhrases: {}
}

const configStore = new JsonConfigStoreAdapter()
const historyStore = new JsonHistoryStoreAdapter()
const rssFetcher = new FastXmlRssFetcherAdapter()
const phraseGenerator = new GeminiPhraseGeneratorAdapter(configStore)
const wallpaperPainter = new NodeCanvasWallpaperPainterAdapter()
const wallpaperRenderer = new WinDesktopWallpaperAdapter()
const trayAdapter = new ElectronTrayAdapter()
const startupAdapter = new WinStartupAdapter()

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

  settingsWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    },
    autoHideMenuBar: true,
    show: false,
    resizable: true,
    title: 'Murmur Settings'
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
  })

  ipcMain.handle('history:get', (_event, monitorId) => historyStore.get(monitorId))
  ipcMain.handle('history:clear', (_event, monitorId) => historyStore.clear(monitorId))
  ipcMain.handle('action:refresh', () => murmurService.refresh())
  ipcMain.handle('action:previewTheme', (_event, monitorId, theme) =>
    murmurService.previewTheme(monitorId, theme)
  )
  ipcMain.handle('state:get', () => state)
}

app.whenReady().then(async () => {
  setupIpc()
  await wallpaperRenderer.backup()

  const config = await configStore.get()
  
  const customTrayAdapterUpdate = trayAdapter.updateState.bind(trayAdapter)
  trayAdapter.updateState = (newState: MurmurState) => {
    state = { ...state, ...newState }
    customTrayAdapterUpdate(state)
    settingsWindow?.webContents.send('state:updated', state)
  }

  trayAdapter.init(
    async () => {
      await murmurService.refresh()
    },
    () => {
      createSettingsWindow()
    }
  )

  if (config.geminiApiKey) {
    scheduler.start(config.refreshIntervalMinutes)
  } else {
    createSettingsWindow()
  }
})

app.on('window-all-closed', () => {
  // running in tray
})

app.on('will-quit', async (event) => {
  event.preventDefault()
  scheduler.stop()
  try {
    await wallpaperRenderer.restore()
  } catch (err) {
    console.error('Failed to restore wallpaper on exit:', err)
  } finally {
    app.exit(0)
  }
})
