import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MurmurService } from '../../src/domain/MurmurService'
import { IRssFetcher } from '../../src/ports/IRssFetcher'
import { IPhraseGenerator } from '../../src/ports/IPhraseGenerator'
import { IWallpaperPainter } from '../../src/ports/IWallpaperPainter'
import { IWallpaperRenderer } from '../../src/ports/IWallpaperRenderer'
import { IConfigStore } from '../../src/ports/IConfigStore'
import { IHistoryStore } from '../../src/ports/IHistoryStore'
import { ISystemTray } from '../../src/ports/ISystemTray'
import { MurmurConfig, RssItem } from '../../src/domain/types'

describe('MurmurService', () => {
  let rssMock: IRssFetcher
  let aiMock: IPhraseGenerator
  let painterMock: IWallpaperPainter
  let rendererMock: IWallpaperRenderer
  let configStoreMock: IConfigStore
  let historyStoreMock: IHistoryStore
  let trayMock: ISystemTray
  let service: MurmurService

  const mockConfig: MurmurConfig = {
    geminiApiKey: 'test-api-key',
    feeds: ['https://feeds.com/rss'],
    refreshIntervalMinutes: 60,
    language: 'en',
    theme: 'Midnight',
    animation: 'Fade',
    overlays: { dateTime: true, sourceCredit: true, inspiringHeadlines: true },
    headlineSampleSize: 5,
    launchAtLogin: false,
    fontFamily: 'EB Garamond',
    monitors: [
      { id: 'screen-1', enabled: true },
      { id: 'screen-2', enabled: false }
    ]
  }

  const mockRssItems: RssItem[] = [
    { title: 'Headline 1', source: 'Source 1', feedUrl: 'U1' },
    { title: 'Headline 2', source: 'Source 2', feedUrl: 'U2' }
  ]

  beforeEach(() => {
    rssMock = { fetchAll: vi.fn().mockResolvedValue(mockRssItems) }
    aiMock = { generate: vi.fn().mockResolvedValue('surreal phrase') }
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

    expect(rssMock.fetchAll).toHaveBeenCalledWith(mockConfig.feeds)
    expect(rendererMock.getScreens).toHaveBeenCalled()

    expect(aiMock.generate).toHaveBeenCalledTimes(1)
    expect(painterMock.paint).toHaveBeenCalledTimes(1)
    expect(rendererMock.set).toHaveBeenCalledWith('screen-1', expect.any(Buffer))
    expect(rendererMock.set).not.toHaveBeenCalledWith('screen-2', expect.any(Buffer))

    expect(historyStoreMock.save).toHaveBeenCalledWith('screen-1', 'surreal phrase')
    expect(trayMock.updateState).toHaveBeenCalledWith({
      isPaused: false,
      lastRefreshTime: expect.any(String),
      lastPhrases: { 'screen-1': 'surreal phrase' }
    })
  })

  it('bypasses refresh if API key is missing', async () => {
    configStoreMock.get = vi.fn().mockResolvedValue({
      ...mockConfig,
      geminiApiKey: ''
    })

    await service.refresh()

    expect(rssMock.fetchAll).not.toHaveBeenCalled()
    expect(aiMock.generate).not.toHaveBeenCalled()
    expect(trayMock.updateState).toHaveBeenCalledWith({
      isPaused: false,
      lastRefreshTime: expect.any(String),
      lastPhrases: {}
    })
  })

  it('bypasses monitor refresh if RSS items fetch is empty', async () => {
    rssMock.fetchAll = vi.fn().mockResolvedValue([])

    await service.refresh()

    expect(rendererMock.getScreens).not.toHaveBeenCalled()
    expect(aiMock.generate).not.toHaveBeenCalled()
  })
})
