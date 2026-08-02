import { describe, expect, it } from 'vitest'
import {
  classifyConfigDelta,
  draftFieldsEqual,
  pickDraftFields
} from '../../../../../src/core/lib/presets/configDelta'
import {
  AESTHETIC_MOOD_IDS,
  applyAestheticMood
} from '../../../../../src/core/lib/presets/aestheticMoods'
import { createMonitorConfig } from '../../../../../src/core/lib/config/monitorProfiles'
import { getDefaultMonitorProfile } from '../../../../../src/core/lib/config/defaultMonitorProfile'
import type { MonitorProfile, MurmurConfig } from '../../../../../src/core/domain/types'

function configWithProfile(profilePatch: Partial<MonitorProfile>, id = 'm1'): MurmurConfig {
  return {
    configVersion: 2,
    geminiApiKey: 'k',
    refreshIntervalMinutes: 60,
    launchAtLogin: false,
    monitors: [createMonitorConfig(id, { ...getDefaultMonitorProfile(), ...profilePatch })]
  }
}

function withProfilePatch(base: MurmurConfig, patch: Partial<MonitorProfile>): MurmurConfig {
  return {
    ...base,
    monitors: base.monitors.map((m) => ({
      ...m,
      profile: { ...m.profile, ...patch, overlays: { ...m.profile.overlays, ...(patch.overlays ?? {}) } }
    }))
  }
}

describe('classifyConfigDelta', () => {
  it('returns none when profile unchanged', () => {
    const c = configWithProfile({})
    expect(classifyConfigDelta(c, { ...c })).toBe('none')
  })

  it('returns visual for theme-only change', () => {
    const prev = configWithProfile({ theme: 'Midnight' })
    const next = withProfilePatch(prev, { theme: 'Drift' })
    expect(classifyConfigDelta(prev, next)).toBe('visual')
  })

  it('returns content for tone change', () => {
    const prev = configWithProfile({ tonePreset: 'none' })
    const next = withProfilePatch(prev, { tonePreset: 'neutral' })
    expect(classifyConfigDelta(prev, next)).toBe('content')
  })
})

describe('draftFieldsEqual', () => {
  it('detects profile draft changes', () => {
    const a = getDefaultMonitorProfile()
    const b = { ...a, theme: 'Forest' as const }
    expect(draftFieldsEqual(a, b)).toBe(false)
  })
})

describe('pickDraftFields', () => {
  it('returns overlay copy', () => {
    const p = getDefaultMonitorProfile()
    const picked = pickDraftFields(p)
    expect(picked.overlays).toEqual(p.overlays)
    expect(picked.overlays).not.toBe(p.overlays)
  })
})

describe('mood Apply parity', () => {
  it('mood keys are draft fields', () => {
    for (const moodId of AESTHETIC_MOOD_IDS) {
      const updates = applyAestheticMood(moodId)
      const merged = { ...getDefaultMonitorProfile(), ...updates }
      expect(pickDraftFields(merged).theme).toBeDefined()
    }
  })
})
