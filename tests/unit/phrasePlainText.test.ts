import { describe, it, expect } from 'vitest'
import { phraseToPlainText } from '../../src/core/lib/phrase/phrasePlainText'

describe('phraseToPlainText', () => {
  it('removes font tags, markdown emphasis, and collapses whitespace', () => {
    const raw =
      '[font:Playfair Display]**Sumergido** el átomo en el *alga* del olvido, [/font] **quemar** el *viñedo*'
    expect(phraseToPlainText(raw)).toBe(
      'Sumergido el átomo en el alga del olvido, quemar el viñedo'
    )
  })

  it('handles literal newline escapes', () => {
    expect(phraseToPlainText('line one\\nline **two**')).toBe('line one line two')
  })
})
