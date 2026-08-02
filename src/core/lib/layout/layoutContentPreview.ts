import { LayoutContentEnvelope } from '../../domain/types'
import { phraseToPlainText } from '../phrase/phrasePlainText'

/** One-line preview for Phrase History (Preview mode). */
export function layoutContentPreview(envelope: LayoutContentEnvelope): string {
  const { layoutStyle, payload } = envelope
  switch (layoutStyle) {
    case 'tabloid-stack':
      return phraseToPlainText(payload.headline || payload.phrase || '')
    case 'split-spread': {
      const left = phraseToPlainText(payload.left || '')
      const right = phraseToPlainText(payload.right || '')
      if (left && right) {
        return `${left} | ${right}`
      }
      return left || right || phraseToPlainText(payload.phrase || '')
    }
    case 'pull-quote':
      return phraseToPlainText(payload.quote || payload.phrase || '')
    case 'feature-opener':
      return phraseToPlainText(payload.headline || payload.phrase || '')
    case 'sidebar-rail':
      return phraseToPlainText(payload.main || payload.phrase || '')
    case 'byline-lede':
      return phraseToPlainText(payload.headline || payload.phrase || '')
    default:
      return phraseToPlainText(payload.phrase || Object.values(payload)[0] || '')
  }
}
