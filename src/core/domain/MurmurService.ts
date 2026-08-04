import { IRssRepository } from '../ports/IRssRepository'
import { IPhraseRepository } from '../ports/IPhraseRepository'
import { ILlmRepository } from '../ports/ILlmRepository'
import { IWallpaperPainter } from '../ports/IWallpaperPainter'
import { IWallpaperRenderer } from '../ports/IWallpaperRenderer'
import { IConfigStore } from '../ports/IConfigStore'
import { IHistoryStore } from '../ports/IHistoryStore'
import { ISystemTray } from '../ports/ISystemTray'
import { IBackgroundImageRepository } from '../ports/IBackgroundImageRepository'
import { IBackgroundAssetStore } from '../ports/IBackgroundAssetStore'
import { sampleHeadlines } from './HeadlineSampler'
import { LayoutContentEnvelope, MonitorProfile, MurmurState, ThemeName } from './types'
import { getLayoutContentSpec } from '../lib/layout/layoutContentSpecs'
import { payloadToPlainSummary } from '../lib/phrase/payloadToPlainSummary'
import { resolveToneInstruction } from '../lib/generation/toneInstructions'
import { buildEffectiveSystemPrompt } from '../lib/generation/buildEffectiveSystemPrompt'
import { buildImagePromptComposeUserMessage } from '../lib/generation/buildImagePromptComposerRequest'
import { finalizeIntegratedImagePrompt } from '../lib/generation/finalizeIntegratedImagePrompt'
import { isAiPhraseIntegrated } from '../lib/presets/aiPhraseInImagePresets'
import type { BackgroundPaintInput } from '../lib/background/resolveBackgroundBase'
import { resolveMonitorBackgroundPaint } from '../lib/background/resolveMonitorBackgroundPaint'
import { formatAiBackgroundError } from '../lib/background/backgroundErrors'
import { shouldPaintPhraseOverlay, shouldShowPhraseWidget } from '../lib/presets/aiPhraseInImagePresets'
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
  sources?: string[],
  background?: BackgroundPaintInput
) {
  const bg =
    background ??
    ({ backgroundMode: 'gradient' as const, theme: profile.theme } satisfies BackgroundPaintInput)
  const paintHero = isStaticMode && shouldPaintPhraseOverlay(profile)
  const phraseForPaint = paintHero || (isStaticMode && shouldShowPhraseWidget(profile)) ? phrase : ''
  return {
    phrase: phraseForPaint,
    paintHeroPhrase: paintHero,
    layoutContent: paintHero ? envelope : undefined,
    theme: bg.theme,
    backgroundMode: bg.backgroundMode,
    baseImagePath: bg.baseImagePath,
    fontFamily: profile.fontFamily,
    animation: 'Instant' as const,
    overlays: isStaticMode
      ? profile.overlays
      : { dateTime: false, sourceCredit: false, inspiringHeadlines: false, phraseWidget: false },
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
    private readonly rssRepository: IRssRepository,
    private readonly phraseRepository: IPhraseRepository,
    private readonly llmRepository: ILlmRepository,
    private readonly painter: IWallpaperPainter,
    private readonly renderer: IWallpaperRenderer,
    private readonly configStore: IConfigStore,
    private readonly historyStore: IHistoryStore,
    private readonly tray: ISystemTray,
    private readonly backgroundImageRepository: IBackgroundImageRepository,
    private readonly backgroundAssets: IBackgroundAssetStore
  ) {}

  private async resolveBackgroundForPaint(
    monitorId: string,
    profile: MonitorProfile,
    screen: { width: number; height: number },
    headlineTitles: string[] | undefined,
    phrase: string | undefined,
    regenerateAi: boolean
  ): Promise<{ paint: BackgroundPaintInput; aiError?: string }> {
    if (profile.backgroundMode === 'ai' && regenerateAi && headlineTitles) {
      try {
        const userMessage = buildImagePromptComposeUserMessage(profile, {
          sampleTitles: headlineTitles,
          phrase: phrase ?? ''
        })
        let prompt = await this.llmRepository.completeText({ userMessage })
        if (isAiPhraseIntegrated(profile)) {
          prompt = finalizeIntegratedImagePrompt(prompt, phrase ?? '')
        }
        const imageBuffer = await this.backgroundImageRepository.generate({
          prompt,
          width: screen.width,
          height: screen.height
        })
        await this.backgroundAssets.saveGeneratedImage(monitorId, imageBuffer)
      } catch (error) {
        console.warn(`MurmurService: AI background skipped for ${monitorId}`, error)
        return {
          paint: resolveMonitorBackgroundPaint(profile, monitorId, this.backgroundAssets),
          aiError: formatAiBackgroundError(error)
        }
      }
    }
    return {
      paint: resolveMonitorBackgroundPaint(profile, monitorId, this.backgroundAssets)
    }
  }

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
    let lastBackgroundError: string | undefined
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

      const rssItems = await this.rssRepository.fetchAll(feedUrls)
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
          const result = await this.phraseRepository.generateStructured({
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
          const headlineTitles = sampled.map((item) => item.title)
          const backgroundResolved = await this.resolveBackgroundForPaint(
            screen.id,
            profile,
            screen,
            headlineTitles,
            phraseForPaint,
            true
          )
          if (backgroundResolved.aiError) {
            lastBackgroundError = backgroundResolved.aiError
          }
          const backgroundPaint = backgroundResolved.paint
          const staticOptions = paintOptionsFromProfile(
            profile,
            profile.theme,
            screen,
            envelope,
            phraseForPaint,
            true,
            headlineTitles,
            Array.from(new Set(sampled.map((i) => i.source))),
            backgroundPaint
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
        lastGenerationError: anySuccess
          ? lastBackgroundError
          : lastGenerationError ?? lastBackgroundError
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
      const backgroundResolved = await this.resolveBackgroundForPaint(
        monitorId,
        profile,
        targetScreen,
        undefined,
        undefined,
        false
      )
      const backgroundPaint = backgroundResolved.paint
      const staticOptions = paintOptionsFromProfile(
        profile,
        theme,
        targetScreen,
        undefined,
        '',
        true,
        undefined,
        undefined,
        backgroundPaint
      )
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

  /** Generate FLUX backgrounds for AI mode using cached headlines/phrases (e.g. after Style Apply). */
  public async regenerateAiBackgrounds(state: MurmurState): Promise<string | undefined> {
    const config = await this.configStore.get()
    if (!config.cloudflareAccountId?.trim() || !config.cloudflareApiToken?.trim()) {
      return 'AI background needs Cloudflare Account ID and API token in General settings.'
    }

    const { config: withMonitors, activeScreens } = await this.loadConfigWithMonitors()
    let lastError: string | undefined
    let paintedAny = false

    for (const screen of activeScreens) {
      const monitorConf = getMonitorEntry(withMonitors, screen.id)
      if (monitorConf && !monitorConf.enabled) continue

      const profile = getMonitorProfile(withMonitors, screen.id)
      if (profile.backgroundMode !== 'ai') continue

      const envelope = state.lastContent?.[screen.id]
      const phrase = envelope?.payload?.phrase ?? state.lastPhrases?.[screen.id] ?? ''
      const headlines = state.lastHeadlines?.[screen.id]
      if (!headlines?.length) {
        lastError =
          'Press Refresh Now to sample headlines before Murmur can generate an AI background.'
        continue
      }

      const backgroundResolved = await this.resolveBackgroundForPaint(
        screen.id,
        profile,
        screen,
        headlines,
        phrase,
        true
      )
      if (backgroundResolved.aiError) {
        lastError = backgroundResolved.aiError
        continue
      }

      const staticOptions = paintOptionsFromProfile(
        profile,
        profile.theme,
        screen,
        envelope,
        phrase,
        true,
        headlines,
        state.lastSources?.[screen.id] || [],
        backgroundResolved.paint
      )
      try {
        const buffer = await this.painter.paint(staticOptions)
        await this.renderer.set(screen.id, buffer)
        paintedAny = true
      } catch (paintError) {
        console.error(`MurmurService: Desktop paint/set failed for ${screen.id}`, paintError)
        lastError =
          'AI background was generated but could not be applied to the desktop. Try restarting Murmur.'
      }
    }

    if (paintedAny) {
      this.tray.updateState({
        isPaused: state.isPaused ?? false,
        lastRefreshTime: new Date().toLocaleTimeString(),
        lastPhrases: state.lastPhrases ?? {},
        lastContent: state.lastContent ?? {},
        lastHeadlines: state.lastHeadlines,
        lastSources: state.lastSources,
        lastGenerationError: lastError
      })
    }

    return lastError
  }

  public reportUserError(state: MurmurState, message: string): void {
    this.tray.updateState({
      isPaused: state.isPaused ?? false,
      lastRefreshTime: state.lastRefreshTime,
      lastPhrases: state.lastPhrases ?? {},
      lastContent: state.lastContent ?? {},
      lastHeadlines: state.lastHeadlines,
      lastSources: state.lastSources,
      lastGenerationError: message
    })
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

        const backgroundResolved = await this.resolveBackgroundForPaint(
            screen.id,
            profile,
            screen,
            state.lastHeadlines?.[screen.id],
            phrase,
            false
          )
        const staticOptions = paintOptionsFromProfile(
          profile,
          profile.theme,
          screen,
          envelope,
          phrase,
          true,
          state.lastHeadlines?.[screen.id] || [],
          state.lastSources?.[screen.id] || [],
          backgroundResolved.paint
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
