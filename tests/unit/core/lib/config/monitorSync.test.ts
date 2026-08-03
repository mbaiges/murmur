import { describe, expect, it } from 'vitest'
import { propagateProfilePatch } from '../../../../../src/core/lib/config/monitorSync'
import { applyMonitorProfileSave } from '../../../../../src/renderer/features/settings/hooks/useScopedMonitorSave'
import { createMonitorConfig } from '../../../../../src/core/lib/config/monitorProfiles'
import { getDefaultMonitorProfile } from '../../../../../src/core/lib/config/defaultMonitorProfile'
import type { MurmurConfig } from '../../../../../src/core/domain/types'

function baseConfig(): MurmurConfig {
  const a = createMonitorConfig('a', getDefaultMonitorProfile({ language: 'en' }))
  const b = createMonitorConfig('b', getDefaultMonitorProfile({ language: 'es' }))
  return {
    configVersion: 2,
    geminiApiKey: 'k',
    refreshIntervalMinutes: 60,
    launchAtLogin: false,
    monitors: [a, b]
  }
}

describe('monitorSync', () => {
  it('propagates voice patch to synced monitors', () => {
    const config = baseConfig()
    const next = propagateProfilePatch(config, 'a', 'voice', { language: 'fr' })
    expect(next.monitors.find((m) => m.id === 'b')?.profile.language).toBe('fr')
  })

  it('does not propagate when source sync is off', () => {
    const config = baseConfig()
    config.monitors[0].syncVoice = false
    const next = propagateProfilePatch(config, 'a', 'voice', { language: 'fr' })
    expect(next.monitors.find((m) => m.id === 'b')?.profile.language).toBe('es')
    expect(next.monitors.find((m) => m.id === 'a')?.profile.language).toBe('fr')
  })

  it('applyMonitorProfileSave respects syncStyle off on source display', () => {
    const config = baseConfig()
    config.monitors[0].syncStyle = false
    config.monitors[0].profile.theme = 'Midnight'
    config.monitors[1].profile.theme = 'Drift'
    const next = applyMonitorProfileSave(config, 'a', 'style', { theme: 'Forest' })
    expect(next.monitors.find((m) => m.id === 'a')?.profile.theme).toBe('Forest')
    expect(next.monitors.find((m) => m.id === 'b')?.profile.theme).toBe('Drift')
    expect(next.monitors[0].syncStyle).toBe(false)
  })
})
