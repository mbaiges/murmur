import { app } from 'electron'
import { join } from 'path'
import { JsonConfigStoreAdapter } from '../infrastructure/config/JsonConfigStoreAdapter'
import { JsonHistoryStoreAdapter } from '../infrastructure/history/JsonHistoryStoreAdapter'
import { NodeCanvasWallpaperPainterAdapter } from '../infrastructure/canvas/NodeCanvasWallpaperPainterAdapter'
import { ElectronTrayAdapter } from '../infrastructure/tray/ElectronTrayAdapter'
import { WinStartupAdapter } from '../infrastructure/startup/WinStartupAdapter'
import { MacStartupAdapter } from '../infrastructure/startup/MacStartupAdapter'
import { FastXmlRssRepository } from '../infrastructure/rss/FastXmlRssRepository'
import { GeminiPhraseRepository } from '../infrastructure/gemini/GeminiPhraseRepository'
import { CloudflareFluxBackgroundImageRepository } from '../infrastructure/cloudflare/CloudflareFluxBackgroundImageRepository'
import { FsBackgroundAssetStoreAdapter } from '../infrastructure/background/FsBackgroundAssetStoreAdapter'
import { WinDesktopWallpaperAdapter } from '../infrastructure/wallpaper/WinDesktopWallpaperAdapter'
import { MacDesktopWallpaperAdapter } from '../infrastructure/wallpaper/MacDesktopWallpaperAdapter'
import { MurmurService } from '../../core/domain/MurmurService'
import { Scheduler } from '../../core/domain/Scheduler'
import { MurmurState } from '../../core/domain/types'
import { IConfigStore } from '../../core/ports/IConfigStore'
import { IHistoryStore } from '../../core/ports/IHistoryStore'
import { IPhraseRepository } from '../../core/ports/IPhraseRepository'
import { ILlmRepository } from '../../core/ports/ILlmRepository'
import { IRssRepository } from '../../core/ports/IRssRepository'
import { IStartupIntegration } from '../../core/ports/IStartupIntegration'
import { ISystemTray } from '../../core/ports/ISystemTray'
import { IWallpaperPainter } from '../../core/ports/IWallpaperPainter'
import { IWallpaperRenderer } from '../../core/ports/IWallpaperRenderer'
import { IBackgroundImageRepository } from '../../core/ports/IBackgroundImageRepository'
import { IBackgroundAssetStore } from '../../core/ports/IBackgroundAssetStore'
import { createE2eRuntimeAdapters, isMurmurE2eMode } from './e2e-overrides'

export type AppContext = {
  configStore: IConfigStore
  historyStore: IHistoryStore
  wallpaperPainter: IWallpaperPainter
  trayAdapter: ISystemTray
  startupAdapter: IStartupIntegration
  rssRepository: IRssRepository
  phraseRepository: IPhraseRepository
  llmRepository: ILlmRepository
  wallpaperRenderer: IWallpaperRenderer
  backgroundAssetStore: IBackgroundAssetStore
  backgroundImageRepository: IBackgroundImageRepository
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
  const backgroundAssetStore = new FsBackgroundAssetStoreAdapter(
    join(app.getPath('userData'), 'backgrounds')
  )

  let rssRepository: IRssRepository
  let phraseRepository: IPhraseRepository
  let llmRepository: ILlmRepository
  let wallpaperRenderer: IWallpaperRenderer
  let backgroundImageRepository: IBackgroundImageRepository

  if (isMurmurE2eMode()) {
    const e2e = createE2eRuntimeAdapters()
    rssRepository = e2e.rssRepository
    phraseRepository = e2e.phraseRepository
    llmRepository = e2e.llmRepository
    wallpaperRenderer = e2e.wallpaperRenderer
    backgroundImageRepository = e2e.backgroundImageRepository
  } else {
    rssRepository = new FastXmlRssRepository()
    const gemini = new GeminiPhraseRepository(configStore)
    phraseRepository = gemini
    llmRepository = gemini
    wallpaperRenderer = createWallpaperRenderer()
    backgroundImageRepository = new CloudflareFluxBackgroundImageRepository(configStore)
  }

  const murmurService = new MurmurService(
    rssRepository,
    phraseRepository,
    llmRepository,
    wallpaperPainter,
    wallpaperRenderer,
    configStore,
    historyStore,
    trayAdapter,
    backgroundImageRepository,
    backgroundAssetStore
  )

  return {
    configStore,
    historyStore,
    wallpaperPainter,
    trayAdapter,
    startupAdapter,
    rssRepository,
    phraseRepository,
    llmRepository,
    wallpaperRenderer,
    backgroundAssetStore,
    backgroundImageRepository,
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
