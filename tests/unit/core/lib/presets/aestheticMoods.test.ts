import { describe, expect, it } from 'vitest'
import { applyAestheticMood, defaultToneForMood } from '../../../../../src/core/lib/presets/aestheticMoods'
import { CYBERPUNK_TERMINAL_PROMPT } from '../../../../../src/core/domain/prompts'

describe('aestheticMoods', () => {
  it('defaults tone to none for all moods in v1', () => {
    expect(defaultToneForMood('Rogue Terminal')).toBe('none')
    expect(defaultToneForMood('Clickbait Press')).toBe('none')
  })

  it('applyAestheticMood sets prompt and tonePreset', () => {
    const partial = applyAestheticMood('Rogue Terminal')
    expect(partial.systemPrompt).toBe(CYBERPUNK_TERMINAL_PROMPT)
    expect(partial.tonePreset).toBe('none')
    expect(partial.theme).toBe('Cyberpunk')
  })
})
