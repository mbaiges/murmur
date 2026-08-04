import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { IPhraseRepository } from '../../core/ports/IPhraseRepository'
import { ILlmRepository } from '../../core/ports/ILlmRepository'
import { IRssRepository } from '../../core/ports/IRssRepository'
import { IWallpaperRenderer } from '../../core/ports/IWallpaperRenderer'
import { IBackgroundImageRepository } from '../../core/ports/IBackgroundImageRepository'
import {
  buildE2eStructuredResult,
  E2eStructuredDemoFixtures
} from '../e2e/e2eStructuredPhraseStub'
import {
  incrementE2eBackgroundProviderCallCount,
  incrementE2eGenerationCallCount,
  incrementE2eImagePromptCallCount
} from '../e2e/e2eGenerationCounter'

/** Minimal valid JPEG for E2E background provider stub. */
const E2E_STUB_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDAQUFBQcGBw4ICAcPFg0UFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
  'base64'
)

export function isMurmurE2eMode(): boolean {
  return process.env.MURMUR_E2E === 'true' || process.argv.includes('--murmur-e2e')
}

export function loadE2eFixturePhrase(): string | null {
  if (process.env.MURMUR_E2E_REUSE_CAPTURED_PHRASE !== 'true') {
    return null
  }
  const fixturePath =
    process.env.MURMUR_E2E_FIXTURE_PHRASE_PATH ||
    join(process.cwd(), 'tests/e2e/fixtures/captured-phrase.json')
  if (!existsSync(fixturePath)) {
    return null
  }
  try {
    const parsed = JSON.parse(readFileSync(fixturePath, 'utf8')) as { phrase?: string }
    return parsed.phrase?.trim() || null
  } catch {
    return null
  }
}

export function loadE2eSemanticsDemo(): E2eStructuredDemoFixtures | null {
  if (process.env.MURMUR_E2E_SEMANTICS_DEMO !== 'true') {
    return null
  }
  const fixturePath =
    process.env.MURMUR_E2E_SEMANTICS_DEMO_PATH ||
    join(process.cwd(), 'tests/e2e/fixtures/structured-semantics-demo.json')
  if (!existsSync(fixturePath)) {
    return null
  }
  try {
    const parsed = JSON.parse(readFileSync(fixturePath, 'utf8')) as {
      layouts?: E2eStructuredDemoFixtures
    }
    return parsed.layouts ?? null
  } catch {
    return null
  }
}

export function createE2eRuntimeAdapters(): {
  rssRepository: IRssRepository
  phraseRepository: IPhraseRepository
  llmRepository: ILlmRepository
  wallpaperRenderer: IWallpaperRenderer
  backgroundImageRepository: IBackgroundImageRepository
} {
  const fixturePhrase = loadE2eFixturePhrase()
  const semanticsDemo = loadE2eSemanticsDemo()
  console.log(
    semanticsDemo
      ? 'MURMUR: E2E semantics demo fixtures (structured fields vs legacy heuristics)'
      : fixturePhrase
        ? 'MURMUR: E2E mode with captured fixture phrase (no live Gemini on layout changes)'
        : 'MURMUR: Running in Playwright E2E Mode with stubs'
  )
  return {
    rssRepository: {
      fetchAll: async () => [
        { title: 'Stub Headline 1', source: 'Stub Source', feedUrl: 'http://stub.com' },
        { title: 'Stub Headline 2', source: 'Stub Source', feedUrl: 'http://stub.com' }
      ]
    },
    phraseRepository: {
      generate: async () => {
        incrementE2eGenerationCallCount()
        return fixturePhrase || 'stubbed surreal phrase'
      },
      generateStructured: async (request) => {
        incrementE2eGenerationCallCount()
        return buildE2eStructuredResult(request, fixturePhrase, semanticsDemo ?? undefined)
      }
    },
    llmRepository: {
      completeText: async () => {
        incrementE2eImagePromptCallCount()
        return 'E2E abstract wallpaper, no text, soft gradients'
      }
    },
    wallpaperRenderer: {
      getScreens: async () => [{ id: 'stub-monitor', width: 800, height: 600 }],
      set: async () => {},
      backup: async () => {},
      restore: async () => {}
    },
    backgroundImageRepository: {
      generate: async () => {
        incrementE2eBackgroundProviderCallCount()
        return E2E_STUB_JPEG
      }
    }
  }
}
