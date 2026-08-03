import { describe, expect, it } from 'vitest'
import {
  ARGENTINIAN_SPANISH_LANGUAGE,
  resolveToneInstruction
} from '../../../../../src/core/lib/generation/toneInstructions'

describe('resolveToneInstruction', () => {
  it('returns null for none', () => {
    expect(resolveToneInstruction({ tonePreset: 'none', customToneText: '', language: 'auto' })).toBeNull()
  })

  it('returns builtin neutral text', () => {
    const t = resolveToneInstruction({ tonePreset: 'neutral', customToneText: '', language: 'auto' })
    expect(t).toMatch(/neutral/i)
  })

  it('returns custom text when preset is custom', () => {
    expect(
      resolveToneInstruction({ tonePreset: 'custom', customToneText: '  Talk like a pirate  ', language: 'auto' })
    ).toBe('Talk like a pirate')
  })

  it('returns null for custom with empty text', () => {
    expect(resolveToneInstruction({ tonePreset: 'custom', customToneText: '   ', language: 'auto' })).toBeNull()
  })

  it('returns turro base text without Argentinian Spanish', () => {
    const t = resolveToneInstruction({ tonePreset: 'turro', customToneText: '', language: 'Spanish' })
    expect(t).toMatch(/rude/i)
    expect(t).not.toMatch(/Rioplatense/i)
  })

  it('returns turro rioplatense text with Argentinian Spanish', () => {
    const t = resolveToneInstruction({
      tonePreset: 'turro',
      customToneText: '',
      language: ARGENTINIAN_SPANISH_LANGUAGE
    })
    expect(t).toMatch(/turro-style/i)
    expect(t).toMatch(/Argentinian Spanish/i)
  })
})
