import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { IPhraseGenerator } from '../../core/ports/IPhraseGenerator'
import { IRssFetcher } from '../../core/ports/IRssFetcher'
import { IWallpaperRenderer } from '../../core/ports/IWallpaperRenderer'
import {
  buildE2eStructuredResult,
  E2eStructuredDemoFixtures
} from '../e2e/e2eStructuredPhraseStub'

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
  rssFetcher: IRssFetcher
  phraseGenerator: IPhraseGenerator
  wallpaperRenderer: IWallpaperRenderer
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
    rssFetcher: {
      fetchAll: async () => [
        { title: 'Stub Headline 1', source: 'Stub Source', feedUrl: 'http://stub.com' },
        { title: 'Stub Headline 2', source: 'Stub Source', feedUrl: 'http://stub.com' }
      ]
    },
    phraseGenerator: {
      generate: async () => fixturePhrase || 'stubbed surreal phrase',
      generateStructured: async (request) =>
        buildE2eStructuredResult(request, fixturePhrase, semanticsDemo ?? undefined)
    },
    wallpaperRenderer: {
      getScreens: async () => [{ id: 'stub-monitor', width: 800, height: 600 }],
      set: async () => {},
      backup: async () => {},
      restore: async () => {}
    }
  }
}
