import { IRssFetcher } from '../ports/IRssFetcher'
import { IPhraseGenerator } from '../ports/IPhraseGenerator'
import { IWallpaperPainter } from '../ports/IWallpaperPainter'
import { IWallpaperRenderer } from '../ports/IWallpaperRenderer'
import { IConfigStore } from '../ports/IConfigStore'
import { IHistoryStore } from '../ports/IHistoryStore'
import { ISystemTray } from '../ports/ISystemTray'
import { sampleHeadlines } from './HeadlineSampler'
import { LayoutContentEnvelope, MonitorProfile, MurmurState, ThemeName } from './types'
import { getLayoutContentSpec } from '../lib/layout/layoutContentSpecs'
import { payloadToPlainSummary } from '../lib/phrase/payloadToPlainSummary'
import { resolveToneInstruction } from '../lib/generation/toneInstructions'
import { buildEffectiveSystemPrompt } from '../lib/generation/buildEffectiveSystemPrompt'
import {
  collectUnionFeedUrls,
  ensureMonitorsForScreens,
  getMonitorEntry,
  getMonitorProfile
} from '../lib/config/monitorProfiles'

export type MurmurRefreshContext = Pick<MurmurState, 'lastContent' | 'lastPhrases'>

function paintOptionsFromProfile(
  profile: MonitorProfile,
  theme: ThemeName,
  screen: { width: number; height: number },
  envelope: LayoutContentEnvelope | undefined,
  phrase: string,
  isStaticMode: boolean,
  headlines?: string[],
  sources?: string[]
) {
  return {
    phrase: isStaticMode ? phrase : '',
    layoutContent: envelope,
    theme,
    fontFamily: profile.fontFamily,
    animation: 'Instant' as const,
    overlays: isStaticMode
      ? profile.overlays
      : { dateTime: false, sourceCredit: false, inspiringHeadlines: false },
    resolution: { width: screen.width, height: screen.height },
    textAlignment: profile.textAlignment,
    layoutStyle: profile.layoutStyle,
    vignetteStyle: profile.vignetteStyle,
    noiseIntensity: profile.noiseIntensity,
    audioFeedback: false,
    enableBold: profile.enableBold,
    enableItalic: profile.enableItalic,
    enableNewlines: profile.enableNewlines,
    enableDifferentFonts: profile.enableDifferentFonts,
    headlines: isStaticMode ? headlines : undefined,
    sources: isStaticMode ? sources : undefined
  }
}

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

  private async loadConfigWithMonitors() {
    let config = await this.configStore.get()
    const activeScreens = await this.renderer.getScreens()
    const { config: ensured, dirty } = ensureMonitorsForScreens(config, activeScreens)
    if (dirty) {
      await this.configStore.set({ monitors: ensured.monitors })
      config = ensured
    }
    return { config, activeScreens }
  }

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
      const { config, activeScreens } = await this.loadConfigWithMonitors()
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

      const feedUrls = collectUnionFeedUrls(
        config,
        activeScreens.map((s) => s.id)
      )
      if (feedUrls.length === 0) {
        console.warn('MurmurService: No feeds configured for enabled displays.')
        return
      }

      const rssItems = await this.rss.fetchAll(feedUrls)
      if (rssItems.length === 0) {
        console.warn('MurmurService: No RSS items found.')
        return
      }

      const lastHeadlines: Record<string, string[]> = {}
      const lastSources: Record<string, string[]> = {}

      for (const screen of activeScreens) {
        const monitorConf = getMonitorEntry(config, screen.id)
        if (monitorConf && !monitorConf.enabled) {
          continue
        }

        const monitorEntry = getMonitorEntry(config, screen.id)
        const profile = monitorEntry?.profile ?? getMonitorProfile(config, screen.id)
        const feedSet = new Set(profile.feeds)
        let itemsForMonitor = rssItems.filter((item) => feedSet.has(item.feedUrl))
        // After display id remapping, a profile may briefly lack the feeds that were fetched.
        if (itemsForMonitor.length === 0 && rssItems.length > 0) {
          console.warn(
            `MurmurService: No RSS items matched feeds for display ${screen.id}; using union headlines.`
          )
          itemsForMonitor = rssItems
        }
        if (itemsForMonitor.length === 0) {
          console.warn(`MurmurService: No RSS items for display ${screen.id}`)
          continue
        }

        const contentSpec = getLayoutContentSpec(profile.layoutStyle)
        const sampled = sampleHeadlines(itemsForMonitor, profile.headlineSampleSize)
        const generatorInputs = sampled.map((item) => `[Source: ${item.source}] ${item.title}`)

        try {
          const toneInstruction = resolveToneInstruction(profile)
          const effectiveSystemPrompt = buildEffectiveSystemPrompt(profile.systemPrompt, toneInstruction)
          const result = await this.ai.generateStructured({
            headlines: generatorInputs,
            language: profile.language,
            systemPrompt: effectiveSystemPrompt,
            contentSpec,
            formatFlags: {
              enableBold: profile.enableBold,
              enableItalic: profile.enableItalic,
              enableNewlines: profile.enableNewlines,
              enableDifferentFonts: profile.enableDifferentFonts
            }
          })

          const envelope: LayoutContentEnvelope = {
            schemaId: result.schemaId,
            layoutStyle: result.layoutStyle,
            payload: result.payload
          }
          const summary = payloadToPlainSummary(contentSpec, result.payload)

          lastContent[screen.id] = envelope
          // Prefer raw phrase (keeps `\n` breaks) over plain summary for wallpaper/preview.
          lastPhrases[screen.id] = result.payload.phrase ?? summary
          lastHeadlines[screen.id] = sampled.map((item) => item.title)
          lastSources[screen.id] = Array.from(new Set(sampled.map((item) => item.source)))
          anySuccess = true

          await this.historyStore.save(screen.id, result.rawJson)

          // Always bake phrase/layout into the OS wallpaper PNG. Live overlay windows
          // (Fade/Typewriter/etc.) draw on top when present; Instant relies on this PNG.
          // On macOS the desktop overlay is unreliable, so the PNG must carry the content.
          const phraseForPaint = result.payload.phrase ?? summary
          const staticOptions = paintOptionsFromProfile(
            profile,
            profile.theme,
            screen,
            envelope,
            phraseForPaint,
            true,
            sampled.map((item) => item.title),
            Array.from(new Set(sampled.map((i) => i.source)))
          )
          try {
            const buffer = await this.painter.paint(staticOptions)
            await this.renderer.set(screen.id, buffer)
          } catch (paintError) {
            console.error(`MurmurService: Desktop paint/set failed for ${screen.id}`, paintError)
            lastGenerationError =
              'Phrase updated, but the desktop wallpaper could not be applied. Try restarting Murmur after reinstalling.'
          }
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
      const { config, activeScreens } = await this.loadConfigWithMonitors()
      const targetScreen = activeScreens.find((s) => s.id === monitorId)
      if (!targetScreen) {
        throw new Error(`Monitor with ID ${monitorId} not found`)
      }

      const profile = getMonitorProfile(config, monitorId)
      const staticOptions = paintOptionsFromProfile(profile, theme, targetScreen, undefined, '', true)
      const buffer = await this.painter.paint(staticOptions)
      await this.renderer.set(monitorId, buffer)
    } catch (error) {
      console.error('MurmurService previewTheme failed:', error)
    }
  }

  /** Re-render desktop from cached phrase/content without RSS or Gemini. */
  public async reRenderWallpapers(state: MurmurState): Promise<void> {
    return this.updateClockWallpapers(state)
  }

  public async updateClockWallpapers(state: MurmurState): Promise<void> {
    try {
      const { config, activeScreens } = await this.loadConfigWithMonitors()
      if (!config.geminiApiKey) {
        return
      }

      for (const screen of activeScreens) {
        const monitorConf = getMonitorEntry(config, screen.id)
        if (monitorConf && !monitorConf.enabled) {
          continue
        }

        const profile = getMonitorProfile(config, screen.id)
        const envelope = state.lastContent?.[screen.id]
        const phrase =
          envelope?.payload?.phrase ?? state.lastPhrases?.[screen.id] ?? ''
        if (!phrase.trim() && !envelope) {
          continue
        }

        const staticOptions = paintOptionsFromProfile(
          profile,
          profile.theme,
          screen,
          envelope,
          phrase,
          true,
          state.lastHeadlines?.[screen.id] || [],
          state.lastSources?.[screen.id] || []
        )

        try {
          const buffer = await this.painter.paint(staticOptions)
          await this.renderer.set(screen.id, buffer)
        } catch (paintError) {
          console.error(`MurmurService: Desktop paint/set failed for ${screen.id}`, paintError)
        }
      }
    } catch (error) {
      console.error('MurmurService updateClockWallpapers failed:', error)
    }
  }
}
