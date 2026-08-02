import type { LayoutStyleName } from '../../domain/types'
import { phraseToPlainText } from '../phrase/phrasePlainText'
import { splitPlainPhraseHeadlineDeck } from '../phrase/phraseLayoutSplit'

/** Best-effort structured fields from a plain phrase when committed envelope schema differs. */
export function mockLayoutPayloadForPreview(
  layoutStyle: LayoutStyleName,
  rawPhrase: string
): Record<string, string> {
  const base = phraseToPlainText(rawPhrase).trim() || 'Preview phrase for this layout'

  switch (layoutStyle) {
    case 'split-spread': {
      const words = base.split(/\s+/).filter(Boolean)
      const mid = Math.max(1, Math.ceil(words.length / 2))
      return {
        left: words.slice(0, mid).join(' '),
        right: words.slice(mid).join(' ') || '…'
      }
    }
    case 'tabloid-stack': {
      const { headline, deck } = splitPlainPhraseHeadlineDeck(base)
      return {
        kicker: 'Preview',
        headline: headline.toUpperCase(),
        deck: deck || 'Sample deck line for the tabloid stack.'
      }
    }
    case 'pull-quote':
      return { quote: base, attribution: 'Murmur preview' }
    case 'feature-opener': {
      const { headline, deck } = splitPlainPhraseHeadlineDeck(base)
      return {
        section: 'Culture',
        headline,
        deck: deck || 'A sample deck under the feature headline.'
      }
    }
    case 'sidebar-rail': {
      const { headline, deck } = splitPlainPhraseHeadlineDeck(base)
      return {
        main: headline,
        sidebar: deck || 'Margin note — preview only until you Apply.'
      }
    }
    case 'byline-lede': {
      const { headline, deck } = splitPlainPhraseHeadlineDeck(base)
      return {
        headline,
        byline: 'By Murmur Desk',
        lede: deck || base
      }
    }
    default:
      return { phrase: base }
  }
}

export const STRUCTURED_MAGAZINE_LAYOUTS: LayoutStyleName[] = [
  'split-spread',
  'tabloid-stack',
  'pull-quote',
  'feature-opener',
  'sidebar-rail',
  'byline-lede'
]

export function isStructuredMagazineLayout(layoutStyle: LayoutStyleName): boolean {
  return STRUCTURED_MAGAZINE_LAYOUTS.includes(layoutStyle)
}
