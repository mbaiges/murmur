import { describe, expect, it } from 'vitest'
import { resolveToneInstruction } from '../../../../../src/core/lib/generation/toneInstructions'

describe('resolveToneInstruction', () => {
  it('returns null for none', () => {
    expect(resolveToneInstruction({ tonePreset: 'none', customToneText: '' })).toBeNull()
  })

  it('returns builtin neutral text', () => {
    const t = resolveToneInstruction({ tonePreset: 'neutral', customToneText: '' })
    expect(t).toMatch(/neutral/i)
  })

  it('returns custom text when preset is custom', () => {
    expect(
      resolveToneInstruction({ tonePreset: 'custom', customToneText: '  Talk like a pirate  ' })
    ).toBe('Talk like a pirate')
  })

  it('returns null for custom with empty text', () => {
    expect(resolveToneInstruction({ tonePreset: 'custom', customToneText: '   ' })).toBeNull()
  })

  it('returns builtin vulgar text', () => {
    const t = resolveToneInstruction({ tonePreset: 'vulgar', customToneText: '' })
    expect(t).toMatch(/vulgar/i)
  })
})
