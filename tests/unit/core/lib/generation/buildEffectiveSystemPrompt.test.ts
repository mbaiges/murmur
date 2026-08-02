import { describe, expect, it } from 'vitest'
import { buildEffectiveSystemPrompt } from '../../../../../src/core/lib/generation/buildEffectiveSystemPrompt'

describe('buildEffectiveSystemPrompt', () => {
  it('returns trimmed system prompt when no tone', () => {
    expect(buildEffectiveSystemPrompt('  Hello  ', null)).toBe('Hello')
  })

  it('appends tone block', () => {
    const out = buildEffectiveSystemPrompt('Base', 'Be formal')
    expect(out).toContain('Base')
    expect(out).toContain('Tone and delivery')
    expect(out).toContain('Be formal')
  })
})
