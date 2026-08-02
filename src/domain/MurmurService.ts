import { IRssFetcher } from '../ports/IRssFetcher'
import { IPhraseGenerator } from '../ports/IPhraseGenerator'
import { IWallpaperPainter } from '../ports/IWallpaperPainter'
import { IWallpaperRenderer } from '../ports/IWallpaperRenderer'
import { IConfigStore } from '../ports/IConfigStore'
import { IHistoryStore } from '../ports/IHistoryStore'
import { ISystemTray } from '../ports/ISystemTray'
import { sampleHeadlines } from './HeadlineSampler'
import { LayoutContentEnvelope, MurmurState, ThemeName } from './types'
import { getLayoutContentSpec } from '../shared/layoutContentSpecs'
import { payloadToPlainSummary } from '../shared/payloadToPlainSummary'

export type MurmurRefreshContext = Pick<MurmurState, 'lastContent' | 'lastPhrases'>

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

  public async refresh(previous?: MurmurRefreshContext): Promise<void> {
    if (this.isRefreshing) {
      console.warn('MurmurService: Refresh already in progress. Bypassing concurrent request.')
      return
    }
    this.isRefreshing = true

    const prevContent = previous?.lastContent ?? {}
    const prevPhrases = previous?.lastPhrases ?? {}
    const lastPhrases: Record<string, string> = { ...prevPhrases }
    const lastContent: Record<string, LayoutContentEnvelope> = { ...prevContent }
    let lastGenerationError: string | undefined
    let anySuccess = false

    try {
      const config = await this.configStore.get()
      if (!config.geminiApiKey) {
        console.warn('MurmurService: No API key configured.')
        this.tray.updateState({
          isPaused: false,
          lastRefreshTime: new Date().toLocaleTimeString(),
          lastPhrases: {},
          lastContent: {}
        })
        return
      }

      const rssItems = await this.rss.fetchAll(config.feeds)
      if (rssItems.length === 0) {
        console.warn('MurmurService: No RSS items found.')
        return
      }

      const activeScreens = await this.renderer.getScreens()
      const lastHeadlines: Record<string, string[]> = {}
      const lastSources: Record<string, string[]> = {}
      const contentSpec = getLayoutContentSpec(config.layoutStyle)

      for (const screen of activeScreens) {
        const monitorConf = config.monitors.find((m) => m.id === screen.id)
        if (monitorConf && !monitorConf.enabled) {
          continue
        }

        const sampled = sampleHeadlines(rssItems, config.headlineSampleSize)
        const generatorInputs = sampled.map((item) => `[Source: ${item.source}] ${item.title}`)

        try {
          const result = await this.ai.generateStructured({
            headlines: generatorInputs,
            language: config.language,
            systemPrompt: config.systemPrompt,
            contentSpec,
            formatFlags: {
              enableBold: config.enableBold,
              enableItalic: config.enableItalic,
              enableNewlines: config.enableNewlines,
              enableDifferentFonts: config.enableDifferentFonts
            }
          })

          const envelope: LayoutContentEnvelope = {
            schemaId: result.schemaId,
            layoutStyle: result.layoutStyle,
            payload: result.payload
          }
          const summary = payloadToPlainSummary(contentSpec, result.payload)

          lastContent[screen.id] = envelope
          lastPhrases[screen.id] = summary
          lastHeadlines[screen.id] = sampled.map((item) => item.title)
          lastSources[screen.id] = Array.from(new Set(sampled.map((item) => item.source)))
          anySuccess = true

          await this.historyStore.save(screen.id, result.rawJson)

          const theme = monitorConf?.themeOverride || config.theme
          const isStaticMode = config.animation === 'Instant'
          const phraseForPaint = result.payload.phrase ?? summary

          const staticOptions = {
            phrase: isStaticMode ? phraseForPaint : '',
            layoutContent: envelope,
            theme,
            fontFamily: config.fontFamily,
            animation: 'Instant' as const,
            overlays: isStaticMode ? config.overlays : { dateTime: false, sourceCredit: false, inspiringHeadlines: false },
            resolution: { width: screen.width, height: screen.height },
            textAlignment: config.textAlignment,
            layoutStyle: config.layoutStyle,
            vignetteStyle: config.vignetteStyle,
            noiseIntensity: config.noiseIntensity,
            audioFeedback: false,
            enableBold: config.enableBold,
            enableItalic: config.enableItalic,
            enableNewlines: config.enableNewlines,
            enableDifferentFonts: config.enableDifferentFonts,
            headlines: isStaticMode ? sampled.map((item) => item.title) : undefined,
            sources: isStaticMode ? Array.from(new Set(sampled.map((i) => i.source))) : undefined
          }
          const buffer = await this.painter.paint(staticOptions)
          await this.renderer.set(screen.id, buffer)
        } catch (error) {
          console.error(`MurmurService: Generation failed for ${screen.id}`, error)
          lastGenerationError = 'Latest phrase generation failed. Showing your last successful content.'
          lastContent[screen.id] = prevContent[screen.id] ?? lastContent[screen.id]
          lastPhrases[screen.id] = prevPhrases[screen.id] ?? lastPhrases[screen.id]
        }
      }

      this.tray.updateState({
        isPaused: false,
        lastRefreshTime: new Date().toLocaleTimeString(),
        lastPhrases,
        lastContent,
        lastHeadlines,
        lastSources,
        lastGenerationError: anySuccess ? undefined : lastGenerationError
      })
    } catch (error) {
      console.error('MurmurService refresh failed:', error)
      this.tray.updateState({
        isPaused: false,
        lastRefreshTime: new Date().toLocaleTimeString(),
        lastPhrases,
        lastContent,
        lastGenerationError: 'Refresh failed. Showing your last successful content.'
      })
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

      const staticOptions = {
        phrase: '',
        theme,
        fontFamily: config.fontFamily,
        animation: 'Instant' as const,
        overlays: { dateTime: false, sourceCredit: false, inspiringHeadlines: false },
        resolution: { width: targetScreen.width, height: targetScreen.height },
        textAlignment: config.textAlignment,
        layoutStyle: config.layoutStyle,
        vignetteStyle: config.vignetteStyle,
        noiseIntensity: config.noiseIntensity,
        audioFeedback: false,
        enableBold: config.enableBold,
        enableItalic: config.enableItalic,
        enableNewlines: config.enableNewlines,
        enableDifferentFonts: config.enableDifferentFonts
      }
      const buffer = await this.painter.paint(staticOptions)
      await this.renderer.set(monitorId, buffer)
    } catch (error) {
      console.error('MurmurService previewTheme failed:', error)
    }
  }

  public async updateClockWallpapers(state: MurmurState): Promise<void> {
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
        const envelope = state.lastContent?.[screen.id]
        const phrase = isStaticMode
          ? (envelope?.payload?.phrase ?? state.lastPhrases?.[screen.id] ?? '')
          : ''
        if (isStaticMode && !phrase.trim() && !envelope) {
          continue
        }

        const staticOptions = {
          phrase,
          layoutContent: envelope,
          theme,
          fontFamily: config.fontFamily,
          animation: 'Instant' as const,
          overlays: isStaticMode ? config.overlays : { dateTime: false, sourceCredit: false, inspiringHeadlines: false },
          resolution: { width: screen.width, height: screen.height },
          textAlignment: config.textAlignment,
          layoutStyle: config.layoutStyle,
          vignetteStyle: config.vignetteStyle,
          noiseIntensity: config.noiseIntensity,
          audioFeedback: false,
          enableBold: config.enableBold,
          enableItalic: config.enableItalic,
          enableNewlines: config.enableNewlines,
          enableDifferentFonts: config.enableDifferentFonts,
          headlines: isStaticMode ? state.lastHeadlines?.[screen.id] || [] : undefined,
          sources: isStaticMode ? state.lastSources?.[screen.id] || [] : undefined
        }

        const buffer = await this.painter.paint(staticOptions)
        await this.renderer.set(screen.id, buffer)
      }
    } catch (error) {
      console.error('MurmurService updateClockWallpapers failed:', error)
    }
  }
}
