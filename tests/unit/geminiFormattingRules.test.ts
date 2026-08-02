import { describe, it, expect } from 'vitest'
import { buildPhraseFormattingRules } from '../../src/core/lib/generation/geminiFormattingRules'

describe('buildPhraseFormattingRules', () => {
  it('lists only enabled formatters and forbids disabled ones', () => {
    const rules = buildPhraseFormattingRules({
      enableBold: true,
      enableItalic: false,
      enableNewlines: true,
      enableDifferentFonts: false
    })
    expect(rules).toContain('**bold**')
    expect(rules).not.toContain('*italic* to render')
    expect(rules).toContain('Do NOT use:')
    expect(rules).toContain('*italic*')
    expect(rules).toContain('[font:…] tags')
  })

  it('requests plain text when all formatters are off', () => {
    const rules = buildPhraseFormattingRules({
      enableBold: false,
      enableItalic: false,
      enableNewlines: false,
      enableDifferentFonts: false
    })
    expect(rules).toContain('ONLY the plain text phrase')
  })
})
