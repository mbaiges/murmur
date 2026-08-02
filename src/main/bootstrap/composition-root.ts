import { JsonConfigStoreAdapter } from '../infrastructure/config/JsonConfigStoreAdapter'
import { JsonHistoryStoreAdapter } from '../infrastructure/history/JsonHistoryStoreAdapter'
import { NodeCanvasWallpaperPainterAdapter } from '../infrastructure/canvas/NodeCanvasWallpaperPainterAdapter'
import { ElectronTrayAdapter } from '../infrastructure/tray/ElectronTrayAdapter'
import { WinStartupAdapter } from '../infrastructure/startup/WinStartupAdapter'
import { MacStartupAdapter } from '../infrastructure/startup/MacStartupAdapter'
import { FastXmlRssFetcherAdapter } from '../infrastructure/rss/FastXmlRssFetcherAdapter'
import { GeminiPhraseGeneratorAdapter } from '../infrastructure/gemini/GeminiPhraseGeneratorAdapter'
import { WinDesktopWallpaperAdapter } from '../infrastructure/wallpaper/WinDesktopWallpaperAdapter'
import { MacDesktopWallpaperAdapter } from '../infrastructure/wallpaper/MacDesktopWallpaperAdapter'
import { MurmurService } from '../../core/domain/MurmurService'
import { Scheduler } from '../../core/domain/Scheduler'
import { MurmurState } from '../../core/domain/types'
import { IConfigStore } from '../../core/ports/IConfigStore'
import { IHistoryStore } from '../../core/ports/IHistoryStore'
import { IPhraseGenerator } from '../../core/ports/IPhraseGenerator'
import { IRssFetcher } from '../../core/ports/IRssFetcher'
import { IStartupIntegration } from '../../core/ports/IStartupIntegration'
import { ISystemTray } from '../../core/ports/ISystemTray'
import { IWallpaperPainter } from '../../core/ports/IWallpaperPainter'
import { IWallpaperRenderer } from '../../core/ports/IWallpaperRenderer'
import { createE2eRuntimeAdapters, isMurmurE2eMode } from './e2e-overrides'

export type AppContext = {
  configStore: IConfigStore
  historyStore: IHistoryStore
  wallpaperPainter: IWallpaperPainter
  trayAdapter: ISystemTray
  startupAdapter: IStartupIntegration
  rssFetcher: IRssFetcher
  phraseGenerator: IPhraseGenerator
  wallpaperRenderer: IWallpaperRenderer
  murmurService: MurmurService
}

function createStartupAdapter(): IStartupIntegration {
  if (process.platform === 'win32') {
    return new WinStartupAdapter()
  }
  if (process.platform === 'darwin') {
    return new MacStartupAdapter()
  }
  return {
    enable: async () => {},
    disable: async () => {},
    isEnabled: async () => false
  }
}

function createWallpaperRenderer(): IWallpaperRenderer {
  if (process.platform === 'win32') {
    return new WinDesktopWallpaperAdapter()
  }
  if (process.platform === 'darwin') {
    return new MacDesktopWallpaperAdapter()
  }
  return {
    getScreens: async () => [{ id: 'mock', width: 1920, height: 1080 }],
    set: async () => {},
    backup: async () => {},
    restore: async () => {}
  }
}

export function buildAppContext(): AppContext {
  const configStore = new JsonConfigStoreAdapter()
  const historyStore = new JsonHistoryStoreAdapter()
  const wallpaperPainter = new NodeCanvasWallpaperPainterAdapter()
  const trayAdapter = new ElectronTrayAdapter()
  const startupAdapter = createStartupAdapter()

  let rssFetcher: IRssFetcher
  let phraseGenerator: IPhraseGenerator
  let wallpaperRenderer: IWallpaperRenderer

  if (isMurmurE2eMode()) {
    const e2e = createE2eRuntimeAdapters()
    rssFetcher = e2e.rssFetcher
    phraseGenerator = e2e.phraseGenerator
    wallpaperRenderer = e2e.wallpaperRenderer
  } else {
    rssFetcher = new FastXmlRssFetcherAdapter()
    phraseGenerator = new GeminiPhraseGeneratorAdapter(configStore)
    wallpaperRenderer = createWallpaperRenderer()
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

  return {
    configStore,
    historyStore,
    wallpaperPainter,
    trayAdapter,
    startupAdapter,
    rssFetcher,
    phraseGenerator,
    wallpaperRenderer,
    murmurService
  }
}

export function createRefreshScheduler(
  murmurService: MurmurService,
  options: {
    isPaused: () => boolean
    getLastContent: () => MurmurState['lastContent']
    getLastPhrases: () => MurmurState['lastPhrases']
  }
): Scheduler {
  return new Scheduler(async () => {
    if (options.isPaused()) return
    await murmurService.refresh({
      lastContent: options.getLastContent(),
      lastPhrases: options.getLastPhrases()
    })
  })
}
