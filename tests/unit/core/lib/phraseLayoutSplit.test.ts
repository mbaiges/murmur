import { describe, expect, it } from 'vitest'
import { splitPlainPhraseHeadlineDeck } from '../../../../src/core/lib/phrase/phraseLayoutSplit'

describe('splitPlainPhraseHeadlineDeck', () => {
  it('splits on sentence boundary when present', () => {
    const { headline, deck } = splitPlainPhraseHeadlineDeck(
      'Markets crash worldwide. Experts say your cat saw it coming first.'
    )
    expect(headline).toContain('Markets crash')
    expect(deck).toContain('Experts say')
  })

  it('splits short multi-word phrase into headline and deck', () => {
    const { headline, deck } = splitPlainPhraseHeadlineDeck('stubbed surreal phrase')
    expect(headline).toBeTruthy()
    expect(deck).toBeTruthy()
  })
})
