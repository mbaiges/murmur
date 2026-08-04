import { describe, expect, it } from 'vitest'
import { resolveBackgroundInstructions } from '../../../../../src/core/lib/presets/backgroundPromptPresets'
import { getDefaultMonitorProfile } from '../../../../../src/core/lib/config/defaultMonitorProfile'

describe('backgroundPromptPresets', () => {
  it('uses custom text when preset is Custom', () => {
    const profile = getDefaultMonitorProfile({
      backgroundPresetId: 'Custom',
      customBackgroundPrompt: '  fog and mirrors  '
    })
    expect(resolveBackgroundInstructions(profile)).toBe('fog and mirrors')
  })

  it('uses preset instructions for Abstract mood', () => {
    const profile = getDefaultMonitorProfile({ backgroundPresetId: 'Abstract mood' })
    expect(resolveBackgroundInstructions(profile)).toContain('Abstract wallpaper')
  })
})
