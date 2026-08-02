import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MurmurService } from '../../../../src/core/domain/MurmurService'
import { IRssFetcher } from '../../../../src/core/ports/IRssFetcher'
import { IPhraseGenerator, PhraseGenerationResult } from '../../../../src/core/ports/IPhraseGenerator'
import { IWallpaperPainter } from '../../../../src/core/ports/IWallpaperPainter'
import { IWallpaperRenderer } from '../../../../src/core/ports/IWallpaperRenderer'
import { IConfigStore } from '../../../../src/core/ports/IConfigStore'
import { IHistoryStore } from '../../../../src/core/ports/IHistoryStore'
import { ISystemTray } from '../../../../src/core/ports/ISystemTray'
import { MurmurConfig, RssItem } from '../../../../src/core/domain/types'
import { testMonitorConfigV2 } from '../../helpers/testMonitorConfigV2'

describe('MurmurService', () => {
  let rssMock: IRssFetcher
  let aiMock: IPhraseGenerator
  let painterMock: IWallpaperPainter
  let rendererMock: IWallpaperRenderer
  let configStoreMock: IConfigStore
  let historyStoreMock: IHistoryStore
  let trayMock: ISystemTray
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
    aiMock = {
      generate: vi.fn().mockResolvedValue('surreal phrase'),
      generateStructured: vi.fn().mockResolvedValue(structuredResult)
    }
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

    service = new MurmurService(
      rssMock,
      aiMock,
      painterMock,
      rendererMock,
      configStoreMock,
      historyStoreMock,
      trayMock
    )
  })

  it('runs refresh cycle for enabled monitors only', async () => {
    await service.refresh()

    expect(rssMock.fetchAll).toHaveBeenCalledWith(['https://feeds.com/rss'])
    expect(rendererMock.getScreens).toHaveBeenCalled()

    expect(aiMock.generateStructured).toHaveBeenCalledTimes(1)
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
    aiMock.generateStructured = vi.fn().mockRejectedValue(new Error('invalid'))
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
    expect(aiMock.generateStructured).not.toHaveBeenCalled()
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
    expect(aiMock.generateStructured).not.toHaveBeenCalled()
  })
})
