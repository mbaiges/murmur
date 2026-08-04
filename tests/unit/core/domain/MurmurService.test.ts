import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MurmurService } from '../../../../src/core/domain/MurmurService'
import { IRssRepository } from '../../../../src/core/ports/IRssRepository'
import { IPhraseRepository, PhraseGenerationResult } from '../../../../src/core/ports/IPhraseRepository'
import { ILlmRepository } from '../../../../src/core/ports/ILlmRepository'
import { IBackgroundImageRepository } from '../../../../src/core/ports/IBackgroundImageRepository'
import { IWallpaperPainter } from '../../../../src/core/ports/IWallpaperPainter'
import { IWallpaperRenderer } from '../../../../src/core/ports/IWallpaperRenderer'
import { IConfigStore } from '../../../../src/core/ports/IConfigStore'
import { IHistoryStore } from '../../../../src/core/ports/IHistoryStore'
import { ISystemTray } from '../../../../src/core/ports/ISystemTray'
import { IBackgroundAssetStore } from '../../../../src/core/ports/IBackgroundAssetStore'
import { MurmurConfig, RssItem } from '../../../../src/core/domain/types'
import { testMonitorConfigV2 } from '../../helpers/testMonitorConfigV2'

describe('MurmurService', () => {
  let rssMock: IRssRepository
  let phraseMock: IPhraseRepository
  let llmMock: ILlmRepository
  let painterMock: IWallpaperPainter
  let rendererMock: IWallpaperRenderer
  let configStoreMock: IConfigStore
  let historyStoreMock: IHistoryStore
  let trayMock: ISystemTray
  let backgroundImageMock: IBackgroundImageRepository
  let backgroundAssetsMock: IBackgroundAssetStore
  let service: MurmurService

  const mockConfig: MurmurConfig = testMonitorConfigV2()

  const mockRssItems: RssItem[] = [
    { title: 'Headline 1', source: 'Source 1', feedUrl: 'https://feeds.com/rss' },
    { title: 'Headline 2', source: 'Source 2', feedUrl: 'https://feeds.com/rss' }
  ]

  const structuredResult: PhraseGenerationResult = {
    schemaId: 'murmur.layout.simple.v1',
    layoutStyle: 'centered',
    rawJson: '{"schemaId":"murmur.layout.simple.v1","layoutStyle":"centered","payload":{"phrase":"surreal phrase"}}',
    payload: { phrase: 'surreal phrase' }
  }

  beforeEach(() => {
    rssMock = { fetchAll: vi.fn().mockResolvedValue(mockRssItems) }
    phraseMock = {
      generate: vi.fn().mockResolvedValue('surreal phrase'),
      generateStructured: vi.fn().mockResolvedValue(structuredResult)
    }
    llmMock = { completeText: vi.fn().mockResolvedValue('image prompt') }
    painterMock = { paint: vi.fn().mockResolvedValue(Buffer.from('png-data')) }
    rendererMock = {
      getScreens: vi.fn().mockResolvedValue([
        { id: 'screen-1', width: 1920, height: 1080 },
        { id: 'screen-2', width: 1920, height: 1080 }
      ]),
      set: vi.fn().mockResolvedValue(undefined),
      backup: vi.fn().mockResolvedValue(undefined),
      restore: vi.fn().mockResolvedValue(undefined)
    }
    configStoreMock = {
      get: vi.fn().mockResolvedValue(mockConfig),
      set: vi.fn().mockResolvedValue(undefined)
    }
    historyStoreMock = {
      save: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue([]),
      clear: vi.fn().mockResolvedValue(undefined)
    }
    trayMock = {
      init: vi.fn(),
      setTooltip: vi.fn(),
      updateState: vi.fn()
    }
    backgroundImageMock = {
      generate: vi.fn().mockResolvedValue(Buffer.from('jpeg'))
    }
    backgroundAssetsMock = {
      importPersonalPhoto: vi.fn(),
      saveGeneratedImage: vi.fn().mockResolvedValue('screen-1/ai-latest.jpg'),
      resolveAbsolutePath: vi.fn().mockReturnValue(null),
      latestAiRelPath: vi.fn().mockReturnValue('screen-1/ai-latest.jpg')
    }

    service = new MurmurService(
      rssMock,
      phraseMock,
      llmMock,
      painterMock,
      rendererMock,
      configStoreMock,
      historyStoreMock,
      trayMock,
      backgroundImageMock,
      backgroundAssetsMock
    )
  })

  it('runs refresh cycle for enabled monitors only', async () => {
    await service.refresh()

    expect(rssMock.fetchAll).toHaveBeenCalledWith(['https://feeds.com/rss'])
    expect(rendererMock.getScreens).toHaveBeenCalled()

    expect(phraseMock.generateStructured).toHaveBeenCalledTimes(1)
    expect(painterMock.paint).toHaveBeenCalledTimes(1)
    expect(rendererMock.set).toHaveBeenCalledWith('screen-1', expect.any(Buffer))
    expect(rendererMock.set).not.toHaveBeenCalledWith('screen-2', expect.any(Buffer))

    expect(historyStoreMock.save).toHaveBeenCalledWith('screen-1', structuredResult.rawJson)
    expect(trayMock.updateState).toHaveBeenCalledWith(
      expect.objectContaining({
        isPaused: false,
        lastPhrases: { 'screen-1': 'surreal phrase' },
        lastContent: {
          'screen-1': expect.objectContaining({
            payload: { phrase: 'surreal phrase' }
          })
        }
      })
    )
  })

  it('preserves prior content when structured generation fails', async () => {
    phraseMock.generateStructured = vi.fn().mockRejectedValue(new Error('invalid'))
    const previous = {
      lastPhrases: { 'screen-1': 'kept phrase' },
      lastContent: {
        'screen-1': {
          schemaId: 'murmur.layout.simple.v1',
          layoutStyle: 'centered' as const,
          payload: { phrase: 'kept phrase' }
        }
      }
    }

    await service.refresh(previous)

    expect(historyStoreMock.save).not.toHaveBeenCalled()
    expect(trayMock.updateState).toHaveBeenCalledWith(
      expect.objectContaining({
        lastPhrases: { 'screen-1': 'kept phrase' },
        lastGenerationError: expect.stringContaining('failed')
      })
    )
  })

  it('bypasses refresh if API key is missing', async () => {
    configStoreMock.get = vi.fn().mockResolvedValue({
      ...mockConfig,
      geminiApiKey: ''
    })

    await service.refresh()

    expect(rssMock.fetchAll).not.toHaveBeenCalled()
    expect(phraseMock.generateStructured).not.toHaveBeenCalled()
    expect(trayMock.updateState).toHaveBeenCalledWith({
      isPaused: false,
      lastRefreshTime: expect.any(String),
      lastPhrases: {},
      lastContent: {}
    })
  })

  it('bypasses monitor refresh if RSS items fetch is empty', async () => {
    rssMock.fetchAll = vi.fn().mockResolvedValue([])

    await service.refresh()

    expect(rssMock.fetchAll).toHaveBeenCalled()
    expect(phraseMock.generateStructured).not.toHaveBeenCalled()
  })

  it('runs AI background pipeline when profile backgroundMode is ai', async () => {
    const aiProfile = {
      ...mockConfig.monitors[0]!.profile,
      backgroundMode: 'ai' as const,
      backgroundPresetId: 'Abstract mood' as const
    }
    configStoreMock.get = vi.fn().mockResolvedValue({
      ...mockConfig,
      monitors: [{ ...mockConfig.monitors[0]!, profile: aiProfile }, mockConfig.monitors[1]!]
    })
    backgroundAssetsMock.resolveAbsolutePath = vi.fn().mockReturnValue('/tmp/ai-latest.jpg')

    await service.refresh()

    expect(llmMock.completeText).toHaveBeenCalledTimes(1)
    expect(llmMock.completeText).toHaveBeenCalledWith(
      expect.objectContaining({
        userMessage: expect.stringContaining('surreal phrase')
      })
    )
    expect(backgroundImageMock.generate).toHaveBeenCalledTimes(1)
    expect(backgroundAssetsMock.saveGeneratedImage).toHaveBeenCalledWith('screen-1', expect.any(Buffer))
    expect(painterMock.paint).toHaveBeenCalledWith(
      expect.objectContaining({
        backgroundMode: 'ai',
        baseImagePath: '/tmp/ai-latest.jpg'
      })
    )
  })

  it('skips AI background when image prompt fails but keeps phrase refresh', async () => {
    const aiProfile = {
      ...mockConfig.monitors[0]!.profile,
      backgroundMode: 'ai' as const
    }
    configStoreMock.get = vi.fn().mockResolvedValue({
      ...mockConfig,
      monitors: [{ ...mockConfig.monitors[0]!, profile: aiProfile }, mockConfig.monitors[1]!]
    })
    llmMock.completeText = vi.fn().mockRejectedValue(new Error('prompt fail'))

    await service.refresh()

    expect(backgroundImageMock.generate).not.toHaveBeenCalled()
    expect(painterMock.paint).toHaveBeenCalledWith(
      expect.objectContaining({ backgroundMode: 'gradient' })
    )
    expect(trayMock.updateState).toHaveBeenCalledWith(
      expect.objectContaining({
        lastPhrases: { 'screen-1': 'surreal phrase' },
        lastGenerationError: expect.stringContaining('AI background')
      })
    )
  })
})
