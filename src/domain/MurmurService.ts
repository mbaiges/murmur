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
      const lastHeadlines: Record<string, string[]> = {}
      const lastSources: Record<string, string[]> = {}

      // 3. For each active screen, generate and set wallpaper if enabled
      for (const screen of activeScreens) {
        // Find if this monitor is disabled in configuration
        const monitorConf = config.monitors.find((m) => m.id === screen.id)
        if (monitorConf && !monitorConf.enabled) {
          continue
        }

        // Sample headlines for this screen
        const sampled = sampleHeadlines(rssItems, config.headlineSampleSize)
        
        // Format titles with source prefix for the generator to enforce mixing sources
        const generatorInputs = sampled.map((item) => `[Source: ${item.source}] ${item.title}`)

        // Generate unique phrase per display
        const phrase = await this.ai.generate(generatorInputs, config.language)
        lastPhrases[screen.id] = phrase
        lastHeadlines[screen.id] = sampled.map((item) => item.title)
        lastSources[screen.id] = Array.from(new Set(sampled.map((item) => item.source)))

        // Save to history log
        await this.historyStore.save(screen.id, phrase)

        const theme = monitorConf?.themeOverride || config.theme
        const isStaticMode = config.animation === 'Instant'
        
        // If static mode is active, bake the phrase text and overlays directly onto the native desktop wallpaper
        const staticOptions = {
          phrase: isStaticMode ? phrase : '',
          theme,
          fontFamily: config.fontFamily,
          animation: 'Instant' as any,
          overlays: isStaticMode ? config.overlays : { dateTime: false, sourceCredit: false, inspiringHeadlines: false },
          resolution: { width: screen.width, height: screen.height },
          textAlignment: config.textAlignment,
          layoutStyle: config.layoutStyle,
          vignetteStyle: config.vignetteStyle,
          audioFeedback: false,
          headlines: isStaticMode ? sampled.map(item => item.title) : undefined,
          sources: isStaticMode ? Array.from(new Set(sampled.map(i => i.source))) : undefined
        }
        const buffer = await this.painter.paint(staticOptions)
        await this.renderer.set(screen.id, buffer)
      }

      // 4. Update Tray
      this.tray.updateState({
        isPaused: false,
        lastRefreshTime: new Date().toLocaleTimeString(),
        lastPhrases,
        lastHeadlines,
        lastSources
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

      // Paint static theme underlay for preview
      const staticOptions = {
        phrase: '',
        theme,
        fontFamily: config.fontFamily,
        animation: 'Instant' as any,
        overlays: { dateTime: false, sourceCredit: false, inspiringHeadlines: false },
        resolution: { width: targetScreen.width, height: targetScreen.height },
        textAlignment: config.textAlignment,
        layoutStyle: config.layoutStyle,
        vignetteStyle: config.vignetteStyle,
        audioFeedback: false
      }
      const buffer = await this.painter.paint(staticOptions)
      await this.renderer.set(monitorId, buffer)
    } catch (error) {
      console.error('MurmurService previewTheme failed:', error)
    }
  }

  public async updateClockWallpapers(state: any): Promise<void> {
    try {
      const config = await this.configStore.get()
      if (!config.geminiApiKey) {
        return
      }

      const activeScreens = await this.renderer.getScreens()
      for (const screen of activeScreens) {
        const monitorConf = config.monitors.find((m) => m.id === screen.id)
        if (monitorConf && !monitorConf.enabled) {
          continue
        }

        const theme = monitorConf?.themeOverride || config.theme
        const isStaticMode = config.animation === 'Instant'
        const phrase = isStaticMode ? (state.lastPhrases?.[screen.id] || '') : ''

        const staticOptions = {
          phrase,
          theme,
          fontFamily: config.fontFamily,
          animation: 'Instant' as any,
          overlays: isStaticMode ? config.overlays : { dateTime: false, sourceCredit: false, inspiringHeadlines: false },
          resolution: { width: screen.width, height: screen.height },
          textAlignment: config.textAlignment,
          layoutStyle: config.layoutStyle,
          vignetteStyle: config.vignetteStyle,
          audioFeedback: false,
          headlines: isStaticMode ? (state.lastHeadlines?.[screen.id] || []) : undefined,
          sources: isStaticMode ? (state.lastSources?.[screen.id] || []) : undefined
        }

        const buffer = await this.painter.paint(staticOptions)
        await this.renderer.set(screen.id, buffer)
      }
    } catch (error) {
      console.error('MurmurService updateClockWallpapers failed:', error)
    }
  }
}
