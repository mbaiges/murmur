import { describe, expect, it } from 'vitest'
import {
  createMonitorConfig,
  ensureMonitorsForScreens
} from '../../../../../src/core/lib/config/monitorProfiles'
import { getDefaultMonitorProfile } from '../../../../../src/core/lib/config/defaultMonitorProfile'
import type { MurmurConfig } from '../../../../../src/core/domain/types'

function baseConfig(monitors: MurmurConfig['monitors']): MurmurConfig {
  return {
    configVersion: 2,
    geminiApiKey: 'k',
    refreshIntervalMinutes: 60,
    launchAtLogin: false,
    monitors
  }
}

describe('ensureMonitorsForScreens', () => {
  it('seeds a newly seen screen id from an existing profile with feeds', () => {
    const config = baseConfig([
      createMonitorConfig('old-display', getDefaultMonitorProfile({ feeds: ['https://news.example/rss'] }))
    ])
    const { config: next, dirty } = ensureMonitorsForScreens(config, [{ id: 'new-electron-id' }])
    expect(dirty).toBe(true)
    const created = next.monitors.find((m) => m.id === 'new-electron-id')
    expect(created?.profile.feeds).toEqual(['https://news.example/rss'])
  })
})
