import { PhraseGenerationRequest, PhraseGenerationResult } from '../ports/IPhraseGenerator'
import { envelopeToRawJson } from './layoutContentParse'
import { LayoutStyleName } from '../domain/types'

const DEFAULT_PHRASE = 'stubbed surreal phrase'

export type E2eStructuredDemoFixtures = Partial<
  Record<LayoutStyleName, Record<string, string>>
>

export function buildE2eStructuredResult(
  request: PhraseGenerationRequest,
  fixturePhrase?: string | null,
  demoLayouts?: E2eStructuredDemoFixtures
): PhraseGenerationResult {
  const base = (fixturePhrase || DEFAULT_PHRASE).trim() || DEFAULT_PHRASE
  const { contentSpec } = request
  const demoPayload = demoLayouts?.[contentSpec.layoutStyle]

  let payload: Record<string, string>

  if (demoPayload) {
    payload = { ...demoPayload }
  } else {
    switch (contentSpec.layoutStyle) {
      case 'split-spread':
        payload = { left: 'stubbed surreal', right: 'phrase' }
        break
      case 'tabloid-stack':
        payload = { headline: 'STUBBED SURREAL', deck: 'phrase' }
        break
      case 'pull-quote':
        payload = { quote: base }
        break
      case 'feature-opener':
        payload = {
          section: 'Feature',
          headline: 'STUBBED SURREAL',
          deck: 'phrase opens the magazine spread'
        }
        break
      case 'sidebar-rail':
        payload = {
          main: 'Stubbed surreal phrase in the main column',
          sidebar: 'Margin note for context'
        }
        break
      case 'byline-lede':
        payload = {
          headline: 'Stubbed Surreal Headline',
          byline: 'By Murmur Desk',
          lede: 'The lede carries the full proverb with editorial gravity and calm pacing.'
        }
        break
      default:
        payload = { phrase: base }
    }
  }

  const envelope = {
    schemaId: contentSpec.schemaId,
    layoutStyle: contentSpec.layoutStyle,
    payload
  }

  return {
    schemaId: contentSpec.schemaId,
    layoutStyle: contentSpec.layoutStyle,
    rawJson: envelopeToRawJson(envelope),
    payload
  }
}
