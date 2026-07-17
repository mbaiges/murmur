import { IRssFetcher } from '../ports/IRssFetcher'
import { IPhraseGenerator } from '../ports/IPhraseGenerator'
import { IWallpaperPainter } from '../ports/IWallpaperPainter'
import { IWallpaperRenderer } from '../ports/IWallpaperRenderer'
import { IConfigStore } from '../ports/IConfigStore'
import { IHistoryStore } from '../ports/IHistoryStore'
import { ISystemTray } from '../ports/ISystemTray'
import { sampleHeadlines } from './HeadlineSampler'
import { RssItem, ThemeName } from './types'

export class MurmurService {
  private isRefreshing = false

  constructor(
    private readonly rss: IRssFetcher,
    private readonly ai: IPhraseGenerator,
    private readonly painter: IWallpaperPainter,
    private readonly renderer: IWallpaperRenderer,
    private readonly configStore: IConfigStore,
    private readonly historyStore: IHistoryStore,
    private readonly tray: ISystemTray
  ) {}

  public async refresh(): Promise<void> {
    if (this.isRefreshing) {
      console.warn('MurmurService: Refresh already in progress. Bypassing concurrent request.')
      return
    }
    this.isRefreshing = true

    try {
      const config = await this.configStore.get()
      if (!config.geminiApiKey) {
        console.warn('MurmurService: No API key configured.')
        this.tray.updateState({
          isPaused: false,
          lastRefreshTime: new Date().toLocaleTimeString(),
          lastPhrases: {}
        })
        return
      }

      // 1. Fetch RSS items
      const rssItems = await this.rss.fetchAll(config.feeds)
      if (rssItems.length === 0) {
        console.warn('MurmurService: No RSS items found.')
        return
      }

      // 2. Discover active monitors
      const activeScreens = await this.renderer.getScreens()
      const lastPhrases: Record<string, string> = {}

      // 3. For each active screen, generate and set wallpaper if enabled
      for (const screen of activeScreens) {
        // Find if this monitor is disabled in configuration
        const monitorConf = config.monitors.find((m) => m.id === screen.id)
        if (monitorConf && !monitorConf.enabled) {
          continue
        }

        // Sample headlines for this screen (different shuffle per screen!)
        const sampled = sampleHeadlines(rssItems, config.headlineSampleSize)
        const titles = sampled.map((item) => item.title)

        // Generate unique phrase per display
        const phrase = await this.ai.generate(titles, config.language)
        
        // Theme overrides per monitor
        const theme = monitorConf?.themeOverride || config.theme

        // Paint PNG
        const paintOptions = {
          phrase,
          theme,
          fontFamily: config.fontFamily,
          animation: config.animation,
          overlays: config.overlays,
          resolution: { width: screen.width, height: screen.height },
          headlines: config.overlays.inspiringHeadlines ? titles.slice(0, 5) : [],
          sources: config.overlays.sourceCredit ? Array.from(new Set(sampled.map((item) => item.source))) : []
        }

        const buffer = await this.painter.paint(paintOptions)

        // Set background
        await this.renderer.set(screen.id, buffer)

        // Record history
        await this.historyStore.save(screen.id, phrase)

        lastPhrases[screen.id] = phrase
      }

      // 4. Update Tray
      this.tray.updateState({
        isPaused: false,
        lastRefreshTime: new Date().toLocaleTimeString(),
        lastPhrases
      })
    } catch (error) {
      console.error('MurmurService refresh failed:', error)
    } finally {
      this.isRefreshing = false
    }
  }
}
