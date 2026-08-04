import { describe, expect, it } from 'vitest'
import { buildImagePromptComposeUserMessage } from '../../../../../src/core/lib/generation/buildImagePromptComposerRequest'
import { getDefaultMonitorProfile } from '../../../../../src/core/lib/config/defaultMonitorProfile'

describe('buildImagePromptComposeUserMessage — AI phrase in image', () => {
  it('allows readable text when aiPhraseInImage is enabled', () => {
    const profile = getDefaultMonitorProfile({
      backgroundMode: 'ai',
      aiPhraseInImage: true,
      aiPhraseInImagePreset: 'word-art'
    })
    const msg = buildImagePromptComposeUserMessage(profile, {
      sampleTitles: ['Headline'],
      phrase: 'hello world'
    })
    expect(msg).toContain('MUST include readable text')
    expect(msg).toContain('COMPLETE phrase')
    expect(msg).toContain('hello world')
    expect(msg).not.toContain('NO readable text')
  })

  it('includes voice and tone for match-prompt-tone preset', () => {
    const profile = getDefaultMonitorProfile({
      backgroundMode: 'ai',
      aiPhraseInImage: true,
      aiPhraseInImagePreset: 'match-prompt-tone',
      tonePreset: 'professional',
      systemPrompt: 'Write like a noir detective.'
    })
    const msg = buildImagePromptComposeUserMessage(profile, {
      sampleTitles: [],
      phrase: 'The rain knew.'
    })
    expect(msg).toContain('Voice (system prompt)')
    expect(msg).toContain('noir detective')
    expect(msg).toContain('The rain knew.')
  })
})
