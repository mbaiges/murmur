import { describe, expect, it } from 'vitest'
import {
  applyBackgroundTemplate,
  resolveBackgroundTemplateSource,
  resolveBackgroundTemplateVariables
} from '../../../../../src/core/lib/presets/backgroundPromptPresets'
import { getDefaultMonitorProfile } from '../../../../../src/core/lib/config/defaultMonitorProfile'
import { buildImagePromptComposeUserMessage } from '../../../../../src/core/lib/generation/buildImagePromptComposerRequest'

describe('backgroundPromptPresets', () => {
  it('uses custom template when preset is Custom', () => {
    const profile = getDefaultMonitorProfile({
      backgroundPresetId: 'Custom',
      customBackgroundPrompt: 'Fog with {{samples}}'
    })
    expect(resolveBackgroundTemplateSource(profile)).toBe('Fog with {{samples}}')
    expect(resolveBackgroundTemplateVariables(profile)).toEqual(['samples'])
  })

  it('substitutes samples and phrase per preset variables', () => {
    const profile = getDefaultMonitorProfile({ backgroundPresetId: 'Abstract mood' })
    const vars = resolveBackgroundTemplateVariables(profile)
    const resolved = applyBackgroundTemplate(resolveBackgroundTemplateSource(profile), vars, {
      sampleTitles: ['Headline A'],
      phrase: 'poetic line'
    })
    expect(resolved).toContain('Headline A')
    expect(resolved).toContain('poetic line')
    expect(resolved).not.toContain('{{samples}}')
    expect(resolved).not.toContain('{{phrase}}')
  })

  it('Editorial paper preset uses neither variable', () => {
    const profile = getDefaultMonitorProfile({ backgroundPresetId: 'Editorial paper' })
    expect(resolveBackgroundTemplateVariables(profile)).toEqual([])
    const resolved = applyBackgroundTemplate(resolveBackgroundTemplateSource(profile), [], {
      sampleTitles: ['Ignored'],
      phrase: 'Ignored'
    })
    expect(resolved).not.toContain('Ignored')
  })

  it('Absurd connections preset substitutes phrase for concept extraction', () => {
    const profile = getDefaultMonitorProfile({ backgroundPresetId: 'Absurd connections' })
    expect(resolveBackgroundTemplateVariables(profile)).toEqual(['phrase', 'samples'])
    const resolved = applyBackgroundTemplate(resolveBackgroundTemplateSource(profile), ['phrase', 'samples'], {
      sampleTitles: ['Election news'],
      phrase: 'Lions at a wedding in Japan'
    })
    expect(resolved).toContain('Lions at a wedding in Japan')
    expect(resolved).toContain('Election news')
    expect(resolved).toContain('absurd')
  })

  it('buildImagePromptComposeUserMessage includes resolved template', () => {
    const profile = getDefaultMonitorProfile({ backgroundPresetId: 'Warm film grain' })
    const msg = buildImagePromptComposeUserMessage(profile, {
      sampleTitles: ['Storm warning'],
      phrase: 'thunder phrase'
    })
    expect(msg).toContain('Storm warning')
    expect(msg).not.toContain('{{samples}}')
  })
})
