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
  private lastPaintOptions: Record<string, any> = {}

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
        
        // Format titles with source prefix for the generator to enforce mixing sources
        const generatorInputs = sampled.map((item) => `[Source: ${item.source}] ${item.title}`)

        // Generate unique phrase per display
        const phrase = await this.ai.generate(generatorInputs, config.language)
        
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

        this.lastPaintOptions[screen.id] = paintOptions

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

  public async previewTheme(monitorId: string, theme: ThemeName): Promise<void> {
    try {
      const config = await this.configStore.get()
      const activeScreens = await this.renderer.getScreens()
      const targetScreen = activeScreens.find((s) => s.id === monitorId)
      if (!targetScreen) {
        throw new Error(`Monitor with ID ${monitorId} not found`)
      }

      const history = await this.historyStore.get(monitorId)
      const phrase = history[0] || 'surrealism is the quiet hum of the world'

      const paintOptions = {
        phrase,
        theme,
        fontFamily: config.fontFamily,
        animation: config.animation,
        overlays: config.overlays,
        resolution: { width: targetScreen.width, height: targetScreen.height }
      }

      const buffer = await this.painter.paint(paintOptions)
      await this.renderer.set(monitorId, buffer)
    } catch (error) {
      console.error('MurmurService previewTheme failed:', error)
    }
  }

  public async updateClockWallpapers(): Promise<void> {
    try {
      const config = await this.configStore.get()
      if (!config.geminiApiKey || !config.overlays.dateTime) {
        return
      }

      const activeScreens = await this.renderer.getScreens()
      for (const screen of activeScreens) {
        const paintOptions = this.lastPaintOptions[screen.id]
        if (!paintOptions) continue

        const monitorConf = config.monitors.find((m) => m.id === screen.id)
        if (monitorConf && !monitorConf.enabled) {
          continue
        }

        // Update paint options with current default config parameters
        paintOptions.overlays = config.overlays
        paintOptions.fontFamily = config.fontFamily
        paintOptions.animation = config.animation
        
        // Use monitor theme override or default theme
        paintOptions.theme = monitorConf?.themeOverride || config.theme

        const buffer = await this.painter.paint(paintOptions)
        await this.renderer.set(screen.id, buffer)
      }
    } catch (error) {
      console.error('MurmurService updateClockWallpapers failed:', error)
    }
  }
}
