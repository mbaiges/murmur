import { describe, expect, it } from 'vitest'
import { shouldRegeneratePhraseAfterAppearanceChange } from '../../../../../src/core/lib/presets/appearanceRegenerate'
import { createMonitorConfig } from '../../../../../src/core/lib/config/monitorProfiles'
import { getDefaultMonitorProfile } from '../../../../../src/core/lib/config/defaultMonitorProfile'
import type { MonitorProfile, MurmurConfig } from '../../../../../src/core/domain/types'

function configWithProfile(profile: MonitorProfile): MurmurConfig {
  return {
    configVersion: 2,
    geminiApiKey: 'k',
    refreshIntervalMinutes: 60,
    launchAtLogin: false,
    monitors: [createMonitorConfig('m1', profile)]
  }
}

function withProfilePatch(base: MurmurConfig, patch: Partial<MonitorProfile>): MurmurConfig {
  return {
    ...base,
    monitors: base.monitors.map((m) => ({
      ...m,
      profile: { ...m.profile, ...patch }
    }))
  }
}

const base = () => configWithProfile(getDefaultMonitorProfile())

describe('shouldRegeneratePhraseAfterAppearanceChange tone', () => {
  it('does not regenerate for theme-only change', () => {
    const prev = base()
    const next = withProfilePatch(prev, { theme: 'Drift' })
    expect(shouldRegeneratePhraseAfterAppearanceChange(prev, next)).toBe(false)
  })

  it('regenerates when tonePreset changes', () => {
    const prev = base()
    const next = withProfilePatch(prev, { tonePreset: 'neutral' })
    expect(shouldRegeneratePhraseAfterAppearanceChange(prev, next)).toBe(true)
  })

  it('regenerates when customToneText changes', () => {
    const prev = configWithProfile(
      getDefaultMonitorProfile({ tonePreset: 'custom', customToneText: 'a' })
    )
    const next = withProfilePatch(prev, { customToneText: 'b' })
    expect(shouldRegeneratePhraseAfterAppearanceChange(prev, next)).toBe(true)
  })
})
